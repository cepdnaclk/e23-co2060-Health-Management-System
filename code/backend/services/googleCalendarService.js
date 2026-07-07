import {
  CALENDAR_TIME_ZONE,
  FRONTEND_ORIGIN,
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  GOOGLE_REDIRECT_URI
} from "../config/env.js";
import { randomUUID } from "crypto";

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_EVENTS_URL = "https://www.googleapis.com/calendar/v3/calendars/primary/events";
const CALENDAR_SCOPE = "https://www.googleapis.com/auth/calendar.events";
const connectedUsers = new Map();
const pendingStates = new Map();

function firstFrontendOrigin() {
  return FRONTEND_ORIGIN.split(",").map((value) => value.trim()).filter(Boolean)[0] || "http://localhost:5173";
}

function googleConfigured() {
  return Boolean(GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET && GOOGLE_REDIRECT_URI);
}

function appointmentDateRange(scheduledAt) {
  const start = new Date(scheduledAt);
  if (Number.isNaN(start.getTime())) return null;
  const end = new Date(start);
  end.setMinutes(end.getMinutes() + 30);
  return { start, end };
}

function toIso(date) {
  return date.toISOString();
}

async function postTokenRequest(params) {
  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(params)
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error_description || data.error || "Google token request failed");
  }
  return data;
}

export function getGoogleCalendarStatus(userId) {
  return {
    configured: googleConfigured(),
    connected: connectedUsers.has(String(userId))
  };
}

export function createGoogleAuthUrl(userId) {
  if (!googleConfigured()) {
    return { error: "Google Calendar is not configured on the backend." };
  }

  const state = randomUUID();
  pendingStates.set(state, { userId: String(userId), createdAt: Date.now() });

  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: GOOGLE_REDIRECT_URI,
    response_type: "code",
    scope: CALENDAR_SCOPE,
    access_type: "offline",
    prompt: "consent",
    state
  });

  return { url: `${GOOGLE_AUTH_URL}?${params.toString()}` };
}

export async function handleGoogleCallback({ code, state }) {
  if (!googleConfigured()) {
    return `${firstFrontendOrigin()}/?googleCalendar=not-configured`;
  }

  const pending = pendingStates.get(state);
  pendingStates.delete(state);
  if (!pending || Date.now() - pending.createdAt > 10 * 60 * 1000) {
    return `${firstFrontendOrigin()}/?googleCalendar=invalid-state`;
  }

  const tokenData = await postTokenRequest({
    code,
    client_id: GOOGLE_CLIENT_ID,
    client_secret: GOOGLE_CLIENT_SECRET,
    redirect_uri: GOOGLE_REDIRECT_URI,
    grant_type: "authorization_code"
  });

  connectedUsers.set(pending.userId, {
    accessToken: tokenData.access_token,
    refreshToken: tokenData.refresh_token,
    expiresAt: Date.now() + Number(tokenData.expires_in || 3600) * 1000
  });

  return `${firstFrontendOrigin()}/?googleCalendar=connected`;
}

async function accessTokenForUser(userId) {
  const key = String(userId);
  const tokens = connectedUsers.get(key);
  if (!tokens) return null;

  if (tokens.expiresAt - Date.now() > 60 * 1000) {
    return tokens.accessToken;
  }

  if (!tokens.refreshToken) {
    connectedUsers.delete(key);
    return null;
  }

  const tokenData = await postTokenRequest({
    client_id: GOOGLE_CLIENT_ID,
    client_secret: GOOGLE_CLIENT_SECRET,
    refresh_token: tokens.refreshToken,
    grant_type: "refresh_token"
  });

  const updated = {
    ...tokens,
    accessToken: tokenData.access_token,
    expiresAt: Date.now() + Number(tokenData.expires_in || 3600) * 1000
  };
  connectedUsers.set(key, updated);
  return updated.accessToken;
}

export async function createGoogleCalendarEvent({ userId, appointment }) {
  const accessToken = await accessTokenForUser(userId);
  if (!accessToken) {
    return { error: "Connect Google Calendar before creating an event.", status: 409 };
  }

  const range = appointmentDateRange(appointment.scheduled_at || appointment.scheduledAt);
  if (!range) return { error: "Appointment date is invalid.", status: 400 };

  const event = {
    summary: `Appointment with Dr. ${appointment.doctor_username || appointment.doctorUsername}`,
    description: `Reason: ${appointment.reason || "General consultation"}\nAppointment: APT-${appointment.id}`,
    start: { dateTime: toIso(range.start), timeZone: CALENDAR_TIME_ZONE },
    end: { dateTime: toIso(range.end), timeZone: CALENDAR_TIME_ZONE },
    reminders: {
      useDefault: false,
      overrides: [
        { method: "popup", minutes: 30 },
        { method: "email", minutes: 24 * 60 }
      ]
    }
  };

  const response = await fetch(GOOGLE_EVENTS_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(event)
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    return { error: data.error?.message || "Could not create Google Calendar event.", status: response.status };
  }

  return {
    eventId: data.id,
    htmlLink: data.htmlLink
  };
}
