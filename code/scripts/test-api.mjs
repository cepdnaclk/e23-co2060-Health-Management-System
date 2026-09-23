const baseUrl = process.env.API_BASE_URL || "http://localhost:3000";
const runId = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
const email = `automated-${runId}@example.com`;
const password = "Testing123!";
let passed = 0;

async function request(path, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...(options.headers || {}) }
  });
  const text = await response.text();
  let body = {};
  try {
    body = text ? JSON.parse(text) : {};
  } catch {
    body = { raw: text };
  }
  return { response, body };
}

function check(name, condition, detail = "") {
  if (!condition) throw new Error(`${name} failed${detail ? `: ${detail}` : ""}`);
  passed += 1;
  console.log(`PASS ${name}`);
}

async function waitForHealth() {
  for (let attempt = 1; attempt <= 20; attempt += 1) {
    try {
      const result = await request("/health");
      if (result.response.ok) return;
    } catch {
      // The dev server may still be starting.
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error(`API did not become healthy at ${baseUrl}`);
}

await waitForHealth();

const health = await request("/health");
check("health endpoint", health.response.ok && health.body.ok === true && health.body.db === "up");

const signup = await request("/api/auth/signup", {
  method: "POST",
  body: JSON.stringify({
    fullName: "Automated Test Patient",
    email,
    phone: "0710000000",
    password,
    nationality: "Sri Lankan",
    dob: "1990-05-15",
    gender: "Female"
  })
});
check("patient signup", signup.response.ok && Boolean(signup.body.token));
const token = signup.body.token;
const authHeaders = { Authorization: `Bearer ${token}` };

const profileUpdate = await request("/api/patient/me", {
  method: "PUT",
  headers: authHeaders,
  body: JSON.stringify({ nationality: "Sri Lankan", dob: "1990-05-15", gender: "Female" })
});
check("profile update", profileUpdate.response.ok);

const profile = await request("/api/patient/me", { headers: authHeaders });
check("profile persistence", profile.response.ok && profile.body.profile?.nationality === "Sri Lankan");

const publicChat = await request("/api/public/symptom-chat", {
  method: "POST",
  body: JSON.stringify({
    messages: [{ sender: "user", text: "I have a mild fever" }],
    profile: { nationality: "Sri Lankan", gender: "Female", dob: "1990-05-15" }
  })
});
check("public symptom chat", publicChat.response.ok && typeof publicChat.body.aiResponse === "string");

const patientChat = await request("/api/symptom-chat", {
  method: "POST",
  headers: authHeaders,
  body: JSON.stringify({ messages: [{ sender: "user", text: "I have a headache" }], profile: profile.body.profile })
});
check("protected symptom chat", patientChat.response.ok && typeof patientChat.body.aiResponse === "string");

const advice = await request("/api/patient/ai-advice", { headers: authHeaders });
check("wellness advice", advice.response.ok && Array.isArray(advice.body.lifestyle));

console.log(`\n${passed} API checks passed.`);