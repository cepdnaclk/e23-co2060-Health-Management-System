import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.resolve(__dirname, "..", ".dev-data");
const DATA_FILE = path.join(DATA_DIR, "local-db.json");

const initialData = {
  nextIds: {
    users: 1,
    patient_profiles: 1,
    appointments: 1,
    patient_reports: 1
  },
  users: [],
  patient_profiles: [],
  appointments: [],
  patient_reports: []
};

let initialized = false;
let writeQueue = Promise.resolve();

function now() {
  return new Date().toISOString();
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function normalizeSql(sql) {
  return String(sql).replace(/\s+/g, " ").trim().toLowerCase();
}

async function readData() {
  await initLocalDb();
  const raw = await fs.readFile(DATA_FILE, "utf8");
  return JSON.parse(raw);
}

async function writeData(data) {
  writeQueue = writeQueue.then(async () => {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.writeFile(DATA_FILE, `${JSON.stringify(data, null, 2)}\n`, "utf8");
  });
  await writeQueue;
}

function userPublicRow(user) {
  if (!user) return null;
  return {
    id: user.id,
    full_name: user.full_name,
    email: user.email,
    phone: user.phone,
    profile_photo_url: user.profile_photo_url || null
  };
}

function userAuthRow(user) {
  if (!user) return null;
  return {
    ...userPublicRow(user),
    password_hash: user.password_hash
  };
}

function userWithProfileRow(data, user) {
  if (!user) return null;
  const profile = data.patient_profiles.find((item) => item.user_id === user.id) || {};
  return {
    ...userPublicRow(user),
    dob: profile.dob || null,
    gender: profile.gender || null,
    address: profile.address || null,
    emergency_contact: profile.emergency_contact || null,
    blood_group: profile.blood_group || null,
    allergies: profile.allergies || null
  };
}

function appointmentView(data, appointment) {
  const user = data.users.find((item) => item.id === appointment.patient_id);
  const profile = data.patient_profiles.find((item) => item.user_id === appointment.patient_id) || {};
  return {
    id: appointment.id,
    patient_id: appointment.patient_id,
    doctor_username: appointment.doctor_username,
    scheduled_at: appointment.scheduled_at,
    status: appointment.status,
    reason: appointment.reason,
    full_name: user?.full_name || "Unknown patient",
    blood_group: profile.blood_group || null,
    allergies: profile.allergies || null
  };
}

export async function initLocalDb() {
  if (initialized) return;
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    await fs.access(DATA_FILE);
  } catch {
    await fs.writeFile(DATA_FILE, `${JSON.stringify(initialData, null, 2)}\n`, "utf8");
  }
  initialized = true;
}

export async function localQuery(sql, params = []) {
  const normalized = normalizeSql(sql);
  const data = await readData();

  if (normalized === "select 1") {
    return [[{ "1": 1 }]];
  }

  if (normalized.startsWith("insert into users")) {
    const [fullName, email, phone, passwordHash] = params;
    if (data.users.some((user) => user.email === email)) {
      const error = new Error("Duplicate email");
      error.code = "ER_DUP_ENTRY";
      throw error;
    }
    const id = data.nextIds.users++;
    data.users.push({
      id,
      full_name: fullName,
      email,
      phone,
      profile_photo_url: null,
      password_hash: passwordHash,
      created_at: now()
    });
    await writeData(data);
    return [{ insertId: id, affectedRows: 1 }];
  }

  if (normalized.includes("from users where email = ?")) {
    const [email] = params;
    return [[userAuthRow(data.users.find((user) => user.email === email))].filter(Boolean)];
  }

  if (normalized.includes("left join patient_profiles") && normalized.includes("where u.id = ?")) {
    const [id] = params.map(Number);
    return [[userWithProfileRow(data, data.users.find((user) => user.id === id))].filter(Boolean)];
  }

  if (normalized.includes("from users where id = ? limit 1")) {
    const [id] = params.map(Number);
    const user = data.users.find((item) => item.id === id);
    const row = normalized.startsWith("select id from users") ? (user ? { id: user.id } : null) : userPublicRow(user);
    return [[row].filter(Boolean)];
  }

  if (normalized.startsWith("update users set full_name = ?, phone = ?, profile_photo_url = ?")) {
    const [fullName, phone, profilePhotoUrl, id] = params;
    const user = data.users.find((item) => item.id === Number(id));
    if (!user) return [{ affectedRows: 0 }];
    user.full_name = fullName;
    user.phone = phone;
    user.profile_photo_url = profilePhotoUrl || null;
    await writeData(data);
    return [{ affectedRows: 1 }];
  }

  if (normalized.startsWith("update users set full_name = ?, phone = ?, password_hash = ?")) {
    const [fullName, phone, passwordHash, id] = params;
    const user = data.users.find((item) => item.id === Number(id));
    if (!user) return [{ affectedRows: 0 }];
    user.full_name = fullName;
    user.phone = phone;
    user.password_hash = passwordHash;
    await writeData(data);
    return [{ affectedRows: 1 }];
  }

  if (normalized.startsWith("update users set full_name = ?, phone = ?")) {
    const [fullName, phone, id] = params;
    const user = data.users.find((item) => item.id === Number(id));
    if (!user) return [{ affectedRows: 0 }];
    user.full_name = fullName;
    user.phone = phone;
    await writeData(data);
    return [{ affectedRows: 1 }];
  }

  if (normalized.startsWith("insert into patient_profiles")) {
    const [userId, dob, gender, address, emergencyContact, bloodGroup, allergies] = params;
    let profile = data.patient_profiles.find((item) => item.user_id === Number(userId));
    if (!profile) {
      profile = { id: data.nextIds.patient_profiles++, user_id: Number(userId), created_at: now() };
      data.patient_profiles.push(profile);
    }
    Object.assign(profile, {
      dob: dob || null,
      gender: gender || null,
      address: address || null,
      emergency_contact: emergencyContact || null,
      blood_group: bloodGroup || null,
      allergies: allergies || null,
      updated_at: now()
    });
    await writeData(data);
    return [{ insertId: profile.id, affectedRows: 1 }];
  }

  if (normalized.includes("from users u left join patient_profiles") && normalized.includes("order by u.created_at desc")) {
    const [limit] = params.map(Number);
    const rows = [...data.users]
      .sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)))
      .slice(0, limit)
      .map((user) => {
        const profile = data.patient_profiles.find((item) => item.user_id === user.id) || {};
        return {
          id: user.id,
          full_name: user.full_name,
          blood_group: profile.blood_group || null,
          allergies: profile.allergies || null
        };
      });
    return [rows];
  }

  if (normalized.includes("select id, full_name, email from users")) {
    const [limit] = params.map(Number);
    return [[...data.users].sort((a, b) => a.full_name.localeCompare(b.full_name)).slice(0, limit).map(userPublicRow)];
  }

  if (normalized.startsWith("insert into appointments")) {
    const [patientId, doctorUsername, scheduledAt, reason, createdBy] = params;
    const id = data.nextIds.appointments++;
    data.appointments.push({
      id,
      patient_id: Number(patientId),
      doctor_username: doctorUsername,
      scheduled_at: scheduledAt,
      status: "Confirmed",
      reason,
      created_by: createdBy,
      created_at: now(),
      updated_at: now()
    });
    await writeData(data);
    return [{ insertId: id, affectedRows: 1 }];
  }

  if (normalized.startsWith("update appointments set status = 'cancelled'")) {
    const [appointmentId] = params.map(Number);
    const appointment = data.appointments.find((item) => item.id === appointmentId && item.status === "Confirmed");
    if (!appointment) return [{ affectedRows: 0 }];
    appointment.status = "Cancelled";
    appointment.updated_at = now();
    await writeData(data);
    return [{ affectedRows: 1 }];
  }

  if (normalized.startsWith("update appointments set status = 'completed'")) {
    const [appointmentId, doctorUsername] = params;
    const appointment = data.appointments.find(
      (item) => item.id === Number(appointmentId) && item.doctor_username === doctorUsername && item.status === "Confirmed"
    );
    if (!appointment) return [{ affectedRows: 0 }];
    appointment.status = "Completed";
    appointment.updated_at = now();
    await writeData(data);
    return [{ affectedRows: 1 }];
  }

  if (normalized.includes("from appointments a inner join users")) {
    const [startIso, endIso, doctorUsername] = params;
    const rows = data.appointments
      .filter((item) => item.scheduled_at >= startIso && item.scheduled_at < endIso)
      .filter((item) => item.status === "Confirmed")
      .filter((item) => !doctorUsername || item.doctor_username === doctorUsername)
      .sort((a, b) => a.scheduled_at.localeCompare(b.scheduled_at))
      .map((item) => appointmentView(data, item));
    return [rows];
  }

  if (normalized.includes("from appointments a where a.patient_id = ?")) {
    const [patientId, limit] = params.map(Number);
    const rows = data.appointments
      .filter((item) => item.patient_id === patientId)
      .sort((a, b) => String(b.scheduled_at).localeCompare(String(a.scheduled_at)))
      .slice(0, limit)
      .map((item) => ({
        id: item.id,
        patient_id: item.patient_id,
        doctor_username: item.doctor_username,
        scheduled_at: item.scheduled_at,
        status: item.status,
        reason: item.reason
      }));
    return [rows];
  }

  if (normalized.startsWith("insert into patient_reports")) {
    const [patientId, fileName, mimeType, reportData, uploadedBy] = params;
    const id = data.nextIds.patient_reports++;
    data.patient_reports.push({
      id,
      patient_id: Number(patientId),
      file_name: fileName,
      mime_type: mimeType,
      report_data: reportData,
      uploaded_by: uploadedBy,
      uploaded_at: now()
    });
    await writeData(data);
    return [{ insertId: id, affectedRows: 1 }];
  }

  if (normalized.includes("from patient_reports where patient_id = ?")) {
    const [patientId, limit] = params.map(Number);
    const includeData = normalized.includes("report_data");
    const rows = data.patient_reports
      .filter((item) => item.patient_id === patientId)
      .sort((a, b) => String(b.uploaded_at).localeCompare(String(a.uploaded_at)))
      .slice(0, limit)
      .map((item) => {
        const row = clone(item);
        if (!includeData) delete row.report_data;
        return row;
      });
    return [rows];
  }

  if (
    normalized.startsWith("create table") ||
    normalized.startsWith("create database") ||
    normalized.startsWith("alter table")
  ) {
    return [{ affectedRows: 0 }];
  }

  throw new Error(`Local development database does not support query: ${String(sql).slice(0, 120)}`);
}
