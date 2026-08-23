import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { queueNotification } from "@/lib/notifications";

function validateCronAuth(request: Request) {
  const auth = request.headers.get("authorization") || "";
  const secret = process.env.CRON_SECRET || "";
  return auth === `Bearer ${secret}`;
}

export async function GET(request: Request) {
  if (!validateCronAuth(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const now = new Date();
    const due = await prisma.medicationReminder.findMany({ where: { scheduledAt: { lte: now }, sent: false }, include: { visitNote: { include: { appointment: true } } } });

    let processed = 0;
    let queued = 0;

    for (const r of due) {
      // mark as sent atomically if not already sent
      const res = await prisma.medicationReminder.updateMany({ where: { id: r.id, sent: false }, data: { sent: true } });
      if (res.count === 0) continue;
      processed++;

      const patientId = r.visitNote?.appointment?.patientId;
      if (!patientId) continue;

      // queue minimal notification payload
      await queueNotification(patientId, "MEDICATION_REMINDER", { reminderId: r.id, scheduledAt: r.scheduledAt });
      queued++;
    }

    return NextResponse.json({ ok: true, processed, queued });
  } catch (err) {
    console.error("cron medication-reminders error", err);
    return NextResponse.json({ ok: false, error: "Internal server error" }, { status: 500 });
  }
}
