import { google } from "googleapis";
import { prisma } from "./db";

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "";
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || "";
const REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || "";

function getOAuthClient() {
  return new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);
}

export function getGoogleAuthUrl(state: string) {
  if (!CLIENT_ID || !CLIENT_SECRET || !REDIRECT_URI) return null;
  const oAuth2Client = getOAuthClient();
  const url = oAuth2Client.generateAuthUrl({ access_type: "offline", scope: ["https://www.googleapis.com/auth/calendar.events"], state });
  return url;
}

export async function exchangeCodeForTokens(code: string, userId: string) {
  if (!CLIENT_ID || !CLIENT_SECRET || !REDIRECT_URI) return { ok: false, error: "Google OAuth not configured" };
  try {
    const oAuth2Client = getOAuthClient();
    const { tokens } = await oAuth2Client.getToken(code);
    // Save tokens to user record
    await prisma.user.update({ where: { id: userId }, data: { googleAccessToken: tokens.access_token ?? null, googleRefreshToken: tokens.refresh_token ?? null, googleTokenExpiry: tokens.expiry_date ? new Date(tokens.expiry_date) : null } });
    return { ok: true };
  } catch (err) {
    console.error("Google token exchange failed");
    return { ok: false, error: (err as Error).message };
  }
}

type UserTokens = { googleAccessToken?: string | null; googleRefreshToken?: string | null };

async function buildAuthFromUserTokens(user: UserTokens | null) {
  if (!user) return null;
  if (!user.googleAccessToken && !user.googleRefreshToken) return null;
  const oAuth2Client = getOAuthClient();
  const creds: Record<string, string> = {};
  if (user.googleAccessToken) creds.access_token = user.googleAccessToken;
  if (user.googleRefreshToken) creds.refresh_token = user.googleRefreshToken;
  oAuth2Client.setCredentials(creds);
  return oAuth2Client;
}

export async function createCalendarEventsForAppointment(appointmentId: string) {
  try {
    const appt = await prisma.appointment.findUnique({ where: { id: appointmentId }, include: { slot: true, patient: true, doctorProfile: { include: { user: true } } } });
    if (!appt) return { ok: false, error: "Appointment not found" };

    const start = appt.slot?.startTime;
    const end = appt.slot?.endTime;
    const summary = `Appointment with ${appt.doctorProfile?.user?.name ?? "doctor"}`;

    // Patient
    const patient = await prisma.user.findUnique({ where: { id: appt.patientId }, select: { googleAccessToken: true, googleRefreshToken: true } });
    if (patient) {
      const auth = await buildAuthFromUserTokens(patient as UserTokens);
      if (auth) {
        try {
          const calendar = google.calendar({ version: "v3", auth });
          const ev = await calendar.events.insert({ calendarId: "primary", requestBody: { summary, start: { dateTime: start?.toISOString() }, end: { dateTime: end?.toISOString() } } });
          const eventId = ev.data.id ?? null;
          if (eventId) await prisma.appointment.update({ where: { id: appointmentId }, data: { googleEventIdPatient: eventId } });
        } catch (err) {
          console.warn("Failed to create patient calendar event", err);
        }
      }
    }

    // Doctor
    const doctorUser = appt.doctorProfile?.user;
    if (doctorUser) {
      const doctorTokens = await prisma.user.findUnique({ where: { id: doctorUser.id }, select: { googleAccessToken: true, googleRefreshToken: true } });
      const auth = await buildAuthFromUserTokens(doctorTokens as UserTokens);
      if (auth) {
        try {
          const calendar = google.calendar({ version: "v3", auth });
          const ev = await calendar.events.insert({ calendarId: "primary", requestBody: { summary, start: { dateTime: start?.toISOString() }, end: { dateTime: end?.toISOString() } } });
          const eventId = ev.data.id ?? null;
          if (eventId) await prisma.appointment.update({ where: { id: appointmentId }, data: { googleEventIdDoctor: eventId } });
        } catch (err) {
          console.warn("Failed to create doctor calendar event", err);
        }
      }
    }

    return { ok: true };
  } catch (err) {
    console.error(err);
    return { ok: false, error: (err as Error).message };
  }
}

export async function deleteCalendarEventsForAppointment(appointmentId: string) {
  try {
    const appt = await prisma.appointment.findUnique({ where: { id: appointmentId }, include: { patient: true, doctorProfile: { include: { user: true } } } });
    if (!appt) return { ok: false, error: "Appointment not found" };

    const patient = appt.patient;
    if (appt.googleEventIdPatient && patient) {
      try {
        const auth = await buildAuthFromUserTokens({ googleAccessToken: patient.googleAccessToken ?? null, googleRefreshToken: patient.googleRefreshToken ?? null });
        if (auth) {
          const calendar = google.calendar({ version: "v3", auth });
          await calendar.events.delete({ calendarId: "primary", eventId: appt.googleEventIdPatient });
        }
      } catch (err) {
        console.warn("Failed to delete patient event", err);
      }
    }

    const doctorUser = appt.doctorProfile?.user;
    if (appt.googleEventIdDoctor && doctorUser) {
      try {
        const tokens = await prisma.user.findUnique({ where: { id: doctorUser.id }, select: { googleAccessToken: true, googleRefreshToken: true } });
        const auth = await buildAuthFromUserTokens(tokens as UserTokens);
        if (auth) {
          const calendar = google.calendar({ version: "v3", auth });
          await calendar.events.delete({ calendarId: "primary", eventId: appt.googleEventIdDoctor });
        }
      } catch (err) {
        console.warn("Failed to delete doctor event", err);
      }
    }

    return { ok: true };
  } catch (err) {
    console.error(err);
    return { ok: false, error: (err as Error).message };
  }
}
