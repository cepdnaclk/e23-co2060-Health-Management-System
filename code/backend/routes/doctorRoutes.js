import { Router } from "express";
import {
  completeDoctorAppointment,
  createDoctorPatientDiagnosisLog,
  doctorAppointments,
  doctorPatients,
  getDoctorPatientDiagnosisLogs,
  getDoctorMe,
  getDoctorPatient,
  listDoctors,
  updateDoctorMe,
  updateDoctorPatient
} from "../controllers/doctorController.js";
import { authRequired, requireRole } from "../middlewares/auth.js";

const router = Router();

router.get("/api/doctor/me", authRequired, requireRole("doctor"), getDoctorMe);
router.put("/api/doctor/me", authRequired, requireRole("doctor"), updateDoctorMe);
router.get("/api/public/doctors", listDoctors);
router.get("/api/doctors", listDoctors);
router.get("/api/doctor/appointments", authRequired, requireRole("doctor"), doctorAppointments);
router.put("/api/doctor/appointments/:appointmentId/complete", authRequired, requireRole("doctor"), completeDoctorAppointment);
router.get("/api/doctor/patients", authRequired, requireRole("doctor"), doctorPatients);
router.get("/api/doctor/patients/:patientId", authRequired, requireRole("doctor"), getDoctorPatient);
router.put("/api/doctor/patients/:patientId", authRequired, requireRole("doctor"), updateDoctorPatient);
router.get("/api/doctor/patients/:patientId/diagnosis-logs", authRequired, requireRole("doctor"), getDoctorPatientDiagnosisLogs);
router.post("/api/doctor/patients/:patientId/diagnosis-logs", authRequired, requireRole("doctor"), createDoctorPatientDiagnosisLog);

export default router;
