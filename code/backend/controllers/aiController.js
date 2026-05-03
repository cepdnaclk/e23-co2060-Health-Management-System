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

const FALLBACK_TRIAGE_RULES = [
  {
    match: /chest|heart|cardiac|palpitation|blood pressure|hypertension|shortness of breath/i,
    primarySpecialty: "Cardiology",
    secondarySpecialty: "Internal Medicine",
    reason: "These symptoms may involve the heart or circulation, so a cardiology review is recommended."
  },
  {
    match: /headache|migraine|seizure|stroke|dizzy|dizziness|numb|nerve|weakness|faint/i,
    primarySpecialty: "Neurology",
    secondarySpecialty: "Internal Medicine",
    reason: "These symptoms may involve the nervous system, so a neurology review is recommended."
  },
  {
    match: /skin|rash|itch|acne|eczema|wound|allergy|hives|burn/i,
    primarySpecialty: "Dermatology",
    secondarySpecialty: "General Practice",
    reason: "These symptoms mainly affect the skin, so a dermatology review is recommended."
  },
  {
    match: /joint|bone|fracture|sprain|back pain|knee|shoulder|ankle|orthopedic|orthopaedic/i,
    primarySpecialty: "Orthopedics",
    secondarySpecialty: "General Practice",
    reason: "These symptoms may involve bones, joints, or muscles, so an orthopedic review is recommended."
  },
  {
    match: /ear|nose|throat|sinus|tonsil|hearing|voice|cough|sore throat/i,
    primarySpecialty: "ENT",
    secondarySpecialty: "General Practice",
    reason: "These symptoms may involve the ear, nose, or throat, so an ENT review is recommended."
  },
  {
    match: /child|baby|infant|pediatric|paediatric|school age/i,
    primarySpecialty: "Pediatrics",
    secondarySpecialty: "General Practice",
    reason: "The symptoms are related to a child patient, so a pediatric review is recommended."
  },
  {
    match: /fever|diabetes|sugar|fatigue|vomit|nausea|stomach|abdominal|infection|general/i,
    primarySpecialty: "Internal Medicine",
    secondarySpecialty: "General Practice",
    reason: "These general medical symptoms can have several causes, so an internal medicine review is recommended."
  }
];

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

function fallbackAnalysis(symptoms, reasonPrefix = "") {
  const match = FALLBACK_TRIAGE_RULES.find((rule) => rule.match.test(symptoms)) || {
    primarySpecialty: "General Practice",
    secondarySpecialty: "Internal Medicine",
    reason: "The symptoms are broad, so starting with a general medical consultation is recommended."
  };

  return {
    primarySpecialty: match.primarySpecialty,
    secondarySpecialty: match.secondarySpecialty,
    reason: `${reasonPrefix}${match.reason}`,
    recommendedDoctors: findDoctorsBySpecialties([match.primarySpecialty, match.secondarySpecialty], 3)
  };
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
    return res.json(fallbackAnalysis(symptoms));
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
    return res.json(fallbackAnalysis(symptoms));
  }
}
