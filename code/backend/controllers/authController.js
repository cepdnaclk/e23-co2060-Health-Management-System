import bcrypt from "bcryptjs";
import { OAuth2Client } from "google-auth-library";
import { findDoctorByUsername, doctorToPublicProfile } from "../models/doctorModel.js";
import {
  createUser,
  findUserByEmail,
  findUserByLoginIdentifier,
  findUserByPatientUid,
  normalizePatientUid,
  upsertPatientProfile
} from "../models/patientModel.js";
import { formatRoleSessionUser, createRoleAccount, findUserByEmail as findAnyUserByEmail, findUserByLoginIdentifier as findAnyUserByLoginIdentifier, findUserByUsername as findAnyUserByUsername, updateRoleAccount, updateUserAccount, updateUserPassword } from "../models/accountModel.js";
import { normalizeAuthProfile, normalizeDoctorSelfProfile, normalizeProfile } from "../models/profileModel.js";
import { signToken } from "../middlewares/auth.js";
import { findReceptionistByUsername, receptionistToPublicProfile } from "../models/receptionistModel.js";
import { GOOGLE_CLIENT_ID } from "../config/env.js";

const googleAuthClient = new OAuth2Client(GOOGLE_CLIENT_ID);

async function validateParentLinks(profile) {
  const motherPatientId = normalizePatientUid(profile.motherPatientId);
  const fatherPatientId = normalizePatientUid(profile.fatherPatientId);

  if (motherPatientId && fatherPatientId && motherPatientId === fatherPatientId) {
    return { error: "Mother and father patient IDs must be different" };
  }

  for (const [label, patientId] of [
    ["Mother", motherPatientId],
    ["Father", fatherPatientId]
  ]) {
    if (!patientId) continue;
    const parent = await findUserByPatientUid(patientId);
    if (!parent) return { error: `${label} patient ID was not found` };
  }

  return {
    motherPatientId: motherPatientId || null,
    fatherPatientId: fatherPatientId || null
  };
}

function patientSessionUser(user) {
  return {
    id: user.id,
    patientId: user.patient_uid,
    username: user.username,
    fullName: user.full_name,
    email: user.email,
    phone: user.phone,
    profilePhotoUrl: user.profile_photo_url
  };
}

function roleSessionUser(user) {
  return formatRoleSessionUser(user);
}

export async function signup(req, res) {
  const fullName = String(req.body?.fullName || "").trim();
  const email = String(req.body?.email || "").trim().toLowerCase();
  const phone = String(req.body?.phone || "").trim();
  const password = String(req.body?.password || "");
  const requestedProfile = normalizeProfile(req.body || {});

  if (!fullName || !email || !phone || !password) {
    return res.status(400).json({ error: "fullName, email, phone, and password are required" });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: "Password must be at least 6 characters" });
  }

  try {
    const existing = await findAnyUserByEmail(email);
    if (existing) {
      if (existing.role === "patient" && (!existing.password_hash || !existing.password_hash.startsWith("$2"))) {
        const parentLinks = await validateParentLinks(requestedProfile);
        if (parentLinks.error) {
          return res.status(400).json({ error: parentLinks.error });
        }

        const passwordHash = await bcrypt.hash(password, 10);
        await updateUserPassword(existing.id, passwordHash);
        await updateUserAccount(existing.id, {
          fullName,
          phone,
          profilePhotoUrl: existing.profile_photo_url
        });

        await upsertPatientProfile(existing.id, {
          dob: null,
          gender: null,
          address: null,
          emergencyContact: null,
          bloodGroup: null,
          allergies: null,
          knownConditions: null,
          motherPatientId: parentLinks.motherPatientId,
          fatherPatientId: parentLinks.fatherPatientId
        });

        const user = await findUserByEmail(email);
        const token = signToken({ id: user.id, email: user.email, role: "patient" });
        return res.status(200).json({
          token,
          role: "patient",
          user: patientSessionUser(user)
        });
      }
      return res.status(409).json({ error: "Email already in use" });
    }

    const parentLinks = await validateParentLinks(requestedProfile);
    if (parentLinks.error) {
      return res.status(400).json({ error: parentLinks.error });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await createUser({ fullName, email, phone, passwordHash });
    await upsertPatientProfile(user.id, {
      dob: null,
      gender: null,
      address: null,
      emergencyContact: null,
      bloodGroup: null,
      allergies: null,
      knownConditions: null,
      motherPatientId: parentLinks.motherPatientId,
      fatherPatientId: parentLinks.fatherPatientId
    });

    const token = signToken({ id: user.id, email: user.email, role: "patient" });
    return res.status(201).json({
      token,
      role: "patient",
      user: patientSessionUser(user)
    });
  } catch (error) {
    console.error("Signup error:", error);
    return res.status(500).json({ error: "Sign up failed" });
  }
}

export async function patientLogin(req, res) {
  const email = String(req.body?.email || "").trim().toLowerCase();
  const password = String(req.body?.password || "");

  if (!email || !password) {
    return res.status(400).json({ error: "Patient login and password are required" });
  }

  try {
    const user = await findUserByLoginIdentifier(email);
    if (!user) {
      return res.status(401).json({ error: "Invalid patient login or password" });
    }

    if (!user.password_hash) {
      return res.status(401).json({
        error: "This account was created with Google. Use Continue with Google, or set a password in Settings first."
      });
    }

    const valid = Boolean(user.password_hash) && (await bcrypt.compare(password, user.password_hash));
    if (!valid) {
      return res.status(401).json({ error: "Invalid patient login or password" });
    }

    const token = signToken({ id: user.id, email: user.email, role: "patient" });
    return res.json({
      token,
      role: "patient",
      user: patientSessionUser(user)
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ error: "Login failed" });
  }
}

export async function googleSignIn(req, res) {
  const credential = String(req.body?.credential || "");
  if (!credential) {
    return res.status(400).json({ error: "Google credential is required" });
  }

  if (!GOOGLE_CLIENT_ID) {
    return res.status(500).json({ error: "Google sign-in is not configured" });
  }

  try {
    const ticket = await googleAuthClient.verifyIdToken({
      idToken: credential,
      audience: GOOGLE_CLIENT_ID
    });
    const payload = ticket.getPayload();
    const email = String(payload?.email || "").trim().toLowerCase();
    const fullName = String(payload?.name || email.split("@")[0] || "").trim();
    const profilePhotoUrl = String(payload?.picture || "").trim();

    if (!email) {
      return res.status(400).json({ error: "Google account did not provide an email" });
    }

    const existingAccount = await findAnyUserByEmail(email);
    if (existingAccount && existingAccount.role !== "patient") {
      return res.status(409).json({ error: "Email already in use" });
    }

    let user = await findUserByEmail(email);
    if (!user) {
      return res.status(400).json({ error: "No account found with this Google email. Please sign up first." });
    }

    const token = signToken({ id: user.id, email: user.email, role: "patient" });
    return res.json({
      token,
      role: "patient",
      user: patientSessionUser(user)
    });
  } catch (error) {
    console.error("Google sign in error:", error);
    return res.status(500).json({ error: "Google sign-in failed" });
  }
}

export async function doctorLogin(req, res) {
  const username = String(req.body?.username || "").trim();
  const password = String(req.body?.password || "");

  if (!username || !password) {
    return res.status(400).json({ error: "username and password are required" });
  }

  const doctorAccount = await findAnyUserByUsername(username, "doctor");
  if (doctorAccount) {
    const valid = Boolean(doctorAccount.password_hash) && (await bcrypt.compare(password, doctorAccount.password_hash));
    if (!valid) {
      return res.status(401).json({ error: "Invalid username or password" });
    }

    const token = signToken({
      id: doctorAccount.id,
      username: doctorAccount.username,
      email: doctorAccount.email,
      role: "doctor"
    });

    return res.json({
      token,
      role: "doctor",
      user: roleSessionUser(doctorAccount)
    });
  }

  const doctor = await findDoctorByUsername(username);
  if (!doctor || doctor.password !== password) {
    return res.status(401).json({ error: "Invalid username or password" });
  }

  const token = signToken({
    id: doctor.id,
    username: doctor.username,
    email: doctor.email,
    role: "doctor"
  });

  return res.json({
    token,
    role: "doctor",
    user: doctorToPublicProfile(doctor)
  });
}

export async function doctorSignup(req, res) {
  const username = String(req.body?.username || "").trim();
  const password = String(req.body?.password || "");
  const profile = normalizeDoctorSelfProfile(req.body || {});

  if (!username) return res.status(400).json({ error: "username is required" });
  if (!password) return res.status(400).json({ error: "password is required" });
  if (password.length < 6) return res.status(400).json({ error: "Password must be at least 6 characters" });
  if (profile.error) return res.status(400).json({ error: profile.error });

  try {
    const existingUsername = await findAnyUserByUsername(username, "doctor");
    if (existingUsername) return res.status(409).json({ error: "Username already in use" });

    const existingEmail = await findAnyUserByEmail(profile.email);
    if (existingEmail) return res.status(409).json({ error: "Email already in use" });

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await createRoleAccount({
      role: "doctor",
      username,
      fullName: profile.fullName,
      email: profile.email,
      phone: profile.phone,
      passwordHash,
      roleProfile: {
        specialty: profile.specialty,
        qualification: profile.qualification,
        experienceYears: profile.experienceYears,
        registrationId: profile.registrationId,
        availableDays: profile.availableDays,
        workingHours: profile.workingHours,
        bio: profile.bio
      }
    });

    const token = signToken({ id: user.id, username: user.username, email: user.email, role: "doctor" });
    return res.status(201).json({ token, role: "doctor", user: roleSessionUser(user) });
  } catch (error) {
    console.error("Doctor signup error:", error);
    return res.status(500).json({ error: "Doctor sign up failed" });
  }
}

export async function receptionistLogin(req, res) {
  const username = String(req.body?.username || "").trim();
  const password = String(req.body?.password || "");

  if (!username || !password) {
    return res.status(400).json({ error: "username and password are required" });
  }

  const receptionistAccount = await findAnyUserByUsername(username, "receptionist");
  if (receptionistAccount) {
    const valid = Boolean(receptionistAccount.password_hash) && (await bcrypt.compare(password, receptionistAccount.password_hash));
    if (!valid) {
      return res.status(401).json({ error: "Invalid username or password" });
    }

    const token = signToken({
      id: receptionistAccount.id,
      username: receptionistAccount.username,
      email: receptionistAccount.email,
      role: "receptionist"
    });

    return res.json({
      token,
      role: "receptionist",
      user: roleSessionUser(receptionistAccount)
    });
  }

  const receptionist = await findReceptionistByUsername(username);
  if (!receptionist || receptionist.password !== password) {
    return res.status(401).json({ error: "Invalid username or password" });
  }

  const token = signToken({
    id: receptionist.id,
    username: receptionist.username,
    email: receptionist.email,
    role: "receptionist"
  });

  return res.json({
    token,
    role: "receptionist",
    user: receptionistToPublicProfile(receptionist)
  });
}

export async function receptionistSignup(req, res) {
  const username = String(req.body?.username || "").trim();
  const fullName = String(req.body?.fullName || "").trim();
  const email = String(req.body?.email || "").trim().toLowerCase();
  const phone = String(req.body?.phone || "").trim();
  const password = String(req.body?.password || "");

  if (!username || !fullName || !email || !phone || !password) {
    return res.status(400).json({ error: "username, fullName, email, phone, and password are required" });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: "Password must be at least 6 characters" });
  }

  try {
    const existingUsername = await findAnyUserByUsername(username, "receptionist");
    if (existingUsername) return res.status(409).json({ error: "Username already in use" });

    const existingEmail = await findAnyUserByEmail(email);
    if (existingEmail) return res.status(409).json({ error: "Email already in use" });

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await createRoleAccount({
      role: "receptionist",
      username,
      fullName,
      email,
      phone,
      passwordHash,
      roleProfile: {}
    });

    const token = signToken({ id: user.id, username: user.username, email: user.email, role: "receptionist" });
    return res.status(201).json({ token, role: "receptionist", user: roleSessionUser(user) });
  } catch (error) {
    console.error("Receptionist signup error:", error);
    return res.status(500).json({ error: "Receptionist sign up failed" });
  }
}
