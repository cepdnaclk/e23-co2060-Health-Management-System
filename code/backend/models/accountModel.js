import { pool } from "../config/db.js";

const USER_COLUMNS =
  "id, role, username, patient_uid, email, password_hash, full_name, phone, profile_photo_url, role_profile";
const USER_PUBLIC_COLUMNS = "id, role, username, patient_uid, full_name, email, phone, profile_photo_url, role_profile";

function normalizeRole(role) {
  return String(role || "patient").trim().toLowerCase() || "patient";
}

function parseRoleProfile(value) {
  if (!value) return {};
  if (typeof value === "object") return value;
  try {
    return JSON.parse(value);
  } catch {
    return {};
  }
}

export function normalizeUserRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    role: normalizeRole(row.role),
    username: row.username || null,
    patient_uid: row.patient_uid || null,
    email: row.email,
    password_hash: row.password_hash || "",
    full_name: row.full_name,
    phone: row.phone || "",
    profile_photo_url: row.profile_photo_url || null,
    role_profile: parseRoleProfile(row.role_profile)
  };
}

export function normalizePublicUserRow(row) {
  const user = normalizeUserRow(row);
  if (!user) return null;
  return {
    id: user.id,
    role: user.role,
    username: user.username,
    patient_uid: user.patient_uid,
    email: user.email,
    full_name: user.full_name,
    phone: user.phone,
    profile_photo_url: user.profile_photo_url,
    role_profile: user.role_profile
  };
}

async function findUser(whereSql, params) {
  const [rows] = await pool.query(`SELECT ${USER_COLUMNS} FROM users ${whereSql} LIMIT 1`, params);
  return normalizeUserRow(rows[0] || null);
}

export async function findUserById(id, role = null) {
  if (role) return findUser("WHERE id = ? AND role = ?", [id, normalizeRole(role)]);
  return findUser("WHERE id = ?", [id]);
}

export async function findUserByEmail(email, role = null) {
  if (role) return findUser("WHERE email = ? AND role = ?", [email, normalizeRole(role)]);
  return findUser("WHERE email = ?", [email]);
}

export async function findUserByUsername(username, role = null) {
  if (role) return findUser("WHERE username = ? AND role = ?", [username, normalizeRole(role)]);
  return findUser("WHERE username = ?", [username]);
}

export async function findUserByLoginIdentifier(identifier, role = null) {
  const value = String(identifier || "").trim();
  const patientUid = value.toUpperCase();
  if (role) {
    return findUser(
      "WHERE (email = ? OR username = ? OR patient_uid = ?) AND role = ?",
      [value.toLowerCase(), value.toLowerCase(), patientUid, normalizeRole(role)]
    );
  }
  return findUser("WHERE email = ? OR username = ? OR patient_uid = ?", [value.toLowerCase(), value.toLowerCase(), patientUid]);
}

export async function findUsersByRole(role, limit = 1000) {
  const [rows] = await pool.query(
    `SELECT ${USER_PUBLIC_COLUMNS} FROM users WHERE role = ? ORDER BY created_at DESC LIMIT ?`,
    [normalizeRole(role), limit]
  );
  return rows.map(normalizePublicUserRow);
}

export async function createPatientAccount({ fullName, email, phone, passwordHash, profilePhotoUrl }) {
  const [result] = await pool.query(
    "INSERT INTO users (role, full_name, email, phone, profile_photo_url, password_hash) VALUES (?, ?, ?, ?, ?, ?)",
    ["patient", fullName, email, phone || "", profilePhotoUrl || null, passwordHash]
  );
  return findUserById(result.insertId, "patient");
}

export async function createRoleAccount({ role, username, fullName, email, phone, passwordHash, profilePhotoUrl, roleProfile }) {
  const [result] = await pool.query(
    "INSERT INTO users (role, username, full_name, email, phone, profile_photo_url, password_hash, role_profile) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
    [normalizeRole(role), username || null, fullName, email, phone || "", profilePhotoUrl || null, passwordHash, JSON.stringify(roleProfile || {})]
  );
  return findUserById(result.insertId, role);
}

export async function updateUserAccount(id, { fullName, phone, profilePhotoUrl }) {
  await pool.query("UPDATE users SET full_name = ?, phone = ?, profile_photo_url = ? WHERE id = ?", [
    fullName,
    phone,
    profilePhotoUrl,
    id
  ]);
}

export async function updateUserPassword(id, passwordHash) {
  await pool.query("UPDATE users SET password_hash = ? WHERE id = ?", [passwordHash, id]);
}

export async function updateRoleAccount(id, { fullName, username, email, phone, profilePhotoUrl, passwordHash, roleProfile }) {
  await pool.query(
    "UPDATE users SET full_name = ?, username = ?, email = ?, phone = ?, profile_photo_url = ?, password_hash = ?, role_profile = ? WHERE id = ?",
    [fullName, username || null, email, phone || "", profilePhotoUrl || null, passwordHash, JSON.stringify(roleProfile || {}), id]
  );
}

export function formatRoleSessionUser(user) {
  if (!user) return null;
  return {
    id: user.id,
    role: user.role,
    username: user.username,
    patientUid: user.patient_uid,
    fullName: user.full_name,
    email: user.email,
    phone: user.phone,
    profilePhotoUrl: user.profile_photo_url,
    ...user.role_profile
  };
}