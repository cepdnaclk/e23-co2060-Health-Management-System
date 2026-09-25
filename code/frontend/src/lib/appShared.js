export const API_BASE = import.meta.env.VITE_API_BASE_URL || (import.meta.env.PROD ? "" : "http://localhost:3000");
export const AUTH_STORE_KEY = "patient_auth_v1";
const RAW_VITE_GOOGLE_CLIENT_ID = String(import.meta.env.VITE_GOOGLE_CLIENT_ID || "").trim();
export const GOOGLE_CLIENT_ID = RAW_VITE_GOOGLE_CLIENT_ID || "685818386228-vcoigkc8rp38hijrr1ghk3uknl11htb1.apps.googleusercontent.com";

export const COUNTRY_OPTIONS = [
  ["Sri Lankan", "LK", "Sri Lanka"],
  ["Indian", "IN", "India"],
  ["Bangladeshi", "BD", "Bangladesh"],
  ["Pakistani", "PK", "Pakistan"],
  ["Nepali", "NP", "Nepal"],
  ["Maldivian", "MV", "Maldives"],
  ["British", "GB", "United Kingdom"],
  ["American", "US", "United States"],
  ["Canadian", "CA", "Canada"],
  ["Australian", "AU", "Australia"],
  ["Other", "", "Other"]
];

export function getCountryFlag(nationality) {
  const option = COUNTRY_OPTIONS.find(([label]) => label.toLowerCase() === String(nationality || "").trim().toLowerCase());
  if (!option?.[1]) return "🌍";
  return option[1].replace(/[A-Z]/g, (letter) => String.fromCodePoint(letter.charCodeAt(0) + 127397));
}

export function getAgeFromDob(dob) {
  if (!dob) return null;
  const birth = new Date(dob);
  if (Number.isNaN(birth.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDelta = today.getMonth() - birth.getMonth();
  if (monthDelta < 0 || (monthDelta === 0 && today.getDate() < birth.getDate())) age -= 1;
  return age >= 0 && age <= 130 ? age : null;
}

export function loadGoogleIdentityScript() {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined") {
      return reject(new Error("Google identity script can only be loaded in the browser."));
    }

    if (window.google?.accounts?.id) {
      return resolve();
    }

    const existing = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
    if (existing) {
      existing.addEventListener("load", () => {
        if (window.google?.accounts?.id) resolve();
        else reject(new Error("Google identity library failed to initialize."));
      });
      existing.addEventListener("error", () => reject(new Error("Failed to load Google identity script.")));
      return;
    }

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => {
      if (window.google?.accounts?.id) {
        resolve();
      } else {
        reject(new Error("Google identity library failed to initialize."));
      }
    };
    script.onerror = () => reject(new Error("Failed to load Google identity script."));
    document.head.appendChild(script);
  });
}

export function normalizeDateForInput(value) {
  if (!value) return "";
  const text = String(value);
  return text.length >= 10 ? text.slice(0, 10) : "";
}

export function makeInitials(name) {
  const text = String(name || "").trim();
  if (!text) return "PT";
  const parts = text.split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() || "").join("");
}

export function readStoredSession() {
  try {
    const raw = sessionStorage.getItem(AUTH_STORE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.token) return null;
    return {
      token: parsed.token,
      role: parsed.role || "patient",
      user: parsed.user || null
    };
  } catch {
    return null;
  }
}

export function setErrorNetworkAware(err, setError) {
  if (err instanceof TypeError) {
    setError("Cannot reach server. Please check your connection or server status.");
  } else {
    setError(err.message || "Request failed.");
  }
}

export async function readJson(response) {
  const text = await response.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    return {};
  }
}

export function titleForPatientView(view) {
  const map = {
    dashboard: "Dashboard",
    profile: "My Profile",
    family: "Family Risk",
    appointments: "Appointments",
    symptom: "Symptom Checker",
    reports: "Reports",
    settings: "Settings"
  };
  return map[view] || "Patient Workspace";
}

export function titleForDoctorView(view) {
  const map = {
    dashboard: "Doctor Dashboard",
    profile: "Doctor Profile",
    appointments: "Appointments",
    diagnosis: "Diagnosis",
    prescriptions: "Prescriptions"
  };
  return map[view] || "Doctor Workspace";
}

export function titleForReceptionistView(view) {
  const map = {
    dashboard: "Receptionist Dashboard"
  };
  return map[view] || "Receptionist Workspace";
}
