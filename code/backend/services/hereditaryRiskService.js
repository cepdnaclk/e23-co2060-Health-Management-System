import { GoogleGenerativeAI } from "@google/generative-ai";
import { API_KEY } from "../config/env.js";

const genAI = API_KEY ? new GoogleGenerativeAI(API_KEY) : null;
const MODEL_ID = "gemini-2.5-flash";

const CONDITION_RULES = [
  {
    match: /diabetes|diabetic|type 2/i,
    condition: "Type 2 Diabetes",
    inheritedFrom: "Father",
    percentage: 36,
    note: "Family history can raise risk, especially when lifestyle factors overlap."
  },
  {
    match: /hypercholesterolemia|cholesterol|coronary|heart|cardiac/i,
    condition: "Familial Hypercholesterolemia",
    inheritedFrom: "Mother",
    percentage: 50,
    note: "One affected parent can pass inherited cholesterol risk to a child."
  },
  {
    match: /hypertension|blood pressure/i,
    condition: "Hypertension",
    inheritedFrom: "Family",
    percentage: 28,
    note: "Blood pressure risk often clusters in families and is influenced by lifestyle."
  }
];

function splitConditions(text) {
  return String(text || "")
    .split(/[,;\n]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function parentConditionPairs(familyTree) {
  return [
    { relationship: "Mother", conditions: splitConditions(familyTree?.parents?.mother?.knownConditions) },
    { relationship: "Father", conditions: splitConditions(familyTree?.parents?.father?.knownConditions) }
  ].flatMap((parent) => parent.conditions.map((condition) => ({ ...parent, condition })));
}

function fallbackRisks(familyTree) {
  const pairs = parentConditionPairs(familyTree);
  const risks = [];

  for (const pair of pairs) {
    const rule = CONDITION_RULES.find((item) => item.match.test(pair.condition));
    if (!rule) {
      risks.push({
        condition: pair.condition,
        inheritedFrom: pair.relationship,
        percentage: 24,
        note: "A family occurrence is worth discussing during routine screening."
      });
      continue;
    }

    risks.push({
      condition: rule.condition,
      inheritedFrom: pair.relationship,
      percentage: rule.percentage,
      note: rule.note
    });
  }

  return risks.slice(0, 4);
}

function parseJsonArray(text) {
  try {
    return JSON.parse(text);
  } catch {
    const match = String(text || "").match(/\[[\s\S]*\]/);
    if (!match) return null;
    try {
      return JSON.parse(match[0]);
    } catch {
      return null;
    }
  }
}

function sanitizeRisks(items) {
  if (!Array.isArray(items)) return [];
  return items
    .map((item) => ({
      condition: String(item?.condition || "").trim(),
      inheritedFrom: String(item?.inheritedFrom || "Family").trim(),
      percentage: Math.max(1, Math.min(95, Math.round(Number(item?.percentage) || 0))),
      note: String(item?.note || "").trim()
    }))
    .filter((item) => item.condition && item.percentage)
    .slice(0, 4);
}

export async function predictHereditaryRisks(familyTree) {
  const fallback = fallbackRisks(familyTree);
  if (!fallback.length) return [];
  if (!API_KEY || !genAI) return fallback;

  const compactFamily = {
    patient: {
      patientId: familyTree?.patient?.patientId,
      name: familyTree?.patient?.fullName,
      knownConditions: splitConditions(familyTree?.patient?.knownConditions)
    },
    mother: familyTree?.parents?.mother
      ? {
          patientId: familyTree.parents.mother.patientId,
          name: familyTree.parents.mother.fullName,
          knownConditions: splitConditions(familyTree.parents.mother.knownConditions)
        }
      : null,
    father: familyTree?.parents?.father
      ? {
          patientId: familyTree.parents.father.patientId,
          name: familyTree.parents.father.fullName,
          knownConditions: splitConditions(familyTree.parents.father.knownConditions)
        }
      : null
  };

  const prompt = `
You are assisting a hospital patient portal with hereditary risk screening.
Return ONLY a JSON array with 1 to 4 objects:
[
  {
    "condition": "plain condition name",
    "inheritedFrom": "Mother|Father|Both parents|Family",
    "percentage": 1-95,
    "note": "short screening-oriented note, not a diagnosis"
  }
]
Use cautious, screening-level estimates based only on the family history below.
Family data: ${JSON.stringify(compactFamily)}
`.trim();

  try {
    const model = genAI.getGenerativeModel({ model: MODEL_ID });
    const result = await model.generateContent(prompt);
    const parsed = parseJsonArray(result.response.text().trim());
    const risks = sanitizeRisks(parsed);
    return risks.length ? risks : fallback;
  } catch {
    console.warn("Hereditary AI risk unavailable; using fallback estimates.");
    return fallback;
  }
}
