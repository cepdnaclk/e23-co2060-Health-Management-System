import { getPatientAppointmentById } from "../models/appointmentModel.js";
import {
  createGoogleAuthUrl,
  createGoogleCalendarEvent,
  getGoogleCalendarStatus,
  handleGoogleCallback
} from "../services/googleCalendarService.js";

export function googleCalendarStatus(req, res) {
  return res.json(getGoogleCalendarStatus(req.userId));
}

export function googleCalendarAuthUrl(req, res) {
  const result = createGoogleAuthUrl(req.userId);
  if (result.error) return res.status(503).json({ error: result.error });
  return res.json(result);
}

export async function googleCalendarCallback(req, res) {
  const code = String(req.query?.code || "");
  const state = String(req.query?.state || "");
  if (!code || !state) return res.status(400).send("Missing Google OAuth code or state.");

  try {
    const redirectUrl = await handleGoogleCallback({ code, state });
    return res.redirect(redirectUrl);
  } catch (error) {
    console.error("Google OAuth callback error:", error);
    return res.status(500).send("Could not connect Google Calendar.");
  }
}

export async function createAppointmentCalendarEvent(req, res) {
  const appointmentId = Number(req.params.appointmentId);
  if (!Number.isFinite(appointmentId) || appointmentId <= 0) {
    return res.status(400).json({ error: "Valid appointment id is required" });
  }

  try {
    const appointment = await getPatientAppointmentById(req.userId, appointmentId);
    if (!appointment) return res.status(404).json({ error: "Appointment not found" });
    if (appointment.status !== "Confirmed") {
      return res.status(400).json({ error: "Only confirmed appointments can be added to Google Calendar" });
    }

    const result = await createGoogleCalendarEvent({ userId: req.userId, appointment });
    if (result.error) return res.status(result.status || 500).json({ error: result.error });
    return res.status(201).json({ ok: true, ...result });
  } catch (error) {
    console.error("Create Google Calendar event error:", error);
    return res.status(500).json({ error: "Could not create Google Calendar event" });
  }
}
