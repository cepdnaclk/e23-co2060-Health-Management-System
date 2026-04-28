import { findUserById, findUserWithProfileById, updateUserAccount, upsertPatientProfile } from "../models/patientModel.js";
import { normalizeAuthProfile, normalizeProfile } from "../models/profileModel.js";
import { listAppointmentsForPatient, listPatientReportsWithData } from "../models/appointmentModel.js";

export async function getPatientMe(req, res) {
  try {
    const row = await findUserWithProfileById(req.userId);
    if (!row) return res.status(404).json({ error: "User not found" });

    return res.json({
      user: {
        id: row.id,
        fullName: row.full_name,
        email: row.email,
        phone: row.phone,
        profilePhotoUrl: row.profile_photo_url
      },
      profile: {
        dob: row.dob,
        gender: row.gender,
        address: row.address,
        emergencyContact: row.emergency_contact,
        bloodGroup: row.blood_group,
        allergies: row.allergies
      }
    });
  } catch (error) {
    console.error("Get profile error:", error);
    return res.status(500).json({ error: "Could not fetch profile" });
  }
}

export async function updateAuthMe(req, res) {
  const normalized = normalizeAuthProfile(req.body || {});
  if (normalized.error) {
    return res.status(400).json({ error: normalized.error });
  }

  try {
    await updateUserAccount(req.userId, normalized);

    const user = await findUserById(req.userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    return res.json({
      user: {
        id: user.id,
        fullName: user.full_name,
        email: user.email,
        phone: user.phone,
        profilePhotoUrl: user.profile_photo_url
      }
    });
  } catch (error) {
    console.error("Update auth profile error:", error);
    return res.status(500).json({ error: "Could not update account profile" });
  }
}

export async function updatePatientMe(req, res) {
  const profile = normalizeProfile(req.body || {});

  try {
    await upsertPatientProfile(req.userId, profile);
    return res.json({ ok: true });
  } catch (error) {
    console.error("Update profile error:", error);
    return res.status(500).json({ error: "Could not update profile" });
  }
}

export async function getPatientAppointments(req, res) {
  try {
    const rows = await listAppointmentsForPatient(req.userId, 300);
    const appointments = rows.map((row) => ({
      appointmentId: `APT-${row.id}`,
      id: row.id,
      doctorUsername: row.doctor_username,
      scheduledAt: row.scheduled_at,
      status: row.status,
      reason: row.reason || "General consultation"
    }));
    return res.json({ appointments });
  } catch (error) {
    console.error("Get patient appointments error:", error);
    return res.status(500).json({ error: "Could not fetch appointments" });
  }
}

export async function getPatientReports(req, res) {
  try {
    const rows = await listPatientReportsWithData(req.userId, 200);
    const reports = rows.map((row) => ({
      id: row.id,
      fileName: row.file_name,
      mimeType: row.mime_type,
      reportData: row.report_data,
      uploadedBy: row.uploaded_by,
      uploadedAt: row.uploaded_at
    }));
    return res.json({ reports });
  } catch (error) {
    console.error("Get patient reports error:", error);
    return res.status(500).json({ error: "Could not fetch reports" });
  }
}
