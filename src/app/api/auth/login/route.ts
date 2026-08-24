import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { setSessionCookie } from "@/lib/auth";
const schema = z.object({ email: z.string().email(), password: z.string().min(1) });
export async function POST(request: Request) { try { const parsed = schema.safeParse(await request.json()); if (!parsed.success) return NextResponse.json({ error: "Enter a valid email and password." }, { status: 400 }); const user = await prisma.user.findUnique({ where: { email: parsed.data.email.trim().toLowerCase() } }); if (!user?.passwordHash || !(await bcrypt.compare(parsed.data.password, user.passwordHash))) return NextResponse.json({ error: "Email or password is incorrect." }, { status: 401 }); return setSessionCookie(NextResponse.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role } }), { id: user.id, name: user.name, email: user.email, role: user.role }); } catch { return NextResponse.json({ error: "We could not sign you in. Please try again." }, { status: 500 }); } }
