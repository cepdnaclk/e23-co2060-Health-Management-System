import bcrypt from "bcryptjs";
import { findDoctorByUsername, doctorToPublicProfile } from "../models/doctorModel.js";
import { createUser, findUserByEmail } from "../models/patientModel.js";
import { signToken } from "../middlewares/auth.js";
import { findReceptionistByUsername, receptionistToPublicProfile } from "../models/receptionistModel.js";

export async function signup(req, res) {
  const fullName = String(req.body?.fullName || "").trim();
  const email = String(req.body?.email || "").trim().toLowerCase();
  const phone = String(req.body?.phone || "").trim();
  const password = String(req.body?.password || "");

  if (!fullName || !email || !phone || !password) {
    return res.status(400).json({ error: "fullName, email, phone, and password are required" });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: "Password must be at least 6 characters" });
  }

  try {
    const existing = await findUserByEmail(email);
    if (existing) {
      return res.status(409).json({ error: "Email already in use" });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await createUser({ fullName, email, phone, passwordHash });

    const token = signToken({ id: user.id, email: user.email, role: "patient" });
    return res.status(201).json({
      token,
      role: "patient",
      user: {
        id: user.id,
        fullName: user.full_name,
        email: user.email,
        phone: user.phone,
        profilePhotoUrl: user.profile_photo_url
      }
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
    const user = await findUserByEmail(email);
    if (!user) {
      return res.status(401).json({ error: "Invalid patient login or password" });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: "Invalid patient login or password" });
    }

    const token = signToken({ id: user.id, email: user.email, role: "patient" });
    return res.json({
      token,
      role: "patient",
      user: {
        id: user.id,
        fullName: user.full_name,
        email: user.email,
        phone: user.phone,
        profilePhotoUrl: user.profile_photo_url
      }
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ error: "Login failed" });
  }
}

export async function doctorLogin(req, res) {
  const username = String(req.body?.username || "").trim();
  const password = String(req.body?.password || "");

  if (!username || !password) {
    return res.status(400).json({ error: "username and password are required" });
  }

  const doctor = findDoctorByUsername(username);
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

export function receptionistLogin(req, res) {
  const username = String(req.body?.username || "").trim();
  const password = String(req.body?.password || "");

  if (!username || !password) {
    return res.status(400).json({ error: "username and password are required" });
  }

  const receptionist = findReceptionistByUsername(username);
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
