import "dotenv/config";

export const PORT = Number(process.env.PORT || 3000);
export const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || "http://localhost:5173,http://127.0.0.1:5173";
export const JWT_SECRET = process.env.JWT_SECRET || "change-me-in-env";
export const API_KEY = process.env.GEMINI_API_KEY || "";
export const HARDCODED_DOCTOR_PASSWORD = process.env.DOCTOR1_PASSWORD || "1234";
export const HARDCODED_RECEPTIONIST_PASSWORD = process.env.RECEPTIONIST1_PASSWORD || "1234";
export const DEFAULT_PATIENT_LOGIN = process.env.PATIENT1_LOGIN || "patient1";
export const DEFAULT_PATIENT_PASSWORD = process.env.PATIENT1_PASSWORD || "1234";
export const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "";
export const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || "";
export const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || `http://localhost:${PORT}/api/google/callback`;
export const CALENDAR_TIME_ZONE = process.env.CALENDAR_TIME_ZONE || "Asia/Colombo";

export const DB_HOST = process.env.MYSQL_HOST || "127.0.0.1";
export const DB_PORT = Number(process.env.MYSQL_PORT || 3306);
export const DB_USER = process.env.MYSQL_USER || "root";
export const DB_PASSWORD = process.env.MYSQL_PASSWORD || "";
export const DB_NAME = process.env.MYSQL_DATABASE || "patient_portal";
