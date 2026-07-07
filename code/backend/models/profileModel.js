export function normalizeProfile(input = {}) {
  const trimmed = (v) => (typeof v === "string" ? v.trim() : "");
  const patientId = (v) => trimmed(v).toUpperCase();

  return {
    dob: trimmed(input.dob) || null,
    gender: trimmed(input.gender) || null,
    address: trimmed(input.address) || null,
    emergencyContact: trimmed(input.emergencyContact) || null,
    bloodGroup: trimmed(input.bloodGroup) || null,
    allergies: trimmed(input.allergies) || null,
    knownConditions: trimmed(input.knownConditions) || null,
    motherPatientId: patientId(input.motherPatientId) || null,
    fatherPatientId: patientId(input.fatherPatientId) || null,
    weight: trimmed(input.weight) || null,
    height: trimmed(input.height) || null,
    dietaryPreference: trimmed(input.dietaryPreference) || null,
    activityLevel: trimmed(input.activityLevel) || null
  };
}

export function normalizeAuthProfile(input = {}) {
  const fullName = String(input.fullName || "").trim();
  const phone = String(input.phone || "").trim();
  const photo = String(input.profilePhotoUrl || "").trim();

  if (!fullName) return { error: "fullName is required" };
  if (!phone) return { error: "phone is required" };
  if (photo.length > 2_000_000) return { error: "profilePhotoUrl is too large" };

  return {
    fullName,
    phone,
    profilePhotoUrl: photo || null
  };
}

export function normalizeDoctorSelfProfile(input = {}) {
  const text = (v) => (typeof v === "string" ? v.trim() : "");
  const cleanedDays = Array.isArray(input.availableDays)
    ? input.availableDays.map((day) => text(day)).filter(Boolean)
    : [];
  const uniqueDays = [...new Set(cleanedDays)];
  const experienceRaw = Number(input.experienceYears);
  const experienceYears = Number.isFinite(experienceRaw) ? Math.max(0, Math.min(60, Math.round(experienceRaw))) : 0;

  const fullName = text(input.fullName);
  const specialty = text(input.specialty);
  const qualification = text(input.qualification);
  const registrationId = text(input.registrationId);
  const email = text(input.email);
  const phone = text(input.phone);
  const workingHours = text(input.workingHours);
  const bio = text(input.bio);

  if (!fullName) return { error: "fullName is required" };
  if (!email) return { error: "email is required" };
  if (!phone) return { error: "phone is required" };

  return {
    fullName,
    specialty: specialty || "General Practice",
    qualification: qualification || "MBBS",
    experienceYears,
    registrationId: registrationId || null,
    email,
    phone,
    availableDays: uniqueDays,
    workingHours: workingHours || null,
    bio: bio || null
  };
}

export function mapPatientRecord(row) {
  return {
    patient: {
      id: row.id,
      patientId: row.patient_uid,
      username: row.username,
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
      allergies: row.allergies,
      knownConditions: row.known_conditions,
      motherPatientId: row.mother_patient_uid,
      fatherPatientId: row.father_patient_uid,
      weight: row.weight,
      height: row.height,
      dietaryPreference: row.dietary_preference,
      activityLevel: row.activity_level
    }
  };
}
