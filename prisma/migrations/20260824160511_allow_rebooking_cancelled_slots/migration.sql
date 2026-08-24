-- DropIndex
DROP INDEX "Appointment_slotId_key";

-- CreateIndex
CREATE INDEX "Appointment_slotId_idx" ON "Appointment"("slotId");
