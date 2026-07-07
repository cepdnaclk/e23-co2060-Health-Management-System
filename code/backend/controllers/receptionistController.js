import { listDoctorsPublic, findDoctorByUsername } from "../models/doctorModel.js";
import { patientExists, listPatientsBasic } from "../models/patientModel.js";
import {
  cancelAppointmentById,
  confirmAppointmentById,
  createAppointment,
  listAppointmentsInRange,
  listPendingAppointmentRequests,
  listPatientReports,
  uploadPatientReport
} from "../models/appointmentModel.js";

function parseRangeInput(range, dateText) {
  const selected = String(range || "day").toLowerCase();
  const safeRange = ["day", "week", "month"].includes(selected) ? selected : "day";
  const base = dateText ? new Date(`${dateText}T00:00:00`) : new Date();
  if (Number.isNaN(base.getTime())) {
    return { error: "Invalid date" };
  }

  const start = new Date(base);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);

  if (safeRange === "day") {
    end.setDate(end.getDate() + 1);
  } else if (safeRange === "week") {
    end.setDate(end.getDate() + 7);
  } else {
    end.setMonth(end.getMonth() + 1);
  }

  return { safeRange, startIso: start.toISOString().slice(0, 19).replace("T", " "), endIso: end.toISOString().slice(0, 19).replace("T", " ") };
}

function toAppointmentView(row) {
  const when = new Date(row.scheduled_at);
  const dateText = Number.isNaN(when.getTime()) ? String(row.scheduled_at).slice(0, 10) : when.toISOString().slice(0, 10);
  const timeText = Number.isNaN(when.getTime()) ? String(row.scheduled_at).slice(11, 16) : when.toISOString().slice(11, 16);
  return {
    appointmentId: `APT-${row.id}`,
    id: row.id,
    date: dateText,
    time: timeText,
    scheduledAt: row.scheduled_at,
    status: row.status,
    reason: row.reason || "General consultation",
    doctorUsername: row.doctor_username,
    patient: {
      id: row.patient_id,
      fullName: row.full_name,
      bloodGroup: row.blood_group || "Not set",
      allergies: row.allergies || "None recorded"
    }
  };
}

export async function receptionistOverview(req, res) {
  const { range, date, doctor } = req.query;
  const parsed = parseRangeInput(range, date);
  if (parsed.error) return res.status(400).json({ error: parsed.error });

  try {
    const doctors = await listDoctorsPublic();
    const patients = await listPatientsBasic(300);
    const appointments = await listAppointmentsInRange({
      startIso: parsed.startIso,
      endIso: parsed.endIso,
      doctorUsername: doctor ? String(doctor) : null,
      statuses: ["Pending", "Confirmed"]
    });
    const pendingRequests = await listPendingAppointmentRequests(100);

    return res.json({
      range: parsed.safeRange,
      doctors,
      patients,
      appointments: appointments.map(toAppointmentView),
      pendingRequests: pendingRequests.map(toAppointmentView)
    });
  } catch (error) {
    console.error("Reception overview error:", error);
    return res.status(500).json({ error: "Could not load receptionist overview" });
  }
}

export async function receptionistCreateAppointment(req, res) {
  const patientId = Number(req.body?.patientId);
  const doctorUsername = String(req.body?.doctorUsername || "").trim();
  const scheduledAtRaw = String(req.body?.scheduledAt || "").trim();
  const reason = String(req.body?.reason || "").trim();

  if (!Number.isFinite(patientId) || patientId <= 0) return res.status(400).json({ error: "Valid patientId is required" });
  if (!doctorUsername) return res.status(400).json({ error: "doctorUsername is required" });
  if (!scheduledAtRaw) return res.status(400).json({ error: "scheduledAt is required" });

  const doctor = await findDoctorByUsername(doctorUsername);
  if (!doctor) return res.status(404).json({ error: "Doctor not found" });

  const appointmentDate = new Date(scheduledAtRaw);
  if (Number.isNaN(appointmentDate.getTime())) {
    return res.status(400).json({ error: "Invalid scheduledAt date-time" });
  }

  try {
    const exists = await patientExists(patientId);
    if (!exists) return res.status(404).json({ error: "Patient not found" });

    const createdId = await createAppointment({
      patientId,
      doctorUsername,
      scheduledAt: appointmentDate.toISOString().slice(0, 19).replace("T", " "),
      reason,
      createdBy: String(req.auth?.username || req.auth?.sub || "reception")
    });

    return res.status(201).json({ ok: true, appointmentId: createdId });
  } catch (error) {
    console.error("Reception create appointment error:", error);
    return res.status(500).json({ error: "Could not create appointment" });
  }
}

export async function receptionistConfirmAppointment(req, res) {
  const appointmentId = Number(req.params.appointmentId);
  if (!Number.isFinite(appointmentId) || appointmentId <= 0) {
    return res.status(400).json({ error: "Invalid appointment id" });
  }

  try {
    const ok = await confirmAppointmentById(appointmentId);
    if (!ok) return res.status(404).json({ error: "Appointment request not found or already confirmed" });
    return res.json({ ok: true });
  } catch (error) {
    console.error("Reception confirm appointment error:", error);
    return res.status(500).json({ error: "Could not confirm appointment" });
  }
}

export async function receptionistCancelAppointment(req, res) {
  const appointmentId = Number(req.params.appointmentId);
  if (!Number.isFinite(appointmentId) || appointmentId <= 0) {
    return res.status(400).json({ error: "Invalid appointment id" });
  }

  try {
    const ok = await cancelAppointmentById(appointmentId);
    if (!ok) return res.status(404).json({ error: "Appointment not found or already cancelled" });
    return res.json({ ok: true });
  } catch (error) {
    console.error("Reception cancel appointment error:", error);
    return res.status(500).json({ error: "Could not cancel appointment" });
  }
}

export async function receptionistUploadReport(req, res) {
  const patientId = Number(req.body?.patientId);
  const fileName = String(req.body?.fileName || "").trim();
  const mimeType = String(req.body?.mimeType || "").trim().toLowerCase();
  const reportData = String(req.body?.reportData || "");

  if (!Number.isFinite(patientId) || patientId <= 0) return res.status(400).json({ error: "Valid patientId is required" });
  if (!fileName) return res.status(400).json({ error: "fileName is required" });
  if (mimeType !== "application/pdf") return res.status(400).json({ error: "Only PDF reports are supported" });
  if (!reportData.startsWith("data:application/pdf")) return res.status(400).json({ error: "Invalid PDF payload format" });
  if (reportData.length > 4_000_000) return res.status(400).json({ error: "PDF is too large" });

  try {
    const exists = await patientExists(patientId);
    if (!exists) return res.status(404).json({ error: "Patient not found" });

    const reportId = await uploadPatientReport({
      patientId,
      fileName,
      mimeType,
      reportData,
      uploadedBy: String(req.auth?.username || req.auth?.sub || "reception")
    });

    return res.status(201).json({ ok: true, reportId });
  } catch (error) {
    console.error("Reception upload report error:", error);
    return res.status(500).json({ error: "Could not upload report" });
  }
}

export async function receptionistPatientReports(req, res) {
  const patientId = Number(req.params.patientId);
  if (!Number.isFinite(patientId) || patientId <= 0) {
    return res.status(400).json({ error: "Invalid patient id" });
  }

  try {
    const exists = await patientExists(patientId);
    if (!exists) return res.status(404).json({ error: "Patient not found" });
    const reports = await listPatientReports(patientId, 100);
    return res.json({ reports });
  } catch (error) {
    console.error("Reception list reports error:", error);
    return res.status(500).json({ error: "Could not load reports" });
  }
}
