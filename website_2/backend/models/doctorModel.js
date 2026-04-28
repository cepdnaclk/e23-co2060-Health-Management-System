import { HARDCODED_DOCTOR_PASSWORD } from "../config/env.js";

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
  }
];

export function doctorToPublicProfile(doctor) {
  return {
    id: doctor.id,
    username: doctor.username,
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

export function findDoctorByUsername(username) {
  return HARD_CODED_DOCTORS.find((item) => item.username === username) || null;
}

export function listDoctorsPublic() {
  return HARD_CODED_DOCTORS.map((doctor) => doctorToPublicProfile(doctor));
}

export function updateDoctorByUsername(username, data) {
  const doctor = findDoctorByUsername(username);
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
