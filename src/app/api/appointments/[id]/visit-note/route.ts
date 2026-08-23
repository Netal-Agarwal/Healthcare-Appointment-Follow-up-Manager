import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { generatePostVisitSummary } from "@/lib/llm";
import { Role, Prisma } from "@prisma/client";

const prescriptionItem = z.object({
  medication: z.string().min(1),
  dosage: z.string().min(1),
  frequencyPerDay: z.number().int().min(1).max(24),
  durationDays: z.number().int().min(1),
});

const bodySchema = z.object({
  clinicalNotes: z.string().min(1),
  prescription: z.array(prescriptionItem).optional().default([]),
});

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session || !session.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== Role.DOCTOR) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const doctorUserId = session.user.id as string;
  const appointmentId = params.id;

  try {
    const body = await request.json();
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Invalid request", details: parsed.error.flatten() }, { status: 400 });

    const { clinicalNotes, prescription } = parsed.data;

    // Verify appointment exists and belongs to this doctor's profile
    const doctorProfile = await prisma.doctorProfile.findUnique({ where: { userId: doctorUserId } });
    if (!doctorProfile) return NextResponse.json({ error: "Doctor profile not found" }, { status: 404 });

    const appointment = await prisma.appointment.findUnique({ where: { id: appointmentId }, include: { slot: true } });
    if (!appointment) return NextResponse.json({ error: "Appointment not found" }, { status: 404 });
    if (appointment.doctorProfileId !== doctorProfile.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    // If VisitNote already exists, return it to keep operation idempotent
    const existingVisitNote = await prisma.visitNote.findUnique({ where: { appointmentId } });
    if (existingVisitNote) {
      return NextResponse.json({ visitNote: existingVisitNote }, { status: 200 });
    }

    // Call LLM but do not block on failure
    const llmResult = await generatePostVisitSummary(clinicalNotes);
    const patientSummary = llmResult.ok ? llmResult.data : null;
    const llmError = llmResult.ok ? null : llmResult.error;

    // Save VisitNote and mark appointment COMPLETED in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const vn = await tx.visitNote.create({
        data: {
          appointmentId,
          clinicalNotes,
          prescription: (prescription.length ? (prescription as unknown) : []) as Prisma.InputJsonValue,
          patientSummary: patientSummary ?? null,
          llmError: llmError ?? null,
        },
      });

      await tx.appointment.update({ where: { id: appointmentId }, data: { status: "COMPLETED" } });

      // Create MedicationReminders
      const slotStart = appointment.slot?.startTime ?? new Date();
      const startDate = new Date(slotStart.getFullYear(), slotStart.getMonth(), slotStart.getDate());

      for (const item of prescription) {
        const medication = item.medication;
        const frequencyPerDay = item.frequencyPerDay;
        const durationDays = item.durationDays;
        for (let d = 0; d < durationDays; d++) {
          const day = new Date(startDate.getTime() + d * 24 * 60 * 60 * 1000);
          // distribute between 8:00 and 20:00
          const windowStart = 8 * 60; // minutes
          const windowEnd = 20 * 60; // minutes
          const totalWindow = windowEnd - windowStart;
          const slots = frequencyPerDay;
          for (let k = 0; k < slots; k++) {
            const minutes = windowStart + Math.round((k * totalWindow) / Math.max(1, slots - 1));
            const hh = Math.floor(minutes / 60);
            const mm = minutes % 60;
            const scheduledAt = new Date(day.getFullYear(), day.getMonth(), day.getDate(), hh, mm, 0);

            // Avoid duplicates: check existing reminder for same visitNote (none yet) and same scheduledAt+medication
            await tx.medicationReminder.create({
              data: {
                visitNoteId: vn.id,
                medication,
                scheduledAt,
                sent: false,
              },
            });
          }
        }
      }

      return { visitNote: vn };
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
