import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { holdSlot, SlotUnavailableError } from "@/lib/booking";
import { Role } from "@prisma/client";

const bodySchema = z.object({ slotId: z.string().min(1) });

export async function POST(request: Request) {
  const session = await auth();
  if (!session || !session.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.user.role !== Role.PATIENT) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request" , details: parsed.error.flatten() }, { status: 400 });
    }

    const { slotId } = parsed.data;
    const patientId = session.user.id as string;

    try {
      const result = await holdSlot(slotId, patientId);
      return NextResponse.json(result, { status: 201 });
    } catch (e) {
      if (e instanceof SlotUnavailableError) {
        return NextResponse.json({ error: "This slot was just booked by someone else. Please pick another." }, { status: 409 });
      }
      throw e;
    }
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
