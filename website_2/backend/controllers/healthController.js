import { getDbMode, pool } from "../config/db.js";

export async function healthCheck(_req, res) {
  try {
    await pool.query("SELECT 1");
    return res.json({ ok: true, db: "up", mode: getDbMode() });
  } catch (error) {
    return res.status(500).json({ ok: false, db: "down", mode: getDbMode(), error: error.message });
  }
}
