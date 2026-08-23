import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { cancelAppointment } from "@/lib/booking";
import { Role, Prisma } from "@prisma/client";

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session || !session.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = session.user.id as string;
  const appointmentId = params.id;

  try {
    const appointment = await prisma.appointment.findUnique({ where: { id: appointmentId } });
    if (!appointment) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const role = session.user.role as Role;

    if (role === Role.PATIENT && appointment.patientId !== userId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    if (role === Role.DOCTOR) {
      const doctor = await prisma.doctorProfile.findUnique({ where: { userId } });
      if (!doctor || doctor.id !== appointment.doctorProfileId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // ADMIN may cancel any appointment
    const cancelled = await cancelAppointment(appointmentId);

    // Queue CANCELLATION notifications for both patient and doctor
    const doctorProfile = await prisma.doctorProfile.findUnique({ where: { id: appointment.doctorProfileId } });
    const notifications: Prisma.NotificationCreateManyInput[] = [];
    notifications.push({ userId: appointment.patientId, type: "CANCELLATION", payload: (JSON.stringify({ appointmentId }) as unknown) as Prisma.InputJsonValue });
    if (doctorProfile?.userId) notifications.push({ userId: doctorProfile.userId, type: "CANCELLATION", payload: (JSON.stringify({ appointmentId }) as unknown) as Prisma.InputJsonValue });

    if (notifications.length) await prisma.notification.createMany({ data: notifications, skipDuplicates: true });

    return NextResponse.json({ cancelled });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
