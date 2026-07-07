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

function getFallbackAdvice(bloodGroup, knownConditions, allergies, weight, height, dietaryPreference, activityLevel) {
  const isDiabetic = /diabet/i.test(knownConditions);
  const isHypertensive = /hypertens|bp|pressure/i.test(knownConditions);
  const isVeg = /vegetar|vegan/i.test(dietaryPreference);
  const isKeto = /keto/i.test(dietaryPreference);

  let wNum = parseFloat(weight || 0);
  let hNum = parseFloat(height || 0) / 100.0;
  let bmi = 0;
  let bmiCategory = "";
  if (wNum > 0 && hNum > 0) {
    bmi = wNum / (hNum * hNum);
    if (bmi < 18.5) bmiCategory = "Underweight";
    else if (bmi < 25) bmiCategory = "Normal";
    else if (bmi < 30) bmiCategory = "Overweight";
    else bmiCategory = "Obese";
  }

  let foodsToEat = [];
  if (isVeg) {
    foodsToEat = ["Organic Tofu", "Lentils and Chickpeas", "Tempeh", "Leafy Greens", "Avocados", "Chia seeds"];
  } else if (isKeto) {
    foodsToEat = ["Fatty fish (salmon)", "Avocados", "Eggs", "Grass-fed beef", "Olive oil", "Leafy Greens"];
  } else {
    foodsToEat = ["Lean proteins (chicken breast, fish)", "Leafy green vegetables", "Healthy fats (olive oil, avocados)"];
  }

  let foodsToAvoid = [];
  if (isKeto) {
    foodsToAvoid = ["Refined sugars", "Grains & starches (bread, rice, pasta)", "Root vegetables (potatoes)", "High-sugar fruits"];
  } else {
    foodsToAvoid = ["Refined sugars", "Processed meats", "Sugary beverages", "Trans fats"];
  }

  const lowerAllergies = String(allergies || "").toLowerCase();
  if (lowerAllergies.includes("peanut")) {
    foodsToAvoid.push("Peanuts", "Peanut butter", "Peanut oil");
    foodsToEat = foodsToEat.filter(f => !/peanut/i.test(f));
  }
  if (lowerAllergies.includes("dairy") || lowerAllergies.includes("milk")) {
    foodsToAvoid.push("Cow's milk", "Cheese", "Butter", "Dairy products");
    foodsToEat = foodsToEat.filter(f => !/cheese|butter|dairy|milk/i.test(f));
  }
  if (lowerAllergies.includes("gluten") || lowerAllergies.includes("wheat")) {
    foodsToAvoid.push("Wheat bread", "Barley", "Rye", "Gluten products");
    foodsToEat = foodsToEat.filter(f => !/bread|pasta|wheat/i.test(f));
  }

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

  if (bmiCategory === "Overweight" || bmiCategory === "Obese") {
    explanation += ` Caloric moderation is advised for BMI: ${bmi.toFixed(1)} (${bmiCategory}).`;
  } else if (bmiCategory === "Underweight") {
    explanation += ` Calorie-dense foods are recommended to support a healthy weight gain for BMI: ${bmi.toFixed(1)} (${bmiCategory}).`;
  }

  let recipeTitle = "Lemon Garlic Grilled Chicken with Quinoa";
  let recipeDescription = "A quick, wholesome, low-glycemic dinner loaded with lean proteins and healthy minerals.";
  let recipeIngredients = ["150g chicken breast", "1/2 cup cooked quinoa", "1 cup steamed broccoli", "1 tbsp olive oil", "Herbs"];
  let recipeInstructions = ["Season chicken with herbs and grill for 6-7 minutes on each side.", "Serve alongside warm quinoa and steamed broccoli."];

  if (isVeg) {
    recipeTitle = "Grilled Tofu Power Bowl with Quinoa";
    recipeDescription = "A plant-based, fiber-rich dinner packed with complete proteins and healthy complex carbs.";
    recipeIngredients = ["150g firm tofu cubes", "1/2 cup cooked quinoa", "1 cup steamed broccoli", "1 tbsp olive oil", "Soy sauce", "Sesame seeds"];
    recipeInstructions = ["Marinate tofu in soy sauce and pan-sear in olive oil for 4 minutes each side.", "Assemble bowl with cooked quinoa, tofu, and steamed broccoli. Sprinkle sesame seeds on top."];
  } else if (isDiabetic) {
    recipeTitle = "Baked Herb Salmon with Asparagus";
    recipeDescription = "A quick, omega-3 rich dinner loaded with healthy fats and low-glycemic greens.";
    recipeIngredients = ["150g fresh salmon fillet", "1 bunch asparagus", "1 tbsp olive oil", "1 minced garlic clove", "Lemon slices", "Dill"];
    recipeInstructions = ["Preheat oven to 400°F (200°C).", "Place salmon and asparagus on a baking sheet, drizzle with olive oil and garlic.", "Bake for 12-15 minutes until salmon flakes easily. Garnish with lemon and dill."];
  }

  const lifestyle = [
    "Stay hydrated: drink 2-3 liters of water daily.",
    "Aim for 7-8 hours of quality sleep to support hormonal and physical restoration."
  ];

  if (activityLevel === "Sedentary") {
    lifestyle.push("Start with light activity: aim for a 20-minute daily walk.");
  } else if (activityLevel === "Very Active") {
    lifestyle.push("Ensure adequate protein recovery and muscle stretching post-exercise.");
  } else {
    lifestyle.push("Engage in 150 minutes of moderate aerobic exercise weekly (e.g., brisk walking).");
  }

  if (bmiCategory === "Overweight" || bmiCategory === "Obese") {
    lifestyle.push("Practice mindful eating and maintain a mild caloric deficit.");
  }

  return {
    dietAdvice: {
      foodsToEat,
      foodsToAvoid,
      explanation
    },
    recipe: {
      title: recipeTitle,
      description: recipeDescription,
      ingredients: recipeIngredients,
      instructions: recipeInstructions
    },
    lifestyle
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
    const weight = patient.weight || "";
    const height = patient.height || "";
    const dietaryPreference = patient.dietary_preference || "None";
    const activityLevel = patient.activity_level || "Not set";

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

    let bmiText = "Not set";
    let bmiCategory = "";
    if (weight && height) {
      const wNum = parseFloat(weight);
      const hNum = parseFloat(height) / 100.0;
      if (wNum > 0 && hNum > 0) {
        const bmi = wNum / (hNum * hNum);
        bmiText = bmi.toFixed(1);
        if (bmi < 18.5) bmiCategory = "Underweight";
        else if (bmi < 25) bmiCategory = "Normal weight";
        else if (bmi < 30) bmiCategory = "Overweight";
        else bmiCategory = "Obese";
      }
    }

    if (!API_KEY || !genAI) {
      return res.json(getFallbackAdvice(bloodGroup, knownConditions, allergies, weight, height, dietaryPreference, activityLevel));
    }

    const prompt = `
You are an expert AI clinical nutritionist and wellness coach. Based on the patient's profile below, return ONLY valid JSON:
{
  "dietAdvice": {
    "foodsToEat": ["food item 1", "food item 2", ...],
    "foodsToAvoid": ["food item 1", "food item 2", ...],
    "explanation": "short explanation of the diet choice based on body metrics, dietary preference, activity, chronic diseases, and allergies"
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
- Weight: ${weight ? weight + " kg" : "Not set"}
- Height: ${height ? height + " cm" : "Not set"}
- BMI: ${bmiText} ${bmiCategory ? "(" + bmiCategory + ")" : ""}
- Activity Level: ${activityLevel}
- Dietary Preference: ${dietaryPreference}
- Blood Group: ${bloodGroup}
- Known Conditions / Medical History: ${knownConditions}
- Food Allergies: ${allergies}

Rules:
- Keep the response strictly tailored to all of their profile constraints:
  * Align with their Dietary Preference (e.g. Vegetarian/Vegan means NO animal products, Keto means high fat/very low carb).
  * Strictly avoid their Food Allergies.
  * Limit sugar/carbs if diabetic. Limit sodium if hypertensive.
  * Adjust recommendations based on their BMI and Activity Level (e.g. support weight loss or nutrient surplus if needed).
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
    try {
      const patient = await findUserWithProfileById(userId);
      return res.json(getFallbackAdvice(
        patient?.blood_group || "Not set",
        patient?.known_conditions || "None",
        patient?.allergies || "None",
        patient?.weight,
        patient?.height,
        patient?.dietary_preference,
        patient?.activity_level
      ));
    } catch {
      return res.json(getFallbackAdvice("Not set", "None", "None"));
    }
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
