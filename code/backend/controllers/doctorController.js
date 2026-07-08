import { doctorToPublicProfile, findDoctorByUsername, listDoctorsPublic, updateDoctorByUsername } from "../models/doctorModel.js";
import { normalizeDoctorSelfProfile, normalizeProfile } from "../models/profileModel.js";
import {
  createPatientDiagnosisLog,
  getPatientRecordById,
  listPatientDiagnosisLogs,
  listPatientsBasic,
  patientExists,
  updatePatientBasic,
  upsertPatientProfile
} from "../models/patientModel.js";
import { completeAppointmentByIdForDoctor, listAppointmentsInRange } from "../models/appointmentModel.js";

export async function getDoctorMe(req, res) {
  const username = String(req.auth?.username || "");
  const doctor = await findDoctorByUsername(username);
  if (!doctor) {
    return res.status(404).json({ error: "Doctor profile not found" });
  }
  return res.json({ user: doctorToPublicProfile(doctor) });
}

export async function updateDoctorMe(req, res) {
  const username = String(req.auth?.username || "");
  const doctor = await findDoctorByUsername(username);
  if (!doctor) {
    return res.status(404).json({ error: "Doctor profile not found" });
  }

  const normalized = normalizeDoctorSelfProfile(req.body || {});
  if (normalized.error) {
    return res.status(400).json({ error: normalized.error });
  }

  const updated = await updateDoctorByUsername(username, normalized);
  return res.json({ user: updated });
}

export async function listDoctors(_req, res) {
  return res.json({ doctors: await listDoctorsPublic() });
}

export async function doctorAppointments(_req, res) {
  try {
    const username = String(_req.auth?.username || "");
    const now = new Date();
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 30);

    const rows = await listAppointmentsInRange({
      startIso: start.toISOString().slice(0, 19).replace("T", " "),
      endIso: end.toISOString().slice(0, 19).replace("T", " "),
      doctorUsername: username
    });

    const appointments = rows.map((row) => {
      const when = new Date(row.scheduled_at);
      const dateText = Number.isNaN(when.getTime()) ? String(row.scheduled_at).slice(0, 10) : when.toISOString().slice(0, 10);
      const timeText = Number.isNaN(when.getTime()) ? String(row.scheduled_at).slice(11, 16) : when.toISOString().slice(11, 16);
      return {
        appointmentId: `APT-${row.id}`,
        id: row.id,
        time: `${dateText} ${timeText}`,
        status: row.status,
        reason: row.reason || "General consultation",
        consultationType: row.consultation_type || "In-Person",
        patient: {
          id: row.patient_id,
          fullName: row.full_name,
          bloodGroup: row.blood_group || "Not set",
          allergies: row.allergies || "None recorded"
        }
      };
    });

    return res.json({ appointments });
  } catch (error) {
    console.error("Doctor appointments error:", error);
    return res.status(500).json({ error: "Could not load doctor appointments" });
  }
}

export async function doctorPatients(_req, res) {
  try {
    const patients = await listPatientsBasic(300);
    return res.json({ patients });
  } catch (error) {
    console.error("Doctor patients error:", error);
    return res.status(500).json({ error: "Could not load patients" });
  }
}

export async function completeDoctorAppointment(req, res) {
  const appointmentId = Number(req.params.appointmentId);
  if (!Number.isFinite(appointmentId) || appointmentId <= 0) {
    return res.status(400).json({ error: "Invalid appointment id" });
  }

  try {
    const username = String(req.auth?.username || "");
    const ok = await completeAppointmentByIdForDoctor(appointmentId, username);
    if (!ok) return res.status(404).json({ error: "Appointment not found or already completed" });
    return res.json({ ok: true });
  } catch (error) {
    console.error("Complete appointment error:", error);
    return res.status(500).json({ error: "Could not complete appointment" });
  }
}

export async function getDoctorPatient(req, res) {
  const patientId = Number(req.params.patientId);
  if (!Number.isFinite(patientId) || patientId <= 0) {
    return res.status(400).json({ error: "Invalid patient id" });
  }

  try {
    const record = await getPatientRecordById(patientId);
    if (!record) return res.status(404).json({ error: "Patient not found" });
    return res.json(record);
  } catch (error) {
    console.error("Doctor get patient error:", error);
    return res.status(500).json({ error: "Could not load patient profile" });
  }
}

export async function updateDoctorPatient(req, res) {
  const patientId = Number(req.params.patientId);
  if (!Number.isFinite(patientId) || patientId <= 0) {
    return res.status(400).json({ error: "Invalid patient id" });
  }

  const fullName = String(req.body?.patient?.fullName || "").trim();
  const phone = String(req.body?.patient?.phone || "").trim();
  const profile = normalizeProfile(req.body?.profile || {});

  if (!fullName || !phone) {
    return res.status(400).json({ error: "Patient fullName and phone are required" });
  }

  try {
    const exists = await patientExists(patientId);
    if (!exists) return res.status(404).json({ error: "Patient not found" });

    await updatePatientBasic(patientId, { fullName, phone });
    await upsertPatientProfile(patientId, profile);

    const record = await getPatientRecordById(patientId);
    return res.json(record);
  } catch (error) {
    console.error("Doctor update patient error:", error);
    return res.status(500).json({ error: "Could not update patient profile" });
  }
}

export async function getDoctorPatientDiagnosisLogs(req, res) {
  const patientId = Number(req.params.patientId);
  if (!Number.isFinite(patientId) || patientId <= 0) {
    return res.status(400).json({ error: "Invalid patient id" });
  }

  try {
    const exists = await patientExists(patientId);
    if (!exists) return res.status(404).json({ error: "Patient not found" });

    const logs = await listPatientDiagnosisLogs(patientId, 100);
    return res.json({ logs });
  } catch (error) {
    console.error("Doctor diagnosis log list error:", error);
    return res.status(500).json({ error: "Could not load diagnosis history" });
  }
}

export async function createDoctorPatientDiagnosisLog(req, res) {
  const patientId = Number(req.params.patientId);
  if (!Number.isFinite(patientId) || patientId <= 0) {
    return res.status(400).json({ error: "Invalid patient id" });
  }

  const visitDate = String(req.body?.visitDate || "").trim();
  const diagnosis = String(req.body?.diagnosis || "").trim();
  const healthStatus = String(req.body?.healthStatus || "").trim();
  const treatmentNotes = String(req.body?.treatmentNotes || "").trim();
  const nextSteps = String(req.body?.nextSteps || "").trim();

  if (!visitDate || Number.isNaN(new Date(`${visitDate}T00:00:00`).getTime())) {
    return res.status(400).json({ error: "Valid visit date is required" });
  }
  if (!diagnosis) return res.status(400).json({ error: "Diagnosis is required" });
  if (!healthStatus) return res.status(400).json({ error: "Health status is required" });

  try {
    const exists = await patientExists(patientId);
    if (!exists) return res.status(404).json({ error: "Patient not found" });

    await createPatientDiagnosisLog({
      patientId,
      doctorUsername: String(req.auth?.username || "doctor"),
      visitDate,
      diagnosis,
      healthStatus,
      treatmentNotes,
      nextSteps
    });

    const logs = await listPatientDiagnosisLogs(patientId, 100);
    return res.status(201).json({ logs });
  } catch (error) {
    console.error("Doctor diagnosis log create error:", error);
    return res.status(500).json({ error: "Could not save diagnosis log" });
  }
}
