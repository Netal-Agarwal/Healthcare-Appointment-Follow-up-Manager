import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session || !session.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { googleRefreshToken: true, googleAccessToken: true, googleTokenExpiry: true } });
    const connected = !!(user && (user.googleRefreshToken || user.googleAccessToken));
    return NextResponse.json({ connected });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
