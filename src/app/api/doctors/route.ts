import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function GET(request: Request) {
  const session = await auth();
  if (!session || !session.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const url = new URL(request.url);
    const specialisation = url.searchParams.get("specialisation") || undefined;

    const where = specialisation ? { specialisation } : {};

    const doctors = await prisma.doctorProfile.findMany({
      where,
      include: { user: true },
    });

    // Remove sensitive fields
    const safe = doctors.map((d) => ({
      id: d.id,
      user: {
        id: d.user.id,
        name: d.user.name,
        email: d.user.email,
      },
      specialisation: d.specialisation,
      slotDurationMinutes: d.slotDurationMinutes,
    }));

    return NextResponse.json({ doctors: safe });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
