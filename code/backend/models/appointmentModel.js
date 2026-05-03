import { pool } from "../config/db.js";

export async function listAppointmentsInRange({ startIso, endIso, doctorUsername = null, statuses = ["Confirmed"] }) {
  const params = [startIso, endIso];
  let whereDoctor = "";
  if (doctorUsername) {
    whereDoctor = " AND a.doctor_username = ? ";
    params.push(doctorUsername);
  }

  const safeStatuses = (statuses || ["Confirmed"]).map((status) => String(status || "").trim()).filter(Boolean);
  if (!safeStatuses.length) safeStatuses.push("Confirmed");
  const statusClause = safeStatuses.map(() => "?").join(", ");
  params.push(...safeStatuses);

  const [rows] = await pool.query(
    `
      SELECT
        a.id,
        a.patient_id,
        a.doctor_username,
        a.scheduled_at,
        a.status,
        a.reason,
        a.payment_status,
        a.payment_amount,
        a.payment_currency,
        a.payment_reference,
        a.paid_at,
        u.full_name,
        p.blood_group,
        p.allergies
      FROM appointments a
      INNER JOIN users u ON u.id = a.patient_id
      LEFT JOIN patient_profiles p ON p.user_id = a.patient_id
      WHERE a.scheduled_at >= ? AND a.scheduled_at < ?
      ${whereDoctor}
      AND a.status IN (${statusClause})
      ORDER BY a.scheduled_at ASC
    `,
    params
  );
  return rows;
}

export async function createAppointment({ patientId, doctorUsername, scheduledAt, reason, createdBy, status = "Confirmed" }) {
  const [result] = await pool.query(
    `
      INSERT INTO appointments (patient_id, doctor_username, scheduled_at, status, reason, created_by)
      VALUES (?, ?, ?, ?, ?, ?)
    `,
    [patientId, doctorUsername, scheduledAt, status, reason || "General consultation", createdBy]
  );
  return result.insertId;
}

export async function listPendingAppointmentRequests(limit = 100) {
  const [rows] = await pool.query(
    `
      SELECT
        a.id,
        a.patient_id,
        a.doctor_username,
        a.scheduled_at,
        a.status,
        a.reason,
        a.payment_status,
        a.payment_amount,
        a.payment_currency,
        a.payment_reference,
        a.paid_at,
        u.full_name,
        p.blood_group,
        p.allergies
      FROM appointments a
      INNER JOIN users u ON u.id = a.patient_id
      LEFT JOIN patient_profiles p ON p.user_id = a.patient_id
      WHERE a.status = 'Pending'
      ORDER BY a.scheduled_at ASC
      LIMIT ?
    `,
    [limit]
  );
  return rows;
}

export async function confirmAppointmentById(appointmentId) {
  const [result] = await pool.query(
    `
      UPDATE appointments
      SET status = 'Confirmed'
      WHERE id = ? AND status = 'Pending'
    `,
    [appointmentId]
  );
  return result.affectedRows > 0;
}

export async function cancelAppointmentById(appointmentId) {
  const [result] = await pool.query(
    `
      UPDATE appointments
      SET status = 'Cancelled'
      WHERE id = ? AND status IN ('Pending', 'Confirmed')
    `,
    [appointmentId]
  );
  return result.affectedRows > 0;
}

export async function completeAppointmentByIdForDoctor(appointmentId, doctorUsername) {
  const [result] = await pool.query(
    `
      UPDATE appointments
      SET status = 'Completed'
      WHERE id = ? AND doctor_username = ? AND status = 'Confirmed'
    `,
    [appointmentId, doctorUsername]
  );
  return result.affectedRows > 0;
}

export async function uploadPatientReport({ patientId, fileName, mimeType, reportData, uploadedBy }) {
  const [result] = await pool.query(
    `
      INSERT INTO patient_reports (patient_id, file_name, mime_type, report_data, uploaded_by)
      VALUES (?, ?, ?, ?, ?)
    `,
    [patientId, fileName, mimeType, reportData, uploadedBy]
  );
  return result.insertId;
}

export async function listPatientReports(patientId, limit = 50) {
  const [rows] = await pool.query(
    `
      SELECT id, patient_id, file_name, mime_type, uploaded_by, uploaded_at
      FROM patient_reports
      WHERE patient_id = ?
      ORDER BY uploaded_at DESC
      LIMIT ?
    `,
    [patientId, limit]
  );
  return rows;
}

export async function listAppointmentsForPatient(patientId, limit = 200) {
  const [rows] = await pool.query(
    `
      SELECT
        a.id,
        a.patient_id,
        a.doctor_username,
        a.scheduled_at,
        a.status,
        a.reason,
        a.payment_status,
        a.payment_amount,
        a.payment_currency,
        a.payment_reference,
        a.paid_at
      FROM appointments a
      WHERE a.patient_id = ?
      ORDER BY a.scheduled_at DESC
      LIMIT ?
    `,
    [patientId, limit]
  );
  return rows;
}

export async function getPatientAppointmentById(patientId, appointmentId) {
  const [rows] = await pool.query(
    `
      SELECT
        id,
        patient_id,
        doctor_username,
        scheduled_at,
        status,
        reason,
        payment_status,
        payment_amount,
        payment_currency,
        payment_reference,
        paid_at
      FROM appointments
      WHERE patient_id = ? AND id = ?
      LIMIT 1
    `,
    [patientId, appointmentId]
  );
  return rows[0] || null;
}

export async function markAppointmentPaid({ patientId, appointmentId, paymentReference }) {
  const [result] = await pool.query(
    `
      UPDATE appointments
      SET payment_status = 'Paid', payment_reference = ?, paid_at = NOW()
      WHERE patient_id = ? AND id = ? AND status = 'Confirmed' AND payment_status <> 'Paid'
    `,
    [paymentReference, patientId, appointmentId]
  );
  return result.affectedRows > 0;
}

export async function listPatientReportsWithData(patientId, limit = 100) {
  const [rows] = await pool.query(
    `
      SELECT
        id,
        patient_id,
        file_name,
        mime_type,
        report_data,
        uploaded_by,
        uploaded_at
      FROM patient_reports
      WHERE patient_id = ?
      ORDER BY uploaded_at DESC
      LIMIT ?
    `,
    [patientId, limit]
  );
  return rows;
}
