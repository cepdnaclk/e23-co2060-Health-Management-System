import mysql from "mysql2/promise";
import bcrypt from "bcryptjs";
import { DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME, DEFAULT_PATIENT_LOGIN, DEFAULT_PATIENT_PASSWORD } from "./env.js";
import { initLocalDb, localQuery } from "./localDb.js";

const mysqlPool = mysql.createPool({
  host: DB_HOST,
  port: DB_PORT,
  user: DB_USER,
  password: DB_PASSWORD,
  database: DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

let activeDb = "mysql";

function makePatientUid(id) {
  return `PT-${String(id).padStart(6, "0")}`;
}

function demoAvatarDataUri(label, background, foreground = "#ffffff") {
  const initials = String(label || "PT").slice(0, 2).toUpperCase();
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 160 160">
      <rect width="160" height="160" rx="42" fill="${background}"/>
      <circle cx="80" cy="62" r="28" fill="${foreground}" opacity="0.88"/>
      <path d="M36 142c6-31 25-47 44-47s38 16 44 47" fill="${foreground}" opacity="0.88"/>
      <text x="80" y="90" text-anchor="middle" font-family="Arial, sans-serif" font-size="32" font-weight="800" fill="${background}">${initials}</text>
    </svg>
  `.replace(/\s+/g, " ").trim();
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function canUseLocalDb(error) {
  return ["ECONNREFUSED", "ER_ACCESS_DENIED_ERROR", "ENOTFOUND", "ETIMEDOUT"].includes(error?.code);
}

export function getDbMode() {
  return activeDb;
}

export const pool = {
  async query(sql, params) {
    if (activeDb === "local") {
      return localQuery(sql, params);
    }

    try {
      return await mysqlPool.query(sql, params);
    } catch (error) {
      if (!canUseLocalDb(error)) throw error;
      activeDb = "local";
      await initLocalDb();
      return localQuery(sql, params);
    }
  }
};

export async function initDb() {
  try {
    const conn = await mysql.createConnection({
      host: DB_HOST,
      port: DB_PORT,
      user: DB_USER,
      password: DB_PASSWORD
    });
    await conn.query(`CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\``);
    await conn.end();
    activeDb = "mysql";
  } catch (error) {
    if (!canUseLocalDb(error)) throw error;
    activeDb = "local";
    await initLocalDb();
  }

  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
      username VARCHAR(64) NULL UNIQUE,
      patient_uid VARCHAR(24) NULL UNIQUE,
      full_name VARCHAR(120) NOT NULL,
      email VARCHAR(190) NOT NULL UNIQUE,
      phone VARCHAR(40) NOT NULL,
      profile_photo_url MEDIUMTEXT NULL,
      password_hash VARCHAR(255) NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  try {
    await pool.query("ALTER TABLE users ADD COLUMN profile_photo_url MEDIUMTEXT NULL");
  } catch (error) {
    if (error?.code !== "ER_DUP_FIELDNAME") throw error;
  }

  for (const statement of [
    "ALTER TABLE users ADD COLUMN username VARCHAR(64) NULL",
    "ALTER TABLE users ADD COLUMN patient_uid VARCHAR(24) NULL"
  ]) {
    try {
      await pool.query(statement);
    } catch (error) {
      if (error?.code !== "ER_DUP_FIELDNAME") throw error;
    }
  }

  for (const statement of [
    "ALTER TABLE users ADD UNIQUE INDEX idx_users_username (username)",
    "ALTER TABLE users ADD UNIQUE INDEX idx_users_patient_uid (patient_uid)"
  ]) {
    try {
      await pool.query(statement);
    } catch (error) {
      if (!["ER_DUP_KEYNAME", "ER_DUP_FIELDNAME"].includes(error?.code)) throw error;
    }
  }

  await pool.query(`
    CREATE TABLE IF NOT EXISTS patient_profiles (
      id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
      user_id BIGINT UNSIGNED NOT NULL UNIQUE,
      dob DATE NULL,
      gender VARCHAR(30) NULL,
      address TEXT NULL,
      emergency_contact VARCHAR(120) NULL,
      blood_group VARCHAR(10) NULL,
      allergies TEXT NULL,
      known_conditions TEXT NULL,
      mother_patient_uid VARCHAR(24) NULL,
      father_patient_uid VARCHAR(24) NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      CONSTRAINT fk_patient_profiles_user
        FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE CASCADE
    )
  `);

  for (const statement of [
    "ALTER TABLE patient_profiles ADD COLUMN known_conditions TEXT NULL",
    "ALTER TABLE patient_profiles ADD COLUMN mother_patient_uid VARCHAR(24) NULL",
    "ALTER TABLE patient_profiles ADD COLUMN father_patient_uid VARCHAR(24) NULL"
  ]) {
    try {
      await pool.query(statement);
    } catch (error) {
      if (error?.code !== "ER_DUP_FIELDNAME") throw error;
    }
  }

  await pool.query(`
    CREATE TABLE IF NOT EXISTS appointments (
      id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
      patient_id BIGINT UNSIGNED NOT NULL,
      doctor_username VARCHAR(64) NOT NULL,
      scheduled_at DATETIME NOT NULL,
      status VARCHAR(32) NOT NULL DEFAULT 'Confirmed',
      reason VARCHAR(255) NULL,
      payment_status VARCHAR(32) NOT NULL DEFAULT 'Unpaid',
      payment_amount DECIMAL(10,2) NOT NULL DEFAULT 2500.00,
      payment_currency VARCHAR(8) NOT NULL DEFAULT 'LKR',
      payment_reference VARCHAR(80) NULL,
      paid_at DATETIME NULL,
      created_by VARCHAR(64) NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      CONSTRAINT fk_appointments_patient
        FOREIGN KEY (patient_id) REFERENCES users(id)
        ON DELETE CASCADE,
      INDEX idx_appointments_doctor_time (doctor_username, scheduled_at),
      INDEX idx_appointments_time (scheduled_at),
      INDEX idx_appointments_patient (patient_id)
    )
  `);

  for (const statement of [
    "ALTER TABLE appointments ADD COLUMN payment_status VARCHAR(32) NOT NULL DEFAULT 'Unpaid'",
    "ALTER TABLE appointments ADD COLUMN payment_amount DECIMAL(10,2) NOT NULL DEFAULT 2500.00",
    "ALTER TABLE appointments ADD COLUMN payment_currency VARCHAR(8) NOT NULL DEFAULT 'LKR'",
    "ALTER TABLE appointments ADD COLUMN payment_reference VARCHAR(80) NULL",
    "ALTER TABLE appointments ADD COLUMN paid_at DATETIME NULL"
  ]) {
    try {
      await pool.query(statement);
    } catch (error) {
      if (error?.code !== "ER_DUP_FIELDNAME") throw error;
    }
  }

  await pool.query(`
    CREATE TABLE IF NOT EXISTS patient_reports (
      id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
      patient_id BIGINT UNSIGNED NOT NULL,
      file_name VARCHAR(255) NOT NULL,
      mime_type VARCHAR(80) NOT NULL,
      report_data MEDIUMTEXT NOT NULL,
      uploaded_by VARCHAR(64) NOT NULL,
      uploaded_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_reports_patient
        FOREIGN KEY (patient_id) REFERENCES users(id)
        ON DELETE CASCADE,
      INDEX idx_reports_patient_time (patient_id, uploaded_at)
    )
  `);

  await seedDefaultPatient();
  await seedDemoFamily();
  await ensurePatientIds();
}

async function seedDefaultPatient() {
  const passwordHash = await bcrypt.hash(DEFAULT_PATIENT_PASSWORD, 10);
  const [existing] = await pool.query("SELECT id FROM users WHERE email = ? LIMIT 1", [DEFAULT_PATIENT_LOGIN]);

  if (existing.length) {
    await pool.query("UPDATE users SET full_name = ?, phone = ?, patient_uid = ?, password_hash = ? WHERE id = ?", [
      "Patient One",
      "0000000000",
      makePatientUid(existing[0].id),
      passwordHash,
      existing[0].id
    ]);
    return;
  }

  const [created] = await pool.query("INSERT INTO users (full_name, email, phone, password_hash) VALUES (?, ?, ?, ?)", [
    "Patient One",
    DEFAULT_PATIENT_LOGIN,
    "0000000000",
    passwordHash
  ]);
  await pool.query("UPDATE users SET patient_uid = ? WHERE id = ?", [makePatientUid(created.insertId), created.insertId]);
}

async function seedDemoFamily() {
  const passwordHash = await bcrypt.hash("1234", 10);

  await seedDemoPatient({
    username: "dad",
    patientUid: "PT-DEMO-DAD",
    fullName: "Demo Dad",
    email: "dad@demo.local",
    phone: "0700000001",
    passwordHash,
    profilePhotoUrl: demoAvatarDataUri("DD", "#0a4b84"),
    knownConditions: "Type 2 Diabetes"
  });

  await seedDemoPatient({
    username: "mom",
    patientUid: "PT-DEMO-MOM",
    fullName: "Demo Mom",
    email: "mom@demo.local",
    phone: "0700000002",
    passwordHash,
    profilePhotoUrl: demoAvatarDataUri("MM", "#ef4b67"),
    knownConditions: "Familial Hypercholesterolemia"
  });

  await seedDemoPatient({
    username: "son",
    patientUid: "PT-DEMO-SON",
    fullName: "Demo Son",
    email: "son@demo.local",
    phone: "0700000003",
    passwordHash,
    profilePhotoUrl: demoAvatarDataUri("DS", "#087f8c"),
    knownConditions: null,
    motherPatientUid: "PT-DEMO-MOM",
    fatherPatientUid: "PT-DEMO-DAD"
  });
}

async function seedDemoPatient({
  username,
  patientUid,
  fullName,
  email,
  phone,
  passwordHash,
  profilePhotoUrl,
  knownConditions,
  motherPatientUid = null,
  fatherPatientUid = null
}) {
  const [existing] = await pool.query("SELECT id FROM users WHERE username = ? OR email = ? OR patient_uid = ? LIMIT 1", [
    username,
    email,
    patientUid
  ]);

  let userId = existing[0]?.id;
  if (userId) {
    await pool.query(
      "UPDATE users SET full_name = ?, username = ?, email = ?, phone = ?, profile_photo_url = ?, patient_uid = ?, password_hash = ? WHERE id = ?",
      [fullName, username, email, phone, profilePhotoUrl, patientUid, passwordHash, userId]
    );
  } else {
    const [created] = await pool.query(
      "INSERT INTO users (full_name, username, email, phone, profile_photo_url, patient_uid, password_hash) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [fullName, username, email, phone, profilePhotoUrl, patientUid, passwordHash]
    );
    userId = created.insertId;
  }

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
        known_conditions = VALUES(known_conditions),
        mother_patient_uid = VALUES(mother_patient_uid),
        father_patient_uid = VALUES(father_patient_uid)
    `,
    [userId, null, null, null, null, null, null, knownConditions, motherPatientUid, fatherPatientUid]
  );
}

async function ensurePatientIds() {
  const [missing] = await pool.query("SELECT id FROM users WHERE patient_uid IS NULL OR patient_uid = '' ORDER BY id ASC");
  for (const row of missing) {
    await pool.query("UPDATE users SET patient_uid = ? WHERE id = ?", [makePatientUid(row.id), row.id]);
  }
}
