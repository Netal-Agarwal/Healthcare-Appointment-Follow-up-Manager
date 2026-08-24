import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { Role } from "@prisma/client";
export const SESSION_COOKIE = "healthfollow_session";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 7;
export type SessionUser = { id: string; role: Role; name: string; email: string };
type SessionPayload = SessionUser & { exp: number };
const secret = () => process.env.AUTH_SESSION_SECRET || (process.env.NODE_ENV === "production" ? (() => { throw new Error("AUTH_SESSION_SECRET must be configured"); })() : "local-development-secret-change-me");
const encode = (value: string) => Buffer.from(value).toString("base64url");
const sign = (value: string) => createHmac("sha256", secret()).update(value).digest("base64url");
export function createSessionToken(user: SessionUser) { const payload: SessionPayload = { ...user, exp: Math.floor(Date.now() / 1000) + MAX_AGE_SECONDS }; const encoded = encode(JSON.stringify(payload)); return `${encoded}.${sign(encoded)}`; }
export function readSessionToken(token?: string | null): SessionUser | null { if (!token) return null; const [encoded, signature] = token.split("."); if (!encoded || !signature) return null; const expected = sign(encoded); if (signature.length !== expected.length || !timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return null; try { const payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")) as SessionPayload; return payload.id && Object.values(Role).includes(payload.role) && payload.exp > Math.floor(Date.now() / 1000) ? { id: payload.id, role: payload.role, name: payload.name, email: payload.email } : null; } catch { return null; } }
export async function getSession(): Promise<SessionUser | null> { return readSessionToken(cookies().get(SESSION_COOKIE)?.value); }
// Compatibility helper for server modules backed by the custom signed cookie.
export async function auth() { const user = await getSession(); return user ? { user } : null; }
export function setSessionCookie(response: NextResponse, user: SessionUser) { response.cookies.set(SESSION_COOKIE, createSessionToken(user), { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: MAX_AGE_SECONDS }); return response; }
export function clearSessionCookie(response: NextResponse) { response.cookies.set(SESSION_COOKIE, "", { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 0 }); return response; }
export async function requireRole(...roles: Role[]) { const user = await getSession(); return !user ? { user: null, status: 401 as const } : !roles.includes(user.role) ? { user: null, status: 403 as const } : { user, status: null }; }
