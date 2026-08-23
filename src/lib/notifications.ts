import sgMail, { MailDataRequired } from "@sendgrid/mail";
import { prisma } from "./db";
import { Prisma, NotificationType as PrismaNotificationType } from "@prisma/client";

type NotificationType = "BOOKING_CONFIRMATION" | "REMINDER" | "CANCELLATION" | "LEAVE_CONFLICT" | "MEDICATION_REMINDER";

if (process.env.SENDGRID_API_KEY) sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const processingIds = new Set<string>();

export async function queueNotification(userId: string, type: NotificationType, payload: unknown) {
  const notif = await prisma.notification.create({ data: { userId, type: type as unknown as PrismaNotificationType, payload: payload as Prisma.InputJsonValue } });
  return notif;
}

export async function processNotificationQueue() {
  if (!process.env.SENDGRID_API_KEY) {
    console.warn("SendGrid API key missing; skipping notification processing");
    return;
  }

  // fetch pending or retrying notifications with attempts < 5
  const items = await prisma.notification.findMany({ where: { status: { in: ["PENDING", "RETRYING"] }, attempts: { lt: 5 } }, orderBy: { createdAt: "asc" } });

  for (const item of items) {
    if (processingIds.has(item.id)) continue;
    processingIds.add(item.id);

    (async () => {
      try {
        const user = await prisma.user.findUnique({ where: { id: item.userId }, select: { email: true, name: true } });
        if (!user || !user.email) {
          await prisma.notification.update({ where: { id: item.id }, data: { attempts: { increment: 1 }, lastError: "No email for user", status: item.attempts + 1 >= 5 ? "FAILED" : "RETRYING" } });
          return;
        }

        // Build simple, non-sensitive email body based on type and payload
        let subject = "Notification";
        let text = "You have a notification.";
        try {
          const parsed = typeof item.payload === "string" ? JSON.parse(item.payload) : item.payload;
          if (item.type === "BOOKING_CONFIRMATION") {
            subject = "Booking confirmed";
            text = `Your appointment ${parsed?.appointmentId ?? ""} is confirmed.`;
          } else if (item.type === "CANCELLATION") {
            subject = "Appointment cancelled";
            text = `Your appointment ${parsed?.appointmentId ?? ""} has been cancelled.`;
          } else if (item.type === "LEAVE_CONFLICT") {
            subject = "Appointment affected by leave";
            text = `Your appointment ${parsed?.appointmentId ?? ""} was affected by a doctor's leave.`;
          } else if (item.type === "REMINDER") {
            subject = "Appointment reminder";
            text = `Reminder for appointment ${parsed?.appointmentId ?? ""}.`;
          } else if (item.type === "MEDICATION_REMINDER") {
            subject = "Medication reminder";
            text = `Medication reminder: ${parsed?.medication ?? ""} at ${parsed?.scheduledAt ?? ""}.`;
          }
        } catch {
          // fallback
          text = "You have a notification.";
        }

        const msg: MailDataRequired = {
          to: user.email,
          from: process.env.SENDGRID_FROM_EMAIL ?? "noreply@example.com",
          subject,
          text,
        };

        try {
          await sgMail.send(msg);
          await prisma.notification.update({ where: { id: item.id }, data: { status: "SENT", lastError: null } });
        } catch (sendErr) {
          const errMsg = (sendErr as Error).message ?? String(sendErr);
          const attempts = item.attempts + 1;
          const newStatus = attempts >= 5 ? "FAILED" : "RETRYING";
          await prisma.notification.update({ where: { id: item.id }, data: { attempts: attempts, lastError: errMsg, status: newStatus } });
        }
      } catch (err) {
        console.error("Notification processing error", err);
      } finally {
        processingIds.delete(item.id);
      }
    })();
  }
}
