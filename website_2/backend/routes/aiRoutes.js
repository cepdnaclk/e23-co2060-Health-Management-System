import { Router } from "express";
import { analyzeSymptoms, listModels } from "../controllers/aiController.js";
import { authRequired, requireRole } from "../middlewares/auth.js";

const router = Router();

router.get("/models", listModels);
router.post("/api/analyzeSymptoms", authRequired, requireRole("patient"), analyzeSymptoms);

export default router;
