import { Router } from "express";
import { healthCheck } from "../controllers/healthController.js";
import { performBackup } from "../services/backupService.js";

const router = Router();

router.get("/health", healthCheck);
router.post("/api/backup", async (_req, res) => {
  try {
    const result = await performBackup();
    return res.json({ ok: true, message: "Backup successfully generated", ...result });
  } catch (error) {
    return res.status(500).json({ ok: false, error: error.message });
  }
});

export default router;
