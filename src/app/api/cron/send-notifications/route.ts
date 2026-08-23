import { NextResponse } from "next/server";
import { processNotificationQueue } from "@/lib/notifications";
import { prisma } from "@/lib/db";

function validateCronAuth(request: Request) {
  const auth = request.headers.get("authorization") || "";
  const secret = process.env.CRON_SECRET || "";
  return auth === `Bearer ${secret}`;
}

export async function GET(request: Request) {
  if (!validateCronAuth(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const pending = await prisma.notification.count({ where: { status: { in: ["PENDING", "RETRYING"] }, attempts: { lt: 5 } } });
    // kick off processing (decoupled)
    await processNotificationQueue();
    return NextResponse.json({ ok: true, pending });
  } catch (err) {
    console.error("cron send-notifications error", err);
    return NextResponse.json({ ok: false, error: "Internal server error" }, { status: 500 });
  }
}
