import { Router } from "express";
import {
  getPatientAppointments,
  getPatientMe,
  getPatientReports,
  payPatientAppointment,
  updateAuthMe,
  updatePatientMe
} from "../controllers/patientController.js";
import { authRequired, requireRole } from "../middlewares/auth.js";

const router = Router();

router.get("/api/patient/me", authRequired, requireRole("patient"), getPatientMe);
router.get("/api/patient/appointments", authRequired, requireRole("patient"), getPatientAppointments);
router.post("/api/patient/appointments/:appointmentId/pay", authRequired, requireRole("patient"), payPatientAppointment);
router.get("/api/patient/reports", authRequired, requireRole("patient"), getPatientReports);
router.put("/api/auth/me", authRequired, requireRole("patient"), updateAuthMe);
router.put("/api/patient/me", authRequired, requireRole("patient"), updatePatientMe);

export default router;
