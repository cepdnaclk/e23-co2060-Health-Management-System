import { HARDCODED_DOCTOR_PASSWORD } from "../config/env.js";
import { findUserByUsername as findAccountByUsername, findUsersByRole, updateRoleAccount } from "./accountModel.js";

const HARD_CODED_DOCTORS = [
  {
    id: "doctor1",
    username: "doctor1",
    password: HARDCODED_DOCTOR_PASSWORD,
    fullName: "Dr. Default One",
    specialty: "General Practice",
    qualification: "MBBS",
    experienceYears: 6,
    registrationId: "SLMC-DR-1001",
    email: "doctor1@invex.local",
    phone: "+94 71 000 1001",
    availableDays: ["Monday", "Tuesday", "Wednesday", "Friday"],
    workingHours: "09:00 - 17:00",
    bio: "Provides primary care consultations, diagnosis, and follow-up treatment plans."
  },
  {
    id: "doctor2",
    username: "doctor2",
    password: HARDCODED_DOCTOR_PASSWORD,
    fullName: "Dr. Nethmi Perera",
    specialty: "Cardiology",
    qualification: "MBBS, MD Cardiology",
    experienceYears: 11,
    registrationId: "SLMC-DR-1002",
    email: "cardiology@medicare.local",
    phone: "+94 71 000 1002",
    availableDays: ["Monday", "Wednesday", "Friday"],
    workingHours: "08:30 - 15:30",
    bio: "Specializes in chest pain evaluation, hypertension care, rhythm review, and cardiac follow-up planning."
  },
  {
    id: "doctor3",
    username: "doctor3",
    password: HARDCODED_DOCTOR_PASSWORD,
    fullName: "Dr. Kavindu Jayasinghe",
    specialty: "Neurology",
    qualification: "MBBS, MD Neurology",
    experienceYears: 9,
    registrationId: "SLMC-DR-1003",
    email: "neurology@medicare.local",
    phone: "+94 71 000 1003",
    availableDays: ["Tuesday", "Thursday", "Saturday"],
    workingHours: "10:00 - 16:00",
    bio: "Supports patients with headaches, seizures, nerve symptoms, stroke follow-up, and neurological assessments."
  },
  {
    id: "doctor4",
    username: "doctor4",
    password: HARDCODED_DOCTOR_PASSWORD,
    fullName: "Dr. Tharushi Silva",
    specialty: "Dermatology",
    qualification: "MBBS, Diploma in Dermatology",
    experienceYears: 7,
    registrationId: "SLMC-DR-1004",
    email: "dermatology@medicare.local",
    phone: "+94 71 000 1004",
    availableDays: ["Monday", "Tuesday", "Thursday"],
    workingHours: "09:30 - 14:30",
    bio: "Treats skin rashes, allergy-related skin reactions, acne, infections, and long-term dermatology concerns."
  },
  {
    id: "doctor5",
    username: "doctor5",
    password: HARDCODED_DOCTOR_PASSWORD,
    fullName: "Dr. Isuru Fernando",
    specialty: "Orthopedics",
    qualification: "MBBS, MS Orthopedics",
    experienceYears: 13,
    registrationId: "SLMC-DR-1005",
    email: "orthopedics@medicare.local",
    phone: "+94 71 000 1005",
    availableDays: ["Wednesday", "Friday", "Saturday"],
    workingHours: "11:00 - 18:00",
    bio: "Manages joint pain, fractures, sports injuries, back pain, and rehabilitation-focused orthopedic care."
  },
  {
    id: "doctor6",
    username: "doctor6",
    password: HARDCODED_DOCTOR_PASSWORD,
    fullName: "Dr. Anjali Wijeratne",
    specialty: "Pediatrics",
    qualification: "MBBS, MD Pediatrics",
    experienceYears: 10,
    registrationId: "SLMC-DR-1006",
    email: "pediatrics@medicare.local",
    phone: "+94 71 000 1006",
    availableDays: ["Monday", "Wednesday", "Saturday"],
    workingHours: "08:00 - 13:00",
    bio: "Provides child health consultations, fever assessment, growth monitoring, and pediatric follow-up care."
  },
  {
    id: "doctor7",
    username: "doctor7",
    password: HARDCODED_DOCTOR_PASSWORD,
    fullName: "Dr. Malith Gunasekara",
    specialty: "ENT",
    qualification: "MBBS, MS ENT",
    experienceYears: 8,
    registrationId: "SLMC-DR-1007",
    email: "ent@medicare.local",
    phone: "+94 71 000 1007",
    availableDays: ["Tuesday", "Thursday", "Friday"],
    workingHours: "09:00 - 15:00",
    bio: "Handles ear pain, sinus symptoms, throat infections, hearing issues, and ENT procedure follow-up."
  },
  {
    id: "doctor8",
    username: "doctor8",
    password: HARDCODED_DOCTOR_PASSWORD,
    fullName: "Dr. Samadhi Ranasinghe",
    specialty: "Internal Medicine",
    qualification: "MBBS, MD Internal Medicine",
    experienceYears: 12,
    registrationId: "SLMC-DR-1008",
    email: "medicine@medicare.local",
    phone: "+94 71 000 1008",
    availableDays: ["Monday", "Thursday", "Friday"],
    workingHours: "10:00 - 17:00",
    bio: "Focuses on complex fever, diabetes, respiratory symptoms, digestive concerns, and chronic disease review."
  }
];

function normalizeDoctorProfile(doctor) {
  if (!doctor) return null;
  const roleProfile = doctor.role_profile || {};
  return {
    id: doctor.id,
    username: doctor.username,
    fullName: doctor.fullName || doctor.full_name,
    specialty: doctor.specialty || roleProfile.specialty || "General Practice",
    qualification: doctor.qualification || roleProfile.qualification || "MBBS",
    experienceYears: doctor.experienceYears ?? roleProfile.experienceYears ?? 0,
    registrationId: doctor.registrationId || roleProfile.registrationId || null,
    email: doctor.email,
    phone: doctor.phone,
    availableDays: doctor.availableDays || roleProfile.availableDays || [],
    workingHours: doctor.workingHours || roleProfile.workingHours || null,
    bio: doctor.bio || roleProfile.bio || null,
    role: "doctor"
  };
}

export function doctorToPublicProfile(doctor) {
  return normalizeDoctorProfile(doctor);
}

function hardcodedDoctorToProfile(doctor) {
  if (!doctor) return null;
  return {
    id: doctor.id,
    username: doctor.username,
    password: doctor.password,
    fullName: doctor.fullName,
    specialty: doctor.specialty,
    qualification: doctor.qualification,
    experienceYears: doctor.experienceYears,
    registrationId: doctor.registrationId,
    email: doctor.email,
    phone: doctor.phone,
    availableDays: doctor.availableDays,
    workingHours: doctor.workingHours,
    bio: doctor.bio
  };
}

export async function findDoctorByUsername(username) {
  const account = await findAccountByUsername(username, "doctor");
  if (account) return normalizeDoctorProfile(account);
  const hardcoded = HARD_CODED_DOCTORS.find((item) => item.username === username) || null;
  return hardcodedDoctorToProfile(hardcoded);
}

export async function listDoctorsPublic() {
  const accounts = await findUsersByRole("doctor", 200);
  const profiles = [...HARD_CODED_DOCTORS.map(hardcodedDoctorToProfile), ...accounts.map(normalizeDoctorProfile)];
  return profiles.filter(Boolean).filter((doctor, index, list) => list.findIndex((item) => item.username === doctor.username) === index);
}

export function findDoctorsBySpecialties(specialties = [], limit = 3) {
  const normalized = specialties.map((item) => String(item || "").trim().toLowerCase()).filter(Boolean);
  const exactMatches = HARD_CODED_DOCTORS.filter((doctor) => normalized.includes(String(doctor.specialty || "").toLowerCase()));
  const fallback = HARD_CODED_DOCTORS.filter((doctor) => doctor.specialty === "General Practice" || doctor.specialty === "Internal Medicine");
  const unique = [...exactMatches, ...fallback].filter(
    (doctor, index, list) => list.findIndex((item) => item.username === doctor.username) === index
  );
  return unique.slice(0, limit).map((doctor) => doctorToPublicProfile(doctor));
}

export async function updateDoctorByUsername(username, data) {
  const doctorAccount = await findAccountByUsername(username, "doctor");
  if (doctorAccount) {
    await updateRoleAccount(doctorAccount.id, {
      fullName: data.fullName,
      username: doctorAccount.username,
      email: data.email,
      phone: data.phone,
      profilePhotoUrl: doctorAccount.profile_photo_url,
      passwordHash: doctorAccount.password_hash,
      roleProfile: {
        specialty: data.specialty,
        qualification: data.qualification,
        experienceYears: data.experienceYears,
        registrationId: data.registrationId,
        availableDays: data.availableDays,
        workingHours: data.workingHours,
        bio: data.bio
      }
    });
    return normalizeDoctorProfile(await findAccountByUsername(username, "doctor"));
  }

  const doctor = HARD_CODED_DOCTORS.find((item) => item.username === username);
  if (!doctor) return null;

  doctor.fullName = data.fullName;
  doctor.specialty = data.specialty;
  doctor.qualification = data.qualification;
  doctor.experienceYears = data.experienceYears;
  doctor.registrationId = data.registrationId;
  doctor.email = data.email;
  doctor.phone = data.phone;
  doctor.availableDays = data.availableDays;
  doctor.workingHours = data.workingHours;
  doctor.bio = data.bio;

  return doctorToPublicProfile(doctor);
}
