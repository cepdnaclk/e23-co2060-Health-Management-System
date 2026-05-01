CREATE DATABASE IF NOT EXISTS patient_portal;
USE patient_portal;

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
);

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
);

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
);

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
);
