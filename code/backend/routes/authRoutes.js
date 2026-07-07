import { Router } from "express";
import {
	doctorLogin,
	doctorSignup,
	googleSignIn,
	patientLogin,
	receptionistLogin,
	receptionistSignup,
	signup
} from "../controllers/authController.js";

const router = Router();

router.post("/api/auth/signup", signup);
router.post("/api/auth/login", patientLogin);
router.post("/api/auth/google", googleSignIn);
router.post("/api/doctor/signup", doctorSignup);
router.post("/api/doctor/login", doctorLogin);
router.post("/api/reception/signup", receptionistSignup);
router.post("/api/reception/login", receptionistLogin);

export default router;
