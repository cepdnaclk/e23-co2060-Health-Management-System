import "dotenv/config";

export const PORT = Number(process.env.PORT || 3000);
export const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || "http://localhost:5173,http://127.0.0.1:5173";
export const JWT_SECRET = process.env.JWT_SECRET || "change-me-in-env";
export const API_KEY = process.env.GEMINI_API_KEY || "";
const RAW_GOOGLE_CLIENT_ID = String(process.env.GOOGLE_CLIENT_ID || "").trim();
export const GOOGLE_CLIENT_ID = RAW_GOOGLE_CLIENT_ID || "685818386228-vcoigkc8rp38hijrr1ghk3uknl11htb1.apps.googleusercontent.com";
export const HARDCODED_DOCTOR_PASSWORD = process.env.DOCTOR1_PASSWORD || "1234";
export const HARDCODED_RECEPTIONIST_PASSWORD = process.env.RECEPTIONIST1_PASSWORD || "1234";
export const DEFAULT_PATIENT_LOGIN = process.env.PATIENT1_LOGIN || "patient1";
export const DEFAULT_PATIENT_PASSWORD = process.env.PATIENT1_PASSWORD || "1234";

export const DB_HOST = process.env.MYSQL_HOST || process.env.MYSQLHOST || "127.0.0.1";
export const DB_PORT = Number(process.env.MYSQL_PORT || process.env.MYSQLPORT || 3306);
export const DB_USER = process.env.MYSQL_USER || process.env.MYSQLUSER || "root";
export const DB_PASSWORD = process.env.MYSQL_PASSWORD || process.env.MYSQLPASSWORD || "";
export const DB_NAME = process.env.MYSQL_DATABASE || process.env.MYSQLDATABASE || "patient_portal";
export const FORCE_LOCAL_DB = process.env.FORCE_LOCAL_DB === "true";

