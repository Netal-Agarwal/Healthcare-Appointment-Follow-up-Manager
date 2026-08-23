import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { generateSlotsForDoctor } from "@/lib/slots";
import { releaseExpiredHolds } from "@/lib/booking";

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session || !session.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const doctorId = params.id;

  try {
    // Ensure slots exist (idempotent)
    await generateSlotsForDoctor(doctorId);

    // Release expired holds before showing availability
    await releaseExpiredHolds();

    const now = new Date();
    const slots = await prisma.slot.findMany({
      where: { doctorProfileId: doctorId, status: "AVAILABLE", startTime: { gte: now } },
      orderBy: { startTime: "asc" },
    });

    return NextResponse.json({ slots });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
