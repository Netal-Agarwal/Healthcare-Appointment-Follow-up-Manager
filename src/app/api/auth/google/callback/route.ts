import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { exchangeCodeForTokens } from "@/lib/calendar";

export async function GET(request: Request) {
  const session = await auth();
  if (!session || !session.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  // state may be present but is not required here

  if (!code) return NextResponse.json({ error: "Missing code" }, { status: 400 });

  // Exchange code and associate tokens with user (ignore result for UX)
  await exchangeCodeForTokens(code, session.user.id as string);
  return NextResponse.redirect(new URL("/dashboard", url).toString());
}
