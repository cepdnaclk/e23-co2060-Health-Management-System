import {
  findUserById,
  findUserByPatientUid,
  findUserWithProfileById,
  getPatientFamilyTree,
  listPatientDiagnosisLogs,
  normalizePatientUid,
  updateUserAccount,
  upsertPatientProfile
} from "../models/patientModel.js";
import { normalizeAuthProfile, normalizeProfile } from "../models/profileModel.js";
import { getPatientAppointmentById, listAppointmentsForPatient, listPatientReportsWithData, markAppointmentPaid } from "../models/appointmentModel.js";
import { predictHereditaryRisks } from "../services/hereditaryRiskService.js";

function appointmentPaymentFields(row) {
  return {
    paymentStatus: row.payment_status || "Unpaid",
    paymentAmount: Number(row.payment_amount ?? 2500),
    paymentCurrency: row.payment_currency || "LKR",
    paymentReference: row.payment_reference || null,
    paidAt: row.paid_at || null
  };
}

function patientSessionUser(row) {
  return {
    id: row.id,
    patientId: row.patient_uid,
    username: row.username,
    fullName: row.full_name,
    email: row.email,
    phone: row.phone,
    profilePhotoUrl: row.profile_photo_url
  };
}

async function validateFamilyLinks({ profile, currentUser }) {
  const motherPatientId = normalizePatientUid(profile.motherPatientId);
  const fatherPatientId = normalizePatientUid(profile.fatherPatientId);
  const ownPatientId = normalizePatientUid(currentUser.patient_uid);

  if (motherPatientId && motherPatientId === ownPatientId) {
    return { error: "Mother patient ID cannot be your own patient ID" };
  }
  if (fatherPatientId && fatherPatientId === ownPatientId) {
    return { error: "Father patient ID cannot be your own patient ID" };
  }
  if (motherPatientId && fatherPatientId && motherPatientId === fatherPatientId) {
    return { error: "Mother and father patient IDs must be different" };
  }

  for (const [label, patientId] of [
    ["Mother", motherPatientId],
    ["Father", fatherPatientId]
  ]) {
    if (!patientId) continue;
    const parent = await findUserByPatientUid(patientId);
    if (!parent) return { error: `${label} patient ID was not found` };
  }

  return {
    motherPatientId: motherPatientId || null,
    fatherPatientId: fatherPatientId || null
  };
}

export async function getPatientMe(req, res) {
  try {
    const row = await findUserWithProfileById(req.userId);
    if (!row) return res.status(404).json({ error: "User not found" });

    return res.json({
      user: patientSessionUser(row),
      profile: {
        dob: row.dob,
        gender: row.gender,
        address: row.address,
        emergencyContact: row.emergency_contact,
        bloodGroup: row.blood_group,
        allergies: row.allergies,
        knownConditions: row.known_conditions,
        motherPatientId: row.mother_patient_uid,
        fatherPatientId: row.father_patient_uid
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
      user: patientSessionUser(user)
    });
  } catch (error) {
    console.error("Update auth profile error:", error);
    return res.status(500).json({ error: "Could not update account profile" });
  }
}

export async function updatePatientMe(req, res) {
  const profile = normalizeProfile(req.body || {});

  try {
    const currentUser = await findUserById(req.userId);
    if (!currentUser) return res.status(404).json({ error: "User not found" });

    const familyLinks = await validateFamilyLinks({ profile, currentUser });
    if (familyLinks.error) {
      return res.status(400).json({ error: familyLinks.error });
    }

    profile.motherPatientId = familyLinks.motherPatientId;
    profile.fatherPatientId = familyLinks.fatherPatientId;

    await upsertPatientProfile(req.userId, profile);
    return res.json({ ok: true });
  } catch (error) {
    console.error("Update profile error:", error);
    return res.status(500).json({ error: "Could not update profile" });
  }
}

export async function lookupPatientByUid(req, res) {
  const patientId = normalizePatientUid(req.query?.patientId || req.params?.patientId);
  if (!patientId) return res.status(400).json({ error: "patientId is required" });

  try {
    const patient = await findUserByPatientUid(patientId);
    if (!patient) return res.status(404).json({ error: "Patient ID not found" });
    return res.json({
      patient: {
        patientId: patient.patient_uid,
        fullName: patient.full_name,
        profilePhotoUrl: patient.profile_photo_url
      }
    });
  } catch (error) {
    console.error("Patient lookup error:", error);
    return res.status(500).json({ error: "Could not lookup patient" });
  }
}

export async function getPatientFamilyRisk(req, res) {
  try {
    const family = await getPatientFamilyTree(req.userId);
    if (!family) return res.status(404).json({ error: "User not found" });

    const risks = await predictHereditaryRisks(family);
    return res.json({
      family,
      risks,
      disclaimer: "Screening estimate only; not a diagnosis."
    });
  } catch (error) {
    console.error("Get family risk error:", error);
    return res.status(500).json({ error: "Could not fetch family risk" });
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
      reason: row.reason || "General consultation",
      ...appointmentPaymentFields(row)
    }));
    return res.json({ appointments });
  } catch (error) {
    console.error("Get patient appointments error:", error);
    return res.status(500).json({ error: "Could not fetch appointments" });
  }
}

export async function getPatientDiagnosisLogs(req, res) {
  try {
    const logs = await listPatientDiagnosisLogs(req.userId, 100);
    return res.json({ logs });
  } catch (error) {
    console.error("Get patient diagnosis logs error:", error);
    return res.status(500).json({ error: "Could not fetch medical log" });
  }
}

export async function payPatientAppointment(req, res) {
  const appointmentId = Number(req.params?.appointmentId);
  const cardNumber = String(req.body?.cardNumber || "").replace(/\D/g, "");
  const cardName = String(req.body?.cardName || "").trim();
  const expiry = String(req.body?.expiry || "").trim();
  const cvv = String(req.body?.cvv || "").trim();

  if (!Number.isFinite(appointmentId) || appointmentId <= 0) {
    return res.status(400).json({ error: "Valid appointment id is required" });
  }

  if (!cardName) {
    return res.status(400).json({ error: "Name on card is required" });
  }

  if (cardNumber.length < 4) {
    return res.status(400).json({ error: "Enter at least 4 card number digits for mock payment" });
  }

  if (!/^\d{2}\/\d{2}$/.test(expiry)) {
    return res.status(400).json({ error: "Expiry must use MM/YY format" });
  }

  if (!/^\d{3,4}$/.test(cvv)) {
    return res.status(400).json({ error: "CVV must be 3 or 4 digits" });
  }

  try {
    const appointment = await getPatientAppointmentById(req.userId, appointmentId);
    if (!appointment) return res.status(404).json({ error: "Appointment not found" });
    if (appointment.status !== "Confirmed") return res.status(400).json({ error: "Only confirmed appointments can be paid" });
    if (appointment.payment_status === "Paid") {
      return res.json({
        ok: true,
        paymentStatus: "Paid",
        paymentReference: appointment.payment_reference,
        paidAt: appointment.paid_at
      });
    }

    const paymentReference = `PAY-${Date.now()}-${appointmentId}`;
    const paid = await markAppointmentPaid({ patientId: req.userId, appointmentId, paymentReference });
    if (!paid) return res.status(409).json({ error: "Payment could not be completed" });

    const updated = await getPatientAppointmentById(req.userId, appointmentId);
    return res.json({
      ok: true,
      paymentStatus: updated.payment_status,
      paymentReference: updated.payment_reference,
      paidAt: updated.paid_at,
      paymentAmount: Number(updated.payment_amount ?? 2500),
      paymentCurrency: updated.payment_currency || "LKR"
    });
  } catch (error) {
    console.error("Payment error:", error);
    return res.status(500).json({ error: "Payment failed" });
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
