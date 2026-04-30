import { findUserById, findUserWithProfileById, updateUserAccount, upsertPatientProfile } from "../models/patientModel.js";
import { normalizeAuthProfile, normalizeProfile } from "../models/profileModel.js";
import { getPatientAppointmentById, listAppointmentsForPatient, listPatientReportsWithData, markAppointmentPaid } from "../models/appointmentModel.js";

function appointmentPaymentFields(row) {
  return {
    paymentStatus: row.payment_status || "Unpaid",
    paymentAmount: Number(row.payment_amount ?? 2500),
    paymentCurrency: row.payment_currency || "LKR",
    paymentReference: row.payment_reference || null,
    paidAt: row.paid_at || null
  };
}

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
      reason: row.reason || "General consultation",
      ...appointmentPaymentFields(row)
    }));
    return res.json({ appointments });
  } catch (error) {
    console.error("Get patient appointments error:", error);
    return res.status(500).json({ error: "Could not fetch appointments" });
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
