import { GoogleGenerativeAI } from "@google/generative-ai";
import { API_KEY } from "../config/env.js";
import { findDoctorsBySpecialties } from "../models/doctorModel.js";
import { findUserWithProfileById } from "../models/patientModel.js";

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

function parseJsonSafeAdvice(text) {
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
      dietAdvice: {
        foodsToEat: ["Fresh vegetables", "Lean proteins", "Whole grains"],
        foodsToAvoid: ["Processed foods", "Refined sugars", "Excess sodium"],
        explanation: "Eating a balanced diet of whole foods is recommended for overall health."
      },
      recipe: {
        title: "Healthy Quinoa Salad",
        description: "A nutrient-rich quinoa salad with mixed vegetables and olive oil dressing.",
        ingredients: ["1 cup quinoa", "2 cups water", "1 diced cucumber", "1 cup cherry tomatoes", "1 tbsp olive oil", "Lemon juice"],
        instructions: ["Rinse quinoa and boil in water for 15 minutes.", "Let cool, then toss with chopped vegetables, olive oil, and lemon juice."]
      },
      lifestyle: [
        "Aim for 30 minutes of moderate activity like walking daily.",
        "Drink at least 8-10 glasses of water throughout the day.",
        "Maintain a consistent sleep schedule with 7-8 hours of rest."
      ]
    };
  }
}

function getFallbackAdvice(bloodGroup, knownConditions, allergies) {
  const isDiabetic = /diabet/i.test(knownConditions);
  const isHypertensive = /hypertens|bp|pressure/i.test(knownConditions);

  const foodsToEat = ["Leafy green vegetables", "Lean proteins (chicken, fish)", "Healthy fats (olive oil, nuts)"];
  const foodsToAvoid = ["Refined sugars", "Processed meats", "Sugary beverages"];
  let explanation = "Focus on whole, nutrient-dense foods to support overall metabolic health.";

  if (isDiabetic) {
    foodsToEat.push("High-fiber legumes", "Berries in moderation");
    foodsToAvoid.push("White bread and pasta", "Fruit juices");
    explanation = "Carbohydrate control and low-glycemic foods are prioritized to maintain stable blood sugar levels.";
  }

  if (isHypertensive) {
    foodsToEat.push("Potassium-rich foods (bananas, spinach)");
    foodsToAvoid.push("High-sodium snacks", "Canned soups");
    explanation = "A DASH-style diet focusing on low-sodium and potassium-rich foods is recommended to regulate blood pressure.";
  }

  return {
    dietAdvice: {
      foodsToEat,
      foodsToAvoid,
      explanation
    },
    recipe: {
      title: isDiabetic ? "Baked Herb Salmon with Asparagus" : "Lemon Garlic Grilled Chicken with Quinoa",
      description: "A quick, wholesome, low-glycemic dinner loaded with lean proteins and healthy minerals.",
      ingredients: isDiabetic 
        ? ["150g fresh salmon fillet", "1 bunch asparagus", "1 tbsp olive oil", "1 minced garlic clove", "Lemon slices", "Dill"]
        : ["150g chicken breast", "1/2 cup cooked quinoa", "1 cup steamed broccoli", "1 tbsp olive oil", "Herbs"],
      instructions: isDiabetic
        ? ["Preheat oven to 400°F (200°C).", "Place salmon and asparagus on a baking sheet, drizzle with olive oil and garlic.", "Bake for 12-15 minutes until salmon flakes easily. Garnish with lemon and dill."]
        : ["Season chicken with herbs and grill for 6-7 minutes on each side.", "Serve alongside warm quinoa and steamed broccoli."]
    },
    lifestyle: [
      "Engage in 150 minutes of moderate aerobic exercise weekly (e.g., brisk walking).",
      "Stay hydrated: drink 2-3 liters of water daily.",
      "Practice mindfulness or deep breathing for 10 minutes daily to manage stress levels.",
      "Aim for 7-8 hours of quality sleep to support hormonal and physical restoration."
    ]
  };
}

export async function getAiAdvice(req, res) {
  const userId = req.userId;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  try {
    const patient = await findUserWithProfileById(userId);
    if (!patient) return res.status(404).json({ error: "Patient profile not found" });

    const bloodGroup = patient.blood_group || "Not set";
    const knownConditions = patient.known_conditions || "None recorded";
    const allergies = patient.allergies || "None recorded";
    const gender = patient.gender || "Not set";
    const dob = patient.dob || "";

    let ageText = "Not set";
    if (dob) {
      const birth = new Date(dob);
      const today = new Date();
      let age = today.getFullYear() - birth.getFullYear();
      const m = today.getMonth() - birth.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
        age--;
      }
      ageText = `${age} years old`;
    }

    if (!API_KEY || !genAI) {
      return res.json(getFallbackAdvice(bloodGroup, knownConditions, allergies));
    }

    const prompt = `
You are an expert AI clinical nutritionist and wellness coach. Based on the patient's profiles below, return ONLY valid JSON:
{
  "dietAdvice": {
    "foodsToEat": ["food item 1", "food item 2", ...],
    "foodsToAvoid": ["food item 1", "food item 2", ...],
    "explanation": "short explanation of the diet choice based on blood type and conditions"
  },
  "recipe": {
    "title": "Recipe Title",
    "description": "Short description of the recipe",
    "ingredients": ["ingredient 1", "ingredient 2", ...],
    "instructions": ["step 1", "step 2", ...]
  },
  "lifestyle": [
    "lifestyle tip 1 (exercise, sleep, hydration, etc.)",
    "lifestyle tip 2",
    ...
  ]
}

Patient Profile:
- Age: ${ageText}
- Gender: ${gender}
- Blood Group: ${bloodGroup}
- Known Conditions / Medical History: ${knownConditions}
- Food Allergies: ${allergies}

Rules:
- Keep the response tailored to their blood group and conditions (e.g. low-carb/low-sugar for Diabetes, avoiding allergen triggers).
- Do not include markdown formatting or extra text outside the JSON structure.
`.trim();

    const workingModel = await resolveWorkingModel(
      'Return {"dietAdvice":{"foodsToEat":[],"foodsToAvoid":[],"explanation":""},"recipe":{"title":"","description":"","ingredients":[],"instructions":[]},"lifestyle":[]}'
    );

    const model = genAI.getGenerativeModel({ model: workingModel });
    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();
    const data = parseJsonSafeAdvice(text);
    return res.json(data);
  } catch (error) {
    console.error("AI Advice error:", error);
    return res.json(getFallbackAdvice(
      req.query?.bloodGroup || "Not set",
      req.query?.knownConditions || "None",
      req.query?.allergies || "None"
    ));
  }
}

function parseChatResponseSafe(text) {
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
      finished: false,
      aiResponse: "I received your description. Could you please specify how long you have had these symptoms and if there is any other detail?",
      primarySpecialty: null,
      secondarySpecialty: null,
      reason: null
    };
  }
}

function handleFallbackSymptomChat(messages) {
  const userMessages = messages.filter(m => m.sender === "user");

  if (userMessages.length <= 1) {
    return {
      finished: false,
      aiResponse: "Thank you for explaining your symptoms. To help me recommend the best specialist, could you please tell me how long you have had this, and if you are experiencing any other symptoms (like fever, pain, or nausea)?"
    };
  }

  const combinedSymptoms = userMessages.map(m => m.text).join(" ");
  const analysis = fallbackAnalysis(combinedSymptoms, "Based on our dialogue: ");

  return {
    finished: true,
    aiResponse: `Based on your description, I recommend consulting with our ${analysis.primarySpecialty} department. ${analysis.reason} I have listed some recommended doctors below for you.`,
    primarySpecialty: analysis.primarySpecialty,
    secondarySpecialty: analysis.secondarySpecialty,
    reason: analysis.reason,
    recommendedDoctors: analysis.recommendedDoctors
  };
}

export async function handleSymptomChat(req, res) {
  const messages = req.body?.messages;
  if (!Array.isArray(messages) || !messages.length) {
    return res.status(400).json({ error: "messages array is required" });
  }

  if (!API_KEY || !genAI) {
    return res.json(handleFallbackSymptomChat(messages));
  }

  const prompt = `
You are a highly skilled medical triage assistant. Your goal is to converse with a patient to understand their symptoms and guide them to the most suitable medical department/doctors.

Conversation history:
${messages.map(m => `${m.sender === "user" ? "Patient" : "Assistant"}: ${m.text}`).join("\n")}

Rules:
1. Analyze the symptoms mentioned by the patient.
2. If you need more information to suggest the correct specialties (such as onset, duration, severity, location of pain, associated symptoms), return "finished": false and ask ONE concise, polite clarifying question in "aiResponse". Do not diagnose or prescribe treatment.
3. If you have enough information to confidently select the most suitable medical specialties, return "finished": true, provide a polite summary of your advice in "aiResponse", and fill in the "primarySpecialty" and "secondarySpecialty" fields.
4. Choose the specialties strictly from this list: "Cardiology", "Neurology", "General Surgery", "Pulmonology", "Gastroenterology", "Orthopedics", "Dermatology", "Urology", "OB-GYN", "Psychiatry", "Ophthalmology", "ENT", "General Practice", "Internal Medicine", "Pediatrics".
5. Return ONLY a valid JSON object matching this schema:
{
  "finished": true/false,
  "aiResponse": "Your reply or question to the patient",
  "primarySpecialty": "Selected primary specialty or null",
  "secondarySpecialty": "Selected secondary specialty or null",
  "reason": "One-sentence clinical reasoning or null"
}
`.trim();

  try {
    const workingModel = await resolveWorkingModel(
      'Return {"finished":false,"aiResponse":"probe","primarySpecialty":null,"secondarySpecialty":null,"reason":null}'
    );

    const model = genAI.getGenerativeModel({ model: workingModel });
    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();
    const data = parseChatResponseSafe(text);

    if (data.finished && data.primarySpecialty) {
      data.recommendedDoctors = findDoctorsBySpecialties([data.primarySpecialty, data.secondarySpecialty], 3);
    }

    return res.json(data);
  } catch (err) {
    console.error("AI Symptom Chat error:", err);
    return res.json(handleFallbackSymptomChat(messages));
  }
}
