import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { handleLeaveDay } from "@/lib/slots";
import { Prisma } from "@prisma/client";
import { deleteCalendarEventsForAppointment } from "@/lib/calendar";

const bodySchema = z.object({ date: z.string().refine((s) => !Number.isNaN(Date.parse(s)), { message: "Invalid date" }), reason: z.string().min(1) });

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session || !session.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const doctorUserId = params.id;

  try {
    const parsedBody = bodySchema.safeParse(await request.json());
    if (!parsedBody.success) return NextResponse.json({ error: "Invalid request", details: parsedBody.error.format() }, { status: 400 });
    const { date, reason } = parsedBody.data;

    // Verify user exists and is a DOCTOR and has a doctorProfile
    const user = await prisma.user.findUnique({ where: { id: doctorUserId }, select: { id: true, role: true, doctorProfile: { select: { id: true } }, name: true, email: true } });
    if (!user) return NextResponse.json({ error: "Doctor user not found" }, { status: 404 });
    if (user.role !== "DOCTOR") return NextResponse.json({ error: "User is not a doctor" }, { status: 400 });
    if (!user.doctorProfile) return NextResponse.json({ error: "Doctor profile not found" }, { status: 400 });

    const doctorProfileId = user.doctorProfile.id;
    const leaveDate = new Date(date);

    // Check for existing LeaveDay for this doctor/date
    const existing = await prisma.leaveDay.findFirst({ where: { doctorProfileId, date: leaveDate } });
    if (existing) return NextResponse.json({ error: "Leave day already exists for this date" }, { status: 409 });

    // Create LeaveDay
    const leaveDay = await prisma.leaveDay.create({ data: { doctorProfileId, date: leaveDate, reason } });

    // Call existing handler to cancel affected slots/appointments
    const affected = await handleLeaveDay(doctorProfileId, leaveDate);

    // Queue LEAVE_CONFLICT notifications for affected patients
    const notifications: Prisma.NotificationCreateManyInput[] = [];
    for (const appt of affected) {
      if (!appt) continue;
      if (appt.patientId) {
        notifications.push({ userId: appt.patientId, type: "LEAVE_CONFLICT", payload: (JSON.stringify({ appointmentId: appt.id, leaveDayId: leaveDay.id }) as unknown) as Prisma.InputJsonValue });
      }
    }

    if (notifications.length) await prisma.notification.createMany({ data: notifications, skipDuplicates: true });
    await Promise.all(affected.filter(Boolean).map((appointment) => deleteCalendarEventsForAppointment(appointment!.id)));

    // Build a safe response with limited patient info
    type AffectedAppointment = { id: string; patientId: string; patient?: { name?: string; email?: string } };
    const affectedPatients = affected
      .filter(Boolean)
      .map((a) => {
        const ap = a as unknown as AffectedAppointment;
        return { appointmentId: ap.id, patientId: ap.patientId, patientName: ap.patient?.name ?? null, patientEmail: ap.patient?.email ?? null };
      });

    return NextResponse.json({ leaveDay, affectedCount: affected.length, affectedPatients });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
