import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { confirmAppointment } from "@/lib/booking";
import { Prisma } from "@prisma/client";
import { generatePreVisitSummary } from "@/lib/llm";

const bodySchema = z.object({ symptoms: z.string().min(1) });

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session || !session.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (session.user.role !== "PATIENT") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const patientId = session.user.id as string;
  const appointmentId = params.id;

  try {
    const body = await request.json();
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

    const { symptoms } = parsed.data;

    // Verify appointment exists and belongs to patient
    const appointment = await prisma.appointment.findUnique({ where: { id: appointmentId } });
    if (!appointment || appointment.patientId !== patientId) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // Find most recent COMPLETED appointment with same doctor
    const prior = await prisma.appointment.findFirst({
      where: { patientId, doctorProfileId: appointment.doctorProfileId, status: "COMPLETED" },
      orderBy: { updatedAt: "desc" },
      include: { symptomForm: true, visitNote: true },
    });

    const priorVisitContext =
      prior && prior.visitNote && prior.symptomForm && prior.symptomForm.chiefComplaint
        ? {
            chiefComplaint: prior.symptomForm.chiefComplaint,
            clinicalNotes: prior.visitNote.clinicalNotes,
            visitDate: prior.updatedAt,
          }
        : null;

    // Step 5: confirm appointment (must happen before LLM but per spec we do confirmation then LLM)
    const confirmed = await confirmAppointment(appointmentId);

    // Step 6: call LLM
    const llmResult = await generatePreVisitSummary(symptoms, priorVisitContext);

    // Step 7: save SymptomForm linked 1:1 to appointment
    const sfData: unknown = {
      appointmentId,
      rawSymptoms: symptoms,
      urgency: llmResult.ok ? llmResult.data.urgency : null,
      chiefComplaint: llmResult.ok ? llmResult.data.chiefComplaint : null,
      suggestedQuestions: llmResult.ok ? llmResult.data.suggestedQuestions : null,
      urgencySignals: llmResult.ok ? llmResult.data.urgencySignals : null,
      changesSinceLastVisit: llmResult.ok ? llmResult.data.changesSinceLastVisit : null,
      llmError: llmResult.ok ? null : llmResult.error,
    };

    await prisma.symptomForm.upsert({
      where: { appointmentId },
      create: sfData as Prisma.SymptomFormCreateInput,
      update: sfData as Prisma.SymptomFormUpdateInput,
    });

    // Step 9: queue BOOKING_CONFIRMATION notifications for patient and doctor
    const doctorProfile = appointment.doctorProfileId ? await prisma.doctorProfile.findUnique({ where: { id: appointment.doctorProfileId }, select: { userId: true } }) : null;
    const notifications: Prisma.NotificationCreateManyInput[] = [];
    notifications.push({ userId: appointment.patientId, type: "BOOKING_CONFIRMATION", payload: (JSON.stringify({ appointmentId }) as unknown) as Prisma.InputJsonValue });
    if (doctorProfile?.userId) notifications.push({ userId: doctorProfile.userId, type: "BOOKING_CONFIRMATION", payload: (JSON.stringify({ appointmentId }) as unknown) as Prisma.InputJsonValue });

    if (notifications.length) await prisma.notification.createMany({ data: notifications, skipDuplicates: true });

    // Do not expose raw LLM error messages to clients — map errors to a generic message.
    const preVisitSafe = llmResult.ok
      ? { ok: true, data: llmResult.data }
      : { ok: false, error: "Pre-visit summary currently unavailable" };

    return NextResponse.json({ appointment: confirmed, preVisit: preVisitSafe });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
