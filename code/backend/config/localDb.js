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
    patient_reports: 1,
    patient_diagnosis_logs: 1
  },
  users: [],
  patient_profiles: [],
  appointments: [],
  patient_reports: [],
  patient_diagnosis_logs: []
};

let initialized = false;
let writeQueue = Promise.resolve();

function now() {
  return new Date().toISOString();
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function makePatientUid(id) {
  return `PT-${String(id).padStart(6, "0")}`;
}

function normalizeSql(sql) {
  return String(sql).replace(/\s+/g, " ").trim().toLowerCase();
}

function migrateDataShape(data) {
  let changed = false;
  data.nextIds = { ...initialData.nextIds, ...(data.nextIds || {}) };
  for (const key of ["users", "patient_profiles", "appointments", "patient_reports", "patient_diagnosis_logs"]) {
    if (!Array.isArray(data[key])) {
      data[key] = [];
      changed = true;
    }
  }

  for (const user of data.users) {
    if (!Object.prototype.hasOwnProperty.call(user, "role")) {
      user.role = "patient";
      changed = true;
    }
    if (!Object.prototype.hasOwnProperty.call(user, "username")) {
      user.username = null;
      changed = true;
    }
    if (!user.patient_uid) {
      user.patient_uid = makePatientUid(user.id);
      changed = true;
    }
    if (!Object.prototype.hasOwnProperty.call(user, "profile_photo_url")) {
      user.profile_photo_url = null;
      changed = true;
    }
    if (!Object.prototype.hasOwnProperty.call(user, "role_profile")) {
      user.role_profile = null;
      changed = true;
    }
  }

  for (const profile of data.patient_profiles) {
    for (const key of ["known_conditions", "mother_patient_uid", "father_patient_uid", "weight", "height", "dietary_preference", "activity_level"]) {
      if (!Object.prototype.hasOwnProperty.call(profile, key)) {
        profile[key] = null;
        changed = true;
      }
    }
  }

  return { data, changed };
}

async function readData() {
  await initLocalDb();
  const raw = await fs.readFile(DATA_FILE, "utf8");
  const migrated = migrateDataShape(JSON.parse(raw));
  if (migrated.changed) await writeData(migrated.data);
  return migrated.data;
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
    role: user.role || "patient",
    username: user.username || null,
    patient_uid: user.role === "patient" ? user.patient_uid || makePatientUid(user.id) : user.patient_uid || null,
    full_name: user.full_name,
    email: user.email,
    phone: user.phone,
    profile_photo_url: user.profile_photo_url || null,
    role_profile: user.role_profile || null
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
    allergies: profile.allergies || null,
    known_conditions: profile.known_conditions || null,
    mother_patient_uid: profile.mother_patient_uid || null,
    father_patient_uid: profile.father_patient_uid || null,
    weight: profile.weight || null,
    height: profile.height || null,
    dietary_preference: profile.dietary_preference || null,
    activity_level: profile.activity_level || null
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
    payment_status: appointment.payment_status || "Unpaid",
    payment_amount: appointment.payment_amount ?? 2500,
    payment_currency: appointment.payment_currency || "LKR",
    payment_reference: appointment.payment_reference || null,
    paid_at: appointment.paid_at || null,
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
    const withRoleColumns = params.length === 8;
    const withSeedColumns = params.length === 7;
    const [role, username, fullName, email, phone, profilePhotoUrl, passwordHash, roleProfile] = withRoleColumns
      ? params
      : withSeedColumns
        ? ["patient", params[0], params[1], params[2], params[3], params[4], params[5], params[6]]
        : params.length === 6
          ? [params[0], null, params[1], params[2], params[3], params[4], params[5], null]
          : ["patient", params[0], null, params[1], params[2], null, null, params[3]];
    const patientUid = withSeedColumns ? params[5] : role === "patient" ? makePatientUid(data.nextIds.users) : null;
    if (
      data.users.some(
        (user) =>
          user.email === email ||
          (username && user.username === username) ||
          (patientUid && String(user.patient_uid || "").toUpperCase() === String(patientUid).toUpperCase())
      )
    ) {
      const error = new Error("Duplicate email");
      error.code = "ER_DUP_ENTRY";
      throw error;
    }
    const id = data.nextIds.users++;
    data.users.push({
      id,
      role: role || "patient",
      username: username || null,
      patient_uid: patientUid || null,
      full_name: fullName,
      email,
      phone,
      profile_photo_url: profilePhotoUrl || null,
      role_profile: withRoleColumns ? roleProfile : null,
      password_hash: passwordHash,
      created_at: now()
    });
    await writeData(data);
    return [{ insertId: id, affectedRows: 1 }];
  }

  if (normalized.includes("from users where email = ? and role = ?")) {
    const [email, role] = params;
    return [[userAuthRow(data.users.find((user) => user.email === email && user.role === role))].filter(Boolean)];
  }

  if (normalized.includes("from users where username = ? and role = ?")) {
    const [username, role] = params;
    return [[userAuthRow(data.users.find((user) => user.username === username && user.role === role))].filter(Boolean)];
  }

  if (normalized.includes("from users where (email = ? or username = ? or patient_uid = ?) and role = ?")) {
    const [email, username, patientUid, role] = params;
    const normalizedPatientUid = String(patientUid || "").toUpperCase();
    return [[
      userAuthRow(
        data.users.find(
          (user) =>
            user.role === role &&
            (user.email === email || (username && user.username === username) || String(user.patient_uid || "").toUpperCase() === normalizedPatientUid)
        )
      )
    ].filter(Boolean)];
  }

  if (normalized.includes("from users where role = ? order by created_at desc limit ?")) {
    const [role, limit] = params;
    const rows = [...data.users]
      .filter((user) => user.role === role)
      .sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)))
      .slice(0, Number(limit))
      .map(userPublicRow);
    return [rows];
  }

  if (normalized.includes("where email = ? or username = ? or patient_uid = ?")) {
    const [email, username, patientUid] = params;
    const normalizedPatientUid = String(patientUid || "").toUpperCase();
    return [
      [
        userAuthRow(
          data.users.find(
            (user) =>
              user.email === email ||
              (username && user.username === username) ||
              String(user.patient_uid || "").toUpperCase() === normalizedPatientUid
          )
        )
      ].filter(Boolean)
    ];
  }

  if (normalized.includes("where username = ? or email = ? or patient_uid = ?")) {
    const [username, email, patientUid] = params;
    const normalizedPatientUid = String(patientUid || "").toUpperCase();
    return [
      [
        data.users.find(
          (user) =>
            (username && user.username === username) ||
            user.email === email ||
            String(user.patient_uid || "").toUpperCase() === normalizedPatientUid
        )
      ]
        .filter(Boolean)
        .map((user) => ({ id: user.id }))
    ];
  }

  if (normalized.includes("from users where email = ?")) {
    const [email] = params;
    return [[userAuthRow(data.users.find((user) => user.email === email))].filter(Boolean)];
  }

  if (normalized.includes("from users where id = ? and role = ?")) {
    const [id, role] = params;
    const user = data.users.find((item) => item.id === Number(id) && item.role === role);
    return [[userPublicRow(user)].filter(Boolean)];
  }

  if (normalized.includes("from users where patient_uid = ? and role = ?")) {
    const [patientUid, role] = params;
    const user = data.users.find(
      (item) => String(item.patient_uid || "").toUpperCase() === String(patientUid || "").toUpperCase() && item.role === role
    );
    return [[userPublicRow(user)].filter(Boolean)];
  }

  if (normalized.includes("left join patient_profiles") && normalized.includes("where u.id = ?")) {
    const [id] = params.map(Number);
    return [[userWithProfileRow(data, data.users.find((user) => user.id === id))].filter(Boolean)];
  }

  if (normalized.includes("where u.patient_uid = ?")) {
    const [patientUid] = params;
    return [
      [
        userWithProfileRow(
          data,
          data.users.find((user) => String(user.patient_uid || "").toUpperCase() === String(patientUid || "").toUpperCase())
        )
      ].filter(Boolean)
    ];
  }

  if (normalized.includes("from users where patient_uid = ? limit 1")) {
    const [patientUid] = params;
    const user = data.users.find((item) => String(item.patient_uid || "").toUpperCase() === String(patientUid || "").toUpperCase());
    return [[userPublicRow(user)].filter(Boolean)];
  }

  if (normalized.includes("from users where id = ? limit 1")) {
    const [id] = params.map(Number);
    const user = data.users.find((item) => item.id === id);
    const row = normalized.startsWith("select id from users") ? (user ? { id: user.id } : null) : userPublicRow(user);
    return [[row].filter(Boolean)];
  }

  if (normalized.startsWith("select id from users where patient_uid is null")) {
    return [
      data.users
        .filter((user) => user.role === "patient" && !user.patient_uid)
        .sort((a, b) => a.id - b.id)
        .map((user) => ({ id: user.id }))
    ];
  }

  if (normalized.startsWith("update users set patient_uid = ?")) {
    const [patientUid, id] = params;
    const user = data.users.find((item) => item.id === Number(id));
    if (!user) return [{ affectedRows: 0 }];
    user.patient_uid = patientUid;
    await writeData(data);
    return [{ affectedRows: 1 }];
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

  if (normalized.startsWith("update users set password_hash = ?")) {
    const [passwordHash, id] = params;
    const user = data.users.find((item) => item.id === Number(id));
    if (!user) return [{ affectedRows: 0 }];
    user.password_hash = passwordHash;
    await writeData(data);
    return [{ affectedRows: 1 }];
  }

  if (normalized.startsWith("update users set full_name = ?, username = ?, email = ?, phone = ?, profile_photo_url = ?, password_hash = ?, role_profile = ?")) {
    const [fullName, username, email, phone, profilePhotoUrl, passwordHash, roleProfile, id] = params;
    const user = data.users.find((item) => item.id === Number(id));
    if (!user) return [{ affectedRows: 0 }];
    Object.assign(user, {
      full_name: fullName,
      username: username || null,
      email,
      phone,
      profile_photo_url: profilePhotoUrl || null,
      password_hash: passwordHash,
      role_profile: roleProfile
    });
    await writeData(data);
    return [{ affectedRows: 1 }];
  }

  if (normalized.startsWith("update users set full_name = ?, phone = ?, patient_uid = ?, password_hash = ?")) {
    const [fullName, phone, patientUid, passwordHash, id] = params;
    const user = data.users.find((item) => item.id === Number(id));
    if (!user) return [{ affectedRows: 0 }];
    user.full_name = fullName;
    user.phone = phone;
    user.patient_uid = patientUid;
    user.password_hash = passwordHash;
    await writeData(data);
    return [{ affectedRows: 1 }];
  }

  if (normalized.startsWith("update users set full_name = ?, username = ?, email = ?, phone = ?, profile_photo_url = ?, patient_uid = ?, password_hash = ?")) {
    const [fullName, username, email, phone, profilePhotoUrl, patientUid, passwordHash, id] = params;
    const user = data.users.find((item) => item.id === Number(id));
    if (!user) return [{ affectedRows: 0 }];
    Object.assign(user, {
      full_name: fullName,
      username: username || null,
      email,
      phone,
      profile_photo_url: profilePhotoUrl || null,
      patient_uid: patientUid,
      password_hash: passwordHash
    });
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
    const [
      userId,
      dob,
      gender,
      address,
      emergencyContact,
      bloodGroup,
      allergies,
      knownConditions,
      motherPatientUid,
      fatherPatientUid,
      weight,
      height,
      dietaryPreference,
      activityLevel
    ] = params;
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
      known_conditions: knownConditions || null,
      mother_patient_uid: motherPatientUid || null,
      father_patient_uid: fatherPatientUid || null,
      weight: weight || null,
      height: height || null,
      dietary_preference: dietaryPreference || null,
      activity_level: activityLevel || null,
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

  if (normalized.includes("select id, patient_uid, full_name, email from users") || normalized.includes("select id, full_name, email from users")) {
    const [limit] = params.map(Number);
    return [[...data.users].filter((user) => user.role === "patient").sort((a, b) => a.full_name.localeCompare(b.full_name)).slice(0, limit).map(userPublicRow)];
  }

  if (normalized.startsWith("insert into appointments")) {
    const hasStatus = params.length === 6;
    const [patientId, doctorUsername, scheduledAt, status, reason, createdBy] = hasStatus
      ? params
      : [params[0], params[1], params[2], "Confirmed", params[3], params[4]];
    const id = data.nextIds.appointments++;
    data.appointments.push({
      id,
      patient_id: Number(patientId),
      doctor_username: doctorUsername,
      scheduled_at: scheduledAt,
      status: status || "Confirmed",
      reason,
      payment_status: "Unpaid",
      payment_amount: 2500,
      payment_currency: "LKR",
      payment_reference: null,
      paid_at: null,
      created_by: createdBy,
      created_at: now(),
      updated_at: now()
    });
    await writeData(data);
    return [{ insertId: id, affectedRows: 1 }];
  }

  if (normalized.startsWith("update appointments set status = 'confirmed'")) {
    const [appointmentId] = params.map(Number);
    const appointment = data.appointments.find((item) => item.id === appointmentId && item.status === "Pending");
    if (!appointment) return [{ affectedRows: 0 }];
    appointment.status = "Confirmed";
    appointment.updated_at = now();
    await writeData(data);
    return [{ affectedRows: 1 }];
  }

  if (normalized.startsWith("update appointments set status = 'cancelled'")) {
    const [appointmentId] = params.map(Number);
    const appointment = data.appointments.find((item) => item.id === appointmentId && ["Pending", "Confirmed"].includes(item.status));
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
    if (normalized.includes("where a.status = 'pending'")) {
      const [limit] = params.map(Number);
      const rows = data.appointments
        .filter((item) => item.status === "Pending")
        .sort((a, b) => a.scheduled_at.localeCompare(b.scheduled_at))
        .slice(0, limit)
        .map((item) => appointmentView(data, item));
      return [rows];
    }

    const [startIso, endIso] = params;
    const doctorUsername = normalized.includes("a.doctor_username = ?") ? params[2] : null;
    const statuses = params.slice(doctorUsername ? 3 : 2).map(String);
    const rows = data.appointments
      .filter((item) => item.scheduled_at >= startIso && item.scheduled_at < endIso)
      .filter((item) => !statuses.length || statuses.includes(item.status))
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
        reason: item.reason,
        payment_status: item.payment_status || "Unpaid",
        payment_amount: item.payment_amount ?? 2500,
        payment_currency: item.payment_currency || "LKR",
        payment_reference: item.payment_reference || null,
        paid_at: item.paid_at || null
      }));
    return [rows];
  }

  if (normalized.includes("from appointments") && normalized.includes("where patient_id = ? and id = ?")) {
    const [patientId, appointmentId] = params.map(Number);
    const appointment = data.appointments.find((item) => item.patient_id === patientId && item.id === appointmentId);
    if (!appointment) return [[]];
    return [[{
      id: appointment.id,
      patient_id: appointment.patient_id,
      doctor_username: appointment.doctor_username,
      scheduled_at: appointment.scheduled_at,
      status: appointment.status,
      reason: appointment.reason,
      payment_status: appointment.payment_status || "Unpaid",
      payment_amount: appointment.payment_amount ?? 2500,
      payment_currency: appointment.payment_currency || "LKR",
      payment_reference: appointment.payment_reference || null,
      paid_at: appointment.paid_at || null
    }]];
  }

  if (normalized.startsWith("update appointments set payment_status = 'paid'")) {
    const [paymentReference, patientId, appointmentId] = params;
    const appointment = data.appointments.find(
      (item) =>
        item.patient_id === Number(patientId) &&
        item.id === Number(appointmentId) &&
        item.status === "Confirmed" &&
        item.payment_status !== "Paid"
    );
    if (!appointment) return [{ affectedRows: 0 }];
    appointment.payment_status = "Paid";
    appointment.payment_reference = paymentReference;
    appointment.paid_at = now();
    appointment.updated_at = now();
    await writeData(data);
    return [{ affectedRows: 1 }];
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

  if (normalized.startsWith("insert into patient_diagnosis_logs")) {
    const [patientId, doctorUsername, visitDate, diagnosis, healthStatus, treatmentNotes, nextSteps] = params;
    const id = data.nextIds.patient_diagnosis_logs++;
    data.patient_diagnosis_logs.push({
      id,
      patient_id: Number(patientId),
      doctor_username: doctorUsername,
      visit_date: visitDate,
      diagnosis,
      health_status: healthStatus,
      treatment_notes: treatmentNotes || null,
      next_steps: nextSteps || null,
      created_at: now()
    });
    await writeData(data);
    return [{ insertId: id, affectedRows: 1 }];
  }

  if (normalized.includes("from patient_diagnosis_logs where patient_id = ?")) {
    const [patientId, limit] = params.map(Number);
    const rows = data.patient_diagnosis_logs
      .filter((item) => item.patient_id === patientId)
      .sort((a, b) => {
        const dateCompare = String(b.visit_date).localeCompare(String(a.visit_date));
        if (dateCompare) return dateCompare;
        return String(b.created_at).localeCompare(String(a.created_at));
      })
      .slice(0, limit)
      .map(clone);
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
