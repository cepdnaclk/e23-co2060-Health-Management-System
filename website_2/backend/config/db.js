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
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      CONSTRAINT fk_patient_profiles_user
        FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE CASCADE
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS appointments (
      id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
      patient_id BIGINT UNSIGNED NOT NULL,
      doctor_username VARCHAR(64) NOT NULL,
      scheduled_at DATETIME NOT NULL,
      status VARCHAR(32) NOT NULL DEFAULT 'Confirmed',
      reason VARCHAR(255) NULL,
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
}

async function seedDefaultPatient() {
  const passwordHash = await bcrypt.hash(DEFAULT_PATIENT_PASSWORD, 10);
  const [existing] = await pool.query("SELECT id FROM users WHERE email = ? LIMIT 1", [DEFAULT_PATIENT_LOGIN]);

  if (existing.length) {
    await pool.query("UPDATE users SET full_name = ?, phone = ?, password_hash = ? WHERE id = ?", [
      "Patient One",
      "0000000000",
      passwordHash,
      existing[0].id
    ]);
    return;
  }

  await pool.query("INSERT INTO users (full_name, email, phone, password_hash) VALUES (?, ?, ?, ?)", [
    "Patient One",
    DEFAULT_PATIENT_LOGIN,
    "0000000000",
    passwordHash
  ]);
}
