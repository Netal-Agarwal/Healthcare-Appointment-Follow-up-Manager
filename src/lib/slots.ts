import * as db from "./db";
import * as dateFns from "date-fns";

export async function generateSlotsForDoctor(doctorProfileId: string, daysAhead = 14) {
  return db.prisma.$transaction(async (tx) => {
    const doctor = await tx.doctorProfile.findUnique({
      where: { id: doctorProfileId },
      include: { workingHours: true, leaveDays: true },
    });

    if (!doctor) throw new Error("Doctor not found");

    const { workingHours, leaveDays, slotDurationMinutes } = doctor;
    const duration = slotDurationMinutes || 30;

    const leaveDatesSet = new Set(leaveDays.map((ld) => dateFns.format(new Date(ld.date), "yyyy-MM-dd")));

    const today = dateFns.startOfDay(new Date());
    const createdOrExisting: unknown[] = [];

    for (let i = 0; i < daysAhead; i++) {
      const target = dateFns.addDays(today, i);
      const dateStr = dateFns.format(target, "yyyy-MM-dd");
      if (leaveDatesSet.has(dateStr)) continue;

      const dayOfWeek = target.getDay();
      const dayWorking = workingHours.filter((w) => w.dayOfWeek === dayOfWeek);
      if (!dayWorking.length) continue;

      for (const wh of dayWorking) {
        const [sh, sm] = wh.startTime.split(":").map(Number);
        const [eh, em] = wh.endTime.split(":").map(Number);

        let cursor = dateFns.setMinutes(dateFns.setHours(dateFns.startOfDay(target), sh), sm);
        const dayEnd = dateFns.setMinutes(dateFns.setHours(dateFns.startOfDay(target), eh), em);

        while (cursor.getTime() + duration * 60 * 1000 <= dayEnd.getTime()) {
          const slotStart = new Date(cursor);
          const slotEnd = new Date(cursor.getTime() + duration * 60 * 1000);

          // Use upsert based on unique (doctorProfileId, startTime). Empty update
          // keeps existing records unchanged (preserves BOOKED/HELD/CANCELLED).
          const slot = await tx.slot.upsert({
            where: { doctorProfileId_startTime: { doctorProfileId, startTime: slotStart } },
            create: {
              doctorProfileId,
              startTime: slotStart,
              endTime: slotEnd,
              status: "AVAILABLE",
            },
            update: {},
          });

          createdOrExisting.push(slot);
          cursor = slotEnd;
        }
      }
    }

    return createdOrExisting;
  });
}

export async function handleLeaveDay(doctorProfileId: string, date: Date) {
  return db.prisma.$transaction(async (tx) => {
    const start = dateFns.startOfDay(date);
    const end = dateFns.addDays(start, 1);

    const slots = await tx.slot.findMany({
      where: {
        doctorProfileId,
        startTime: { gte: start, lt: end },
        status: { in: ["HELD", "BOOKED"] },
      },
      include: { appointments: { where: { status: { in: ["PENDING", "CONFIRMED"] } }, include: { patient: true } } },
    });

    const appointmentIds = slots.flatMap((slot) => slot.appointments.map((appointment) => appointment.id));

    if (appointmentIds.length > 0) {
      await tx.appointment.updateMany({
        where: { id: { in: appointmentIds } },
        data: { status: "CANCELLED" },
      });
    }

    const slotIds = slots.map((s) => s.id);
    if (slotIds.length > 0) {
      await tx.slot.updateMany({
        where: { id: { in: slotIds } },
        data: { status: "CANCELLED", heldUntil: null },
      });
    }

    const affectedAppointments = slots.flatMap((slot) => slot.appointments);
    return affectedAppointments;
  });
}
