import { pool } from "../config/db.js";
import { mapPatientRecord } from "./profileModel.js";

const USER_AUTH_COLUMNS = "id, username, patient_uid, email, password_hash, full_name, phone, profile_photo_url";
const USER_PUBLIC_COLUMNS = "id, username, patient_uid, full_name, email, phone, profile_photo_url";

export function normalizePatientUid(value) {
  return String(value || "").trim().toUpperCase();
}

export function makePatientUid(id) {
  return `PT-${String(id).padStart(6, "0")}`;
}

function patientNode(row, relationship = "Self") {
  if (!row) return null;
  return {
    id: row.id,
    patientId: row.patient_uid,
    username: row.username,
    fullName: row.full_name,
    email: row.email,
    phone: row.phone,
    profilePhotoUrl: row.profile_photo_url,
    relationship,
    knownConditions: row.known_conditions || null
  };
}

export async function findUserByEmail(email) {
  const [rows] = await pool.query(`SELECT ${USER_AUTH_COLUMNS} FROM users WHERE email = ? LIMIT 1`, [email]);
  return rows[0] || null;
}

export async function findUserByLoginIdentifier(identifier) {
  const value = String(identifier || "").trim();
  const patientUid = normalizePatientUid(value);
  const [rows] = await pool.query(
    `SELECT ${USER_AUTH_COLUMNS}
     FROM users
     WHERE email = ? OR username = ? OR patient_uid = ?
     LIMIT 1`,
    [value.toLowerCase(), value.toLowerCase(), patientUid]
  );
  return rows[0] || null;
}

export async function createUser({ fullName, email, phone, passwordHash }) {
  const [result] = await pool.query("INSERT INTO users (full_name, email, phone, password_hash) VALUES (?, ?, ?, ?)", [
    fullName,
    email,
    phone,
    passwordHash
  ]);
  await setPatientUid(result.insertId, makePatientUid(result.insertId));
  const [rows] = await pool.query(`SELECT ${USER_PUBLIC_COLUMNS} FROM users WHERE id = ? LIMIT 1`, [result.insertId]);
  return rows[0] || null;
}

export async function findUserById(id) {
  const [rows] = await pool.query(`SELECT ${USER_PUBLIC_COLUMNS} FROM users WHERE id = ? LIMIT 1`, [id]);
  return rows[0] || null;
}

export async function findUserByPatientUid(patientUid) {
  const [rows] = await pool.query(`SELECT ${USER_PUBLIC_COLUMNS} FROM users WHERE patient_uid = ? LIMIT 1`, [
    normalizePatientUid(patientUid)
  ]);
  return rows[0] || null;
}

export async function findUserWithProfileById(id) {
  const [rows] = await pool.query(
    `
      SELECT
        u.id,
        u.username,
        u.patient_uid,
        u.full_name,
        u.email,
        u.phone,
        u.profile_photo_url,
        p.dob,
        p.gender,
        p.address,
        p.emergency_contact,
        p.blood_group,
        p.allergies,
        p.known_conditions,
        p.mother_patient_uid,
        p.father_patient_uid
      FROM users u
      LEFT JOIN patient_profiles p ON p.user_id = u.id
      WHERE u.id = ?
      LIMIT 1
    `,
    [id]
  );
  return rows[0] || null;
}

export async function findUserWithProfileByPatientUid(patientUid) {
  const [rows] = await pool.query(
    `
      SELECT
        u.id,
        u.username,
        u.patient_uid,
        u.full_name,
        u.email,
        u.phone,
        u.profile_photo_url,
        p.dob,
        p.gender,
        p.address,
        p.emergency_contact,
        p.blood_group,
        p.allergies,
        p.known_conditions,
        p.mother_patient_uid,
        p.father_patient_uid
      FROM users u
      LEFT JOIN patient_profiles p ON p.user_id = u.id
      WHERE u.patient_uid = ?
      LIMIT 1
    `,
    [normalizePatientUid(patientUid)]
  );
  return rows[0] || null;
}

export async function updateUserAccount(id, { fullName, phone, profilePhotoUrl }) {
  await pool.query("UPDATE users SET full_name = ?, phone = ?, profile_photo_url = ? WHERE id = ?", [
    fullName,
    phone,
    profilePhotoUrl,
    id
  ]);
}

export async function upsertPatientProfile(userId, profile) {
  await pool.query(
    `
      INSERT INTO patient_profiles (
        user_id,
        dob,
        gender,
        address,
        emergency_contact,
        blood_group,
        allergies,
        known_conditions,
        mother_patient_uid,
        father_patient_uid
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        dob = VALUES(dob),
        gender = VALUES(gender),
        address = VALUES(address),
        emergency_contact = VALUES(emergency_contact),
        blood_group = VALUES(blood_group),
        allergies = VALUES(allergies),
        known_conditions = VALUES(known_conditions),
        mother_patient_uid = VALUES(mother_patient_uid),
        father_patient_uid = VALUES(father_patient_uid)
    `,
    [
      userId,
      profile.dob,
      profile.gender,
      profile.address,
      profile.emergencyContact,
      profile.bloodGroup,
      profile.allergies,
      profile.knownConditions,
      profile.motherPatientId,
      profile.fatherPatientId
    ]
  );
}

export async function getPatientFamilyTree(userId) {
  const patient = await findUserWithProfileById(userId);
  if (!patient) return null;

  const [mother, father] = await Promise.all([
    patient.mother_patient_uid ? findUserWithProfileByPatientUid(patient.mother_patient_uid) : Promise.resolve(null),
    patient.father_patient_uid ? findUserWithProfileByPatientUid(patient.father_patient_uid) : Promise.resolve(null)
  ]);

  return {
    patient: patientNode(patient, "Self"),
    parents: {
      mother: patientNode(mother, "Mother"),
      father: patientNode(father, "Father")
    }
  };
}

export async function listUsersMissingPatientUid() {
  const [rows] = await pool.query("SELECT id FROM users WHERE patient_uid IS NULL OR patient_uid = '' ORDER BY id ASC");
  return rows;
}

export async function setPatientUid(id, patientUid) {
  await pool.query("UPDATE users SET patient_uid = ? WHERE id = ?", [normalizePatientUid(patientUid), id]);
}

export async function listPatientsForAppointments(limit = 20) {
  const [rows] = await pool.query(
    `
      SELECT
        u.id,
        u.full_name,
        p.blood_group,
        p.allergies
      FROM users u
      LEFT JOIN patient_profiles p ON p.user_id = u.id
      ORDER BY u.created_at DESC
      LIMIT ?
    `,
    [limit]
  );
  return rows;
}

export async function listPatientsBasic(limit = 200) {
  const [rows] = await pool.query(
    `
      SELECT id, patient_uid, full_name, email
      FROM users
      ORDER BY full_name ASC
      LIMIT ?
    `,
    [limit]
  );
  return rows.map((row) => ({
    id: row.id,
    patientId: row.patient_uid,
    fullName: row.full_name,
    email: row.email
  }));
}

function mapDiagnosisLog(row) {
  return {
    id: row.id,
    patientId: row.patient_id,
    doctorUsername: row.doctor_username,
    visitDate: row.visit_date,
    diagnosis: row.diagnosis,
    healthStatus: row.health_status,
    treatmentNotes: row.treatment_notes || "",
    nextSteps: row.next_steps || "",
    createdAt: row.created_at
  };
}

export async function listPatientDiagnosisLogs(patientId, limit = 50) {
  const [rows] = await pool.query(
    `
      SELECT
        id,
        patient_id,
        doctor_username,
        visit_date,
        diagnosis,
        health_status,
        treatment_notes,
        next_steps,
        created_at
      FROM patient_diagnosis_logs
      WHERE patient_id = ?
      ORDER BY visit_date DESC, created_at DESC
      LIMIT ?
    `,
    [patientId, limit]
  );
  return rows.map(mapDiagnosisLog);
}

export async function createPatientDiagnosisLog({
  patientId,
  doctorUsername,
  visitDate,
  diagnosis,
  healthStatus,
  treatmentNotes,
  nextSteps
}) {
  const [result] = await pool.query(
    `
      INSERT INTO patient_diagnosis_logs (
        patient_id,
        doctor_username,
        visit_date,
        diagnosis,
        health_status,
        treatment_notes,
        next_steps
      )
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `,
    [patientId, doctorUsername, visitDate, diagnosis, healthStatus, treatmentNotes, nextSteps]
  );
  return result.insertId;
}

export async function getPatientRecordById(patientId) {
  const row = await findUserWithProfileById(patientId);
  if (!row) return null;
  return mapPatientRecord(row);
}

export async function patientExists(patientId) {
  const [existing] = await pool.query("SELECT id FROM users WHERE id = ? LIMIT 1", [patientId]);
  return existing.length > 0;
}

export async function updatePatientBasic(patientId, { fullName, phone }) {
  await pool.query("UPDATE users SET full_name = ?, phone = ? WHERE id = ?", [fullName, phone, patientId]);
}
