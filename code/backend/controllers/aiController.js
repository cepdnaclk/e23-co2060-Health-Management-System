import { GoogleGenerativeAI } from "@google/generative-ai";
import { API_KEY } from "../config/env.js";
import { findDoctorsBySpecialties } from "../models/doctorModel.js";

const genAI = API_KEY ? new GoogleGenerativeAI(API_KEY) : null;
const CANDIDATE_MODELS = [
  "gemini-2.5-flash",
  "gemini-2.5-pro",
  "gemini-2.0-flash",
  "gemini-2.0-flash-lite",
  "gemini-2.5-flash-lite"
];

let cachedWorkingModel = null;

async function listModelsREST() {
  if (!API_KEY) throw new Error("GEMINI_API_KEY is not configured");
  const url = `https://generativelanguage.googleapis.com/v1/models?key=${encodeURIComponent(API_KEY)}`;
  const r = await fetch(url);
  if (!r.ok) throw new Error(`List models failed: ${r.status} ${r.statusText}`);
  const data = await r.json();
  return data.models || [];
}

async function tryModelOnce(modelId, prompt) {
  try {
    const model = genAI.getGenerativeModel({ model: modelId });
    const out = await model.generateContent(prompt);
    return out.response.text();
  } catch (e) {
    if (e?.status === 404) return null;
    throw e;
  }
}

async function resolveWorkingModel(promptForProbe) {
  if (cachedWorkingModel) return cachedWorkingModel;

  for (const m of CANDIDATE_MODELS) {
    const ok = await tryModelOnce(m, promptForProbe);
    if (ok !== null) {
      cachedWorkingModel = m;
      return m;
    }
  }

  const all = await listModelsREST();
  for (const m of all) {
    if ((m.supportedGenerationMethods || []).includes("generateContent")) {
      const id = m.name?.replace(/^models\//, "") || m.name;
      const ok = await tryModelOnce(id, promptForProbe);
      if (ok !== null) {
        cachedWorkingModel = id;
        return id;
      }
    }
  }

  throw new Error("No usable Gemini model found for this API key/project.");
}

function parseJsonSafe(text) {
  try {
    return JSON.parse(text);
  } catch {
    const m = text.match(/\{[\s\S]*\}$/m);
    if (m) {
      try {
        return JSON.parse(m[0]);
      } catch {
        // no-op
      }
    }
    return {
      primarySpecialty: "General Practice",
      secondarySpecialty: "Internal Medicine",
      reason: "Fallback used due to parsing issues."
    };
  }
}

export async function listModels(_req, res) {
  if (!API_KEY) return res.status(503).json({ error: "GEMINI_API_KEY not configured" });
  try {
    const list = await listModelsREST();
    return res.json(
      list.map((m) => ({
        name: m.name,
        methods: m.supportedGenerationMethods
      }))
    );
  } catch (error) {
    return res.status(500).json({ error: String(error) });
  }
}

export async function analyzeSymptoms(req, res) {
  const symptoms = String(req.body?.symptoms || "").trim();
  if (!symptoms) return res.status(400).json({ error: "symptoms required" });

  if (!API_KEY || !genAI) {
    return res.json({
      primarySpecialty: "General Practice",
      secondarySpecialty: "Internal Medicine",
      reason: "AI is not configured, so Medicare recommends starting with a general medical consultation.",
      recommendedDoctors: findDoctorsBySpecialties(["General Practice", "Internal Medicine"], 3)
    });
  }

  const prompt = `
You are a hospital triage assistant. Based on the symptoms, return ONLY valid JSON:
{
  "primarySpecialty": "Cardiology|Neurology|General Surgery|Pulmonology|Gastroenterology|Orthopedics|Dermatology|Urology|OB-GYN|Psychiatry|Ophthalmology|ENT|General Practice|Internal Medicine|Pediatrics",
  "secondarySpecialty": "another specialty from the same list",
  "reason": "one-sentence clinical reasoning"
}
Symptoms: "${symptoms}"
`.trim();

  try {
    const workingModel = await resolveWorkingModel(
      'Return {"primarySpecialty":"General Practice","secondarySpecialty":"Internal Medicine","reason":"probe"}'
    );

    const model = genAI.getGenerativeModel({ model: workingModel });
    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();
    const data = parseJsonSafe(text);
    data.recommendedDoctors = findDoctorsBySpecialties([data.primarySpecialty, data.secondarySpecialty], 3);
    return res.json(data);
  } catch (err) {
    console.error("AI error:", err);
    return res.json({
      primarySpecialty: "General Practice",
      secondarySpecialty: "Internal Medicine",
      reason: "AI analysis was unavailable, so Medicare recommends starting with a general medical consultation.",
      recommendedDoctors: findDoctorsBySpecialties(["General Practice", "Internal Medicine"], 3)
    });
  }
}
