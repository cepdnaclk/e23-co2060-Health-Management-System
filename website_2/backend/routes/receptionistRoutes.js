import { Router } from "express";
import { authRequired, requireRole } from "../middlewares/auth.js";
import {
  receptionistCancelAppointment,
  receptionistCreateAppointment,
  receptionistOverview,
  receptionistPatientReports,
  receptionistUploadReport
} from "../controllers/receptionistController.js";

const router = Router();

router.get("/api/reception/overview", authRequired, requireRole("receptionist"), receptionistOverview);
router.post("/api/reception/appointments", authRequired, requireRole("receptionist"), receptionistCreateAppointment);
router.put("/api/reception/appointments/:appointmentId/cancel", authRequired, requireRole("receptionist"), receptionistCancelAppointment);
router.post("/api/reception/reports", authRequired, requireRole("receptionist"), receptionistUploadReport);
router.get("/api/reception/patients/:patientId/reports", authRequired, requireRole("receptionist"), receptionistPatientReports);

export default router;
