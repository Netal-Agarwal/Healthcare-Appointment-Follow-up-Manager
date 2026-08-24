import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { holdSlot, SlotUnavailableError } from "@/lib/booking";
import { Role } from "@prisma/client";

const bodySchema = z.object({ slotId: z.string().min(1) });

export async function POST(request: Request) {
  const session = await auth();
  if (!session || !session.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.user.role !== Role.PATIENT) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request" , details: parsed.error.flatten() }, { status: 400 });
    }

    const { slotId } = parsed.data;
    const patientId = session.user.id as string;

    try {
      const result = await holdSlot(slotId, patientId);
      return NextResponse.json(result, { status: 201 });
    } catch (e) {
      if (e instanceof SlotUnavailableError) {
        return NextResponse.json({ error: "This slot was just booked by someone else. Please pick another." }, { status: 409 });
      }
      throw e;
    }
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET() {
  const session = await auth();
  if (!session || !session.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== Role.PATIENT) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const patientId = session.user.id as string;
  try {
    const appts = await prisma.appointment.findMany({
      where: { patientId },
      include: {
        slot: true,
        doctorProfile: { include: { user: true } },
        symptomForm: true,
        visitNote: { include: { medicationReminders: true } },
      },
      orderBy: { slot: { startTime: 'asc' } },
    });

    const safe = appts.map((a) => ({
      id: a.id,
      status: a.status,
      slot: a.slot ? { id: a.slot.id, startTime: a.slot.startTime, endTime: a.slot.endTime } : null,
      doctor: a.doctorProfile ? { id: a.doctorProfile.id, name: a.doctorProfile.user?.name ?? null, specialisation: a.doctorProfile.specialisation } : null,
      symptomForm: a.symptomForm ? { rawSymptoms: a.symptomForm.rawSymptoms, chiefComplaint: a.symptomForm.chiefComplaint ?? null, urgency: a.symptomForm.urgency ?? null, changesSinceLastVisit: a.symptomForm.changesSinceLastVisit ?? null, suggestedQuestions: a.symptomForm.suggestedQuestions ?? null, urgencySignals: a.symptomForm.urgencySignals ?? null } : null,
      visitNote: a.visitNote ? { patientSummary: a.visitNote.patientSummary ?? null, prescription: a.visitNote.prescription ?? null, medicationReminders: a.visitNote.medicationReminders ?? [] } : null,
    }));

    return NextResponse.json({ appointments: safe });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
