import { exec } from "child_process";
import fs from "fs";
import path from "path";
import cron from "node-cron";
import { fileURLToPath } from "url";
import { DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME } from "../config/env.js";
import { getDbMode } from "../config/db.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BACKUP_DIR = path.resolve(__dirname, "..", "backups");
const LOCAL_DB_FILE = path.resolve(__dirname, "..", ".dev-data", "local-db.json");

// Ensure backup directory exists
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

export function performBackup() {
  return new Promise((resolve, reject) => {
    const mode = getDbMode();
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");

    if (mode === "local") {
      // Local fallback mode: back up local-db.json
      const destFile = path.join(BACKUP_DIR, `local-db-backup-${timestamp}.json`);
      if (!fs.existsSync(LOCAL_DB_FILE)) {
        return reject(new Error("Local database file does not exist yet. No backup created."));
      }

      fs.copyFile(LOCAL_DB_FILE, destFile, (err) => {
        if (err) {
          console.error(`[Backup Service] Error backing up local database: ${err.message}`);
          return reject(err);
        }
        console.log(`[Backup Service] Local database backup saved: ${destFile}`);
        resolve({ mode: "local", file: destFile });
      });
    } else {
      // MySQL mode: run mysqldump command
      const destFile = path.join(BACKUP_DIR, `mysql-backup-${DB_NAME}-${timestamp}.sql`);
      
      const passFlag = DB_PASSWORD ? `-p"${DB_PASSWORD}"` : "";
      const command = `mysqldump -h ${DB_HOST} --port=${DB_PORT} -u ${DB_USER} ${passFlag} ${DB_NAME} > "${destFile}"`;

      exec(command, (error, stdout, stderr) => {
        if (error) {
          console.error(`[Backup Service] MySQL backup failed: ${error.message}`);
          return reject(error);
        }
        console.log(`[Backup Service] MySQL backup saved: ${destFile}`);
        resolve({ mode: "mysql", file: destFile });
      });
    }
  });
}

export function initBackupScheduler() {
  // Run everyday at midnight (0 0 * * *)
  cron.schedule("0 0 * * *", async () => {
    console.log("[Backup Service] Starting scheduled daily database backup...");
    try {
      await performBackup();
    } catch (err) {
      console.error("[Backup Service] Scheduled backup failed:", err.message);
    }
  });
  console.log("[Backup Service] Scheduler initialized (runs daily at midnight).");
}
