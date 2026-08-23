import { NextResponse } from "next/server";
import { releaseExpiredHolds } from "@/lib/booking";

function validateCronAuth(request: Request) {
  const auth = request.headers.get("authorization") || "";
  const secret = process.env.CRON_SECRET || "";
  return auth === `Bearer ${secret}`;
}

export async function GET(request: Request) {
  if (!validateCronAuth(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const released = await releaseExpiredHolds();
    return NextResponse.json({ ok: true, released });
  } catch (err) {
    console.error("cron release-holds error", err);
    return NextResponse.json({ ok: false, error: "Internal server error" }, { status: 500 });
  }
}
