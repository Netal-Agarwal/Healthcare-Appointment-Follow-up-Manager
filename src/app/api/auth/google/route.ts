import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getGoogleAuthUrl } from "@/lib/calendar";
import { randomUUID } from "crypto";

export async function GET() {
  const session = await auth();
  if (!session || !session.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const state = randomUUID();
  const url = getGoogleAuthUrl(state);
  if (!url) return NextResponse.json({ error: "Google OAuth not configured" }, { status: 500 });

  const response = NextResponse.redirect(url);
  response.cookies.set("healthfollow_google_state", state, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/api/auth/google", maxAge: 600 });
  return response;
}
