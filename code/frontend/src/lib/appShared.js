export const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";
export const AUTH_STORE_KEY = "patient_auth_v1";

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
    const raw = localStorage.getItem(AUTH_STORE_KEY);
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
    setError("Cannot reach server. Start backend on http://localhost:3000.");
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

function compactCalendarDate(value) {
  return value.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

export function buildGoogleCalendarUrl(appointment) {
  const start = new Date(appointment?.scheduledAt || appointment?.scheduled_at || "");
  if (Number.isNaN(start.getTime())) return "";
  const end = new Date(start);
  end.setMinutes(end.getMinutes() + 30);

  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: `Appointment with Dr. ${appointment.doctorUsername || appointment.doctor_username || ""}`.trim(),
    dates: `${compactCalendarDate(start)}/${compactCalendarDate(end)}`,
    details: `Reason: ${appointment.reason || "General consultation"}\nAppointment: ${appointment.appointmentId || `APT-${appointment.id}`}`
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
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
