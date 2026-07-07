import { Router } from "express";
import { analyzeSymptoms, listModels, getAiAdvice } from "../controllers/aiController.js";
import { authRequired, requireRole } from "../middlewares/auth.js";

const router = Router();

router.get("/models", listModels);
router.post("/api/public/analyzeSymptoms", analyzeSymptoms);
router.post("/api/analyzeSymptoms", authRequired, requireRole("patient"), analyzeSymptoms);
router.get("/api/patient/ai-advice", authRequired, requireRole("patient"), getAiAdvice);

export default router;
