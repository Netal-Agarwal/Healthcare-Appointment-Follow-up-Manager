import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getGoogleAuthUrl } from "@/lib/calendar";

export async function GET() {
  const session = await auth();
  if (!session || !session.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const state = encodeURIComponent(JSON.stringify({ userId: session.user.id }));
  const url = getGoogleAuthUrl(state);
  if (!url) return NextResponse.json({ error: "Google OAuth not configured" }, { status: 500 });

  return NextResponse.redirect(url);
}
