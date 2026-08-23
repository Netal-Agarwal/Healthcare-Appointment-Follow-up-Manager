import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";
import { Role } from "@prisma/client";

const passwordSaltRounds = 12;

const timeRe = /^([01]\d|2[0-3]):[0-5]\d$/;

const workingHourSchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6),
  startTime: z.string().regex(timeRe),
  endTime: z.string().regex(timeRe),
});

const createDoctorSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  specialisation: z.string().min(1),
  slotDurationMinutes: z.number().int().positive(),
  workingHours: z.array(workingHourSchema).min(1),
});

export async function POST(request: Request) {
  const session = await auth();
  if (!session || !session.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const body = await request.json();
    const parsed = createDoctorSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Invalid request" , details: parsed.error.format()}, { status: 400 });

    const { name, email, password, specialisation, slotDurationMinutes, workingHours } = parsed.data;

    // Perform creation inside a single transaction. First check for duplicate email within transaction.
    const result = await prisma.$transaction(async (tx) => {
      const existing = await tx.user.findUnique({ where: { email } });
      if (existing) {
        // Signal duplicate
        throw new Error("EMAIL_EXISTS");
      }

      const passwordHash = await bcrypt.hash(password, passwordSaltRounds);

      const user = await tx.user.create({ data: { name, email, passwordHash, role: Role.DOCTOR } });

      const doctor = await tx.doctorProfile.create({ data: { userId: user.id, specialisation, slotDurationMinutes } });

      // create working hours (unique constraint on doctorProfileId+dayOfWeek)
      for (const wh of workingHours) {
        await tx.workingHour.create({ data: { doctorProfileId: doctor.id, dayOfWeek: wh.dayOfWeek, startTime: wh.startTime, endTime: wh.endTime } });
      }

      return { userId: user.id, doctorProfileId: doctor.id };
    });

    // Fetch created doctor data to return (without secrets)
    const created = await prisma.user.findUnique({ where: { id: result.userId }, include: { doctorProfile: { include: { workingHours: true } } } });
    if (!created) return NextResponse.json({ error: "Creation failed" }, { status: 500 });

    const safeOut = {
      id: created.id,
      name: created.name,
      email: created.email,
      phone: created.phone ?? null,
      role: created.role,
      doctorProfile: created.doctorProfile
        ? {
            id: created.doctorProfile.id,
            specialisation: created.doctorProfile.specialisation,
            slotDurationMinutes: created.doctorProfile.slotDurationMinutes,
            workingHours: created.doctorProfile.workingHours.map((w) => ({ id: w.id, dayOfWeek: w.dayOfWeek, startTime: w.startTime, endTime: w.endTime })),
          }
        : null,
    };

    return NextResponse.json({ doctor: safeOut }, { status: 201 });
  } catch (err) {
    if ((err as Error).message === "EMAIL_EXISTS") return NextResponse.json({ error: "Email already exists" }, { status: 409 });
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET() {
  const session = await auth();
  if (!session || !session.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const doctors = await prisma.user.findMany({
      where: { role: Role.DOCTOR },
      orderBy: { name: "asc" },
      include: { doctorProfile: { include: { workingHours: true } } },
    });

    const out = doctors.map((d) => ({
      id: d.id,
      name: d.name,
      email: d.email,
      phone: d.phone ?? null,
      role: d.role,
      doctorProfile: d.doctorProfile
        ? {
            id: d.doctorProfile.id,
            specialisation: d.doctorProfile.specialisation,
            slotDurationMinutes: d.doctorProfile.slotDurationMinutes,
            workingHours: d.doctorProfile.workingHours.map((w) => ({ id: w.id, dayOfWeek: w.dayOfWeek, startTime: w.startTime, endTime: w.endTime })),
          }
        : null,
    }));

    return NextResponse.json({ doctors: out });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
