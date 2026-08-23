import * as db from "./db";

export class SlotUnavailableError extends Error {
  constructor(message = "Slot is unavailable") {
    super(message);
    this.name = "SlotUnavailableError";
  }
}

const HOLD_MINUTES = 10;

export async function holdSlot(slotId: string, patientId: string) {
  return db.prisma.$transaction(async (tx) => {
    const slot = await tx.slot.findUnique({ where: { id: slotId } });
    if (!slot) throw new SlotUnavailableError("Slot not found");

    const now = new Date();
    const newHeldUntil = new Date(now.getTime() + HOLD_MINUTES * 60 * 1000);

    // NOTE: The following conditional updateMany is the atomic compare-and-set.
    // The initial findUnique above is informational only; the updateMany WHERE
    // clause re-checks the slot's availability inside the same transaction.
    // Because updateMany performs the conditional update as a single SQL
    // statement, two concurrent requests cannot both succeed in acquiring
    // the same slot: only one updateMany will report count === 1.
    const updateResult = await tx.slot.updateMany({
      where: {
        id: slotId,
        OR: [
          { status: "AVAILABLE" },
          {
            AND: [
              { status: "HELD" },
              { heldUntil: { lt: now } },
            ],
          },
        ],
      },
      data: {
        status: "HELD",
        heldUntil: newHeldUntil,
      },
    });

    if (updateResult.count === 0) {
      throw new SlotUnavailableError();
    }

    // Only after successfully acquiring the slot create the appointment.
    // Respect the Appointment.slotId @unique constraint — creation will fail
    // if another appointment already exists for this slot.
    const appointment = await tx.appointment.create({
      data: {
        slotId: slot.id,
        patientId,
        doctorProfileId: slot.doctorProfileId,
        status: "PENDING",
      },
    });

    const updatedSlot = await tx.slot.findUnique({ where: { id: slotId } });

    return { appointment, slot: updatedSlot };
  });
}

export async function confirmAppointment(appointmentId: string) {
  return db.prisma.$transaction(async (tx) => {
    const appointment = await tx.appointment.findUnique({
      where: { id: appointmentId },
      include: { slot: true },
    });
    if (!appointment) throw new SlotUnavailableError("Appointment not found");

    const slot = appointment.slot;
    const now = new Date();

    if (appointment.status !== "PENDING") {
      throw new SlotUnavailableError("Appointment is not pending");
    }
    if (!slot || slot.status !== "HELD") {
      throw new SlotUnavailableError("Slot is not held");
    }
    if (!slot.heldUntil || slot.heldUntil <= now) {
      throw new SlotUnavailableError("Hold expired");
    }

    // Atomic conditional update: only update slot if it is still HELD and not expired.
    const updated = await tx.slot.updateMany({
      where: {
        id: slot.id,
        status: "HELD",
        heldUntil: { gt: now },
      },
      data: {
        status: "BOOKED",
        heldUntil: null,
      },
    });

    if (updated.count === 0) {
      throw new SlotUnavailableError();
    }

    const confirmed = await tx.appointment.update({
      where: { id: appointmentId },
      data: { status: "CONFIRMED" },
      include: { slot: true, patient: true },
    });

    return confirmed;
  });
}

export async function cancelAppointment(appointmentId: string) {
  return db.prisma.$transaction(async (tx) => {
    const appointment = await tx.appointment.findUnique({
      where: { id: appointmentId },
      include: { slot: true },
    });
    if (!appointment) return null;

    const slot = appointment.slot;

    // Decide whether to release the slot. Do not make a BOOKED slot available
    // if the appointment has been completed.
    if (slot) {
      const shouldReleaseSlot =
        slot.status === "HELD" ||
        (slot.status === "BOOKED" && appointment.status !== "COMPLETED");

      if (shouldReleaseSlot) {
        await tx.slot.updateMany({
          where: {
            id: slot.id,
            OR: [{ status: "HELD" }, { status: "BOOKED" }],
          },
          data: { status: "AVAILABLE", heldUntil: null },
        });
      }
    }

    const cancelled = await tx.appointment.update({
      where: { id: appointmentId },
      data: { status: "CANCELLED" },
      include: { slot: true, patient: true },
    });

    return cancelled;
  });
}

export async function releaseExpiredHolds(): Promise<number> {
  return db.prisma.$transaction(async (tx) => {
    const now = new Date();
    const result = await tx.slot.updateMany({
      where: { status: "HELD", heldUntil: { lt: now } },
      data: { status: "AVAILABLE", heldUntil: null },
    });
    return result.count;
  });
}

