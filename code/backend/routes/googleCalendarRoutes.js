import { Router } from "express";
import {
  createAppointmentCalendarEvent,
  googleCalendarAuthUrl,
  googleCalendarCallback,
  googleCalendarStatus
} from "../controllers/googleCalendarController.js";
import { authRequired, requireRole } from "../middlewares/auth.js";

const router = Router();

router.get("/api/google/calendar/status", authRequired, requireRole("patient"), googleCalendarStatus);
router.get("/api/google/calendar/auth-url", authRequired, requireRole("patient"), googleCalendarAuthUrl);
router.get("/api/google/callback", googleCalendarCallback);
router.post("/api/google/calendar/appointments/:appointmentId", authRequired, requireRole("patient"), createAppointmentCalendarEvent);

export default router;
