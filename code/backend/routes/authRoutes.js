import { Router } from "express";
import { doctorLogin, patientLogin, receptionistLogin, signup } from "../controllers/authController.js";

const router = Router();

router.post("/api/auth/signup", signup);
router.post("/api/auth/login", patientLogin);
router.post("/api/doctor/login", doctorLogin);
router.post("/api/reception/login", receptionistLogin);

export default router;
