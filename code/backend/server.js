import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import { FRONTEND_ORIGIN, JWT_SECRET, PORT } from "./config/env.js";
import { initDb } from "./config/db.js";
import healthRoutes from "./routes/healthRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import doctorRoutes from "./routes/doctorRoutes.js";
import patientRoutes from "./routes/patientRoutes.js";
import aiRoutes from "./routes/aiRoutes.js";
import receptionistRoutes from "./routes/receptionistRoutes.js";

const app = express();
let dbInitialized = false;
let dbInitInFlight = false;

const ALLOWED_ORIGINS = new Set(
  FRONTEND_ORIGIN.split(",")
    .map((value) => value.trim())
    .filter(Boolean)
);

if (ALLOWED_ORIGINS.has("http://localhost:5173")) {
  ALLOWED_ORIGINS.add("http://127.0.0.1:5173");
}
if (ALLOWED_ORIGINS.has("http://127.0.0.1:5173")) {
  ALLOWED_ORIGINS.add("http://localhost:5173");
}

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) return callback(null, true);
      if (ALLOWED_ORIGINS.has(origin)) return callback(null, true);
      return callback(null, false);
    },
    credentials: true
  })
);
app.use(bodyParser.json({ limit: "5mb" }));

if (JWT_SECRET === "change-me-in-env") {
  console.warn("JWT_SECRET is using a default value. Set JWT_SECRET in backend/.env for security.");
}

app.use(healthRoutes);
app.use(authRoutes);
app.use(doctorRoutes);
app.use(patientRoutes);
app.use(aiRoutes);
app.use(receptionistRoutes);

app.use((error, _req, res, next) => {
  if (error?.type === "entity.too.large") {
    return res.status(413).json({ error: "Request too large. Please upload an image under 1MB." });
  }
  return next(error);
});

async function initializeDatabase({ retry = false } = {}) {
  if (dbInitialized || dbInitInFlight) return;
  dbInitInFlight = true;

  try {
    await initDb();
    dbInitialized = true;
    console.log("Database initialized.");
  } catch (error) {
    const prefix = retry ? "Database retry failed" : "Database initialization failed";
    console.warn(`${prefix}. Database-backed routes are unavailable until MySQL is reachable.`);
    console.warn(`Database error: ${error.message}`);
  } finally {
    dbInitInFlight = false;
  }
}

function scheduleDatabaseRetry() {
  const retryIntervalMs = 5000;
  const timer = setInterval(async () => {
    if (dbInitialized) {
      clearInterval(timer);
      return;
    }
    await initializeDatabase({ retry: true });
  }, retryIntervalMs);
}

async function startServer() {
  await initializeDatabase();
  if (!dbInitialized) scheduleDatabaseRetry();

  app.listen(PORT, "127.0.0.1", () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Health: http://localhost:${PORT}/health`);
    console.log(`Models: http://localhost:${PORT}/models`);
  });
}

startServer();
