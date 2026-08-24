import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { exchangeCodeForTokens } from "@/lib/calendar";

export async function GET(request: Request) {
  const session = await auth();
  if (!session || !session.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const expectedState = request.headers.get("cookie")?.match(/(?:^|; )healthfollow_google_state=([^;]+)/)?.[1];

  if (!code || !state || state !== expectedState) return NextResponse.json({ error: "Invalid Google authorization response" }, { status: 400 });

  // Exchange code and associate tokens with user (ignore result for UX)
  const result = await exchangeCodeForTokens(code, session.user.id as string);
  if (!result.ok) return NextResponse.redirect(new URL("/patient?calendar=error", url));
  const destination = session.user.role === "DOCTOR" ? "/doctor" : session.user.role === "ADMIN" ? "/admin" : "/patient";
  const response = NextResponse.redirect(new URL(`${destination}?calendar=connected`, url));
  response.cookies.set("healthfollow_google_state", "", { httpOnly: true, path: "/api/auth/google", maxAge: 0 });
  return response;
}
