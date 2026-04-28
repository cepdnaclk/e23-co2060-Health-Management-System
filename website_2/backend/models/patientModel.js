import { pool } from "../config/db.js";
import { mapPatientRecord } from "./profileModel.js";

export async function findUserByEmail(email) {
  const [rows] = await pool.query("SELECT id, email, password_hash, full_name, phone, profile_photo_url FROM users WHERE email = ? LIMIT 1", [
    email
  ]);
  return rows[0] || null;
}

export async function createUser({ fullName, email, phone, passwordHash }) {
  const [result] = await pool.query("INSERT INTO users (full_name, email, phone, password_hash) VALUES (?, ?, ?, ?)", [
    fullName,
    email,
    phone,
    passwordHash
  ]);
  const [rows] = await pool.query("SELECT id, full_name, email, phone, profile_photo_url FROM users WHERE id = ? LIMIT 1", [
    result.insertId
  ]);
  return rows[0] || null;
}

export async function findUserById(id) {
  const [rows] = await pool.query("SELECT id, full_name, email, phone, profile_photo_url FROM users WHERE id = ? LIMIT 1", [id]);
  return rows[0] || null;
}

export async function findUserWithProfileById(id) {
  const [rows] = await pool.query(
    `
      SELECT
        u.id,
        u.full_name,
        u.email,
        u.phone,
        u.profile_photo_url,
        p.dob,
        p.gender,
        p.address,
        p.emergency_contact,
        p.blood_group,
        p.allergies
      FROM users u
      LEFT JOIN patient_profiles p ON p.user_id = u.id
      WHERE u.id = ?
      LIMIT 1
    `,
    [id]
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
      INSERT INTO patient_profiles (user_id, dob, gender, address, emergency_contact, blood_group, allergies)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        dob = VALUES(dob),
        gender = VALUES(gender),
        address = VALUES(address),
        emergency_contact = VALUES(emergency_contact),
        blood_group = VALUES(blood_group),
        allergies = VALUES(allergies)
    `,
    [userId, profile.dob, profile.gender, profile.address, profile.emergencyContact, profile.bloodGroup, profile.allergies]
  );
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
      SELECT id, full_name, email
      FROM users
      ORDER BY full_name ASC
      LIMIT ?
    `,
    [limit]
  );
  return rows.map((row) => ({
    id: row.id,
    fullName: row.full_name,
    email: row.email
  }));
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
