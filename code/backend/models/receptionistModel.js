import { HARDCODED_RECEPTIONIST_PASSWORD } from "../config/env.js";
import { findUserByUsername as findAccountByUsername } from "./accountModel.js";

const HARD_CODED_RECEPTIONISTS = [
  {
    id: "receptionist1",
    username: "receptionist1",
    password: HARDCODED_RECEPTIONIST_PASSWORD,
    fullName: "Receptionist One",
    email: "receptionist1@invex.local"
  }
];

export async function findReceptionistByUsername(username) {
  const account = await findAccountByUsername(username, "receptionist");
  if (account) {
    return {
      id: account.id,
      username: account.username,
      password: account.password_hash,
      fullName: account.full_name,
      email: account.email,
      role: "receptionist"
    };
  }

  return HARD_CODED_RECEPTIONISTS.find((item) => item.username === username) || null;
}

export function receptionistToPublicProfile(receptionist) {
  return {
    id: receptionist.id,
    username: receptionist.username,
    fullName: receptionist.fullName,
    email: receptionist.email
  };
}

export function findHardcodedReceptionistByEmail(email) {
  return HARD_CODED_RECEPTIONISTS.find(
    (item) => String(item.email || "").trim().toLowerCase() === String(email || "").trim().toLowerCase()
  ) || null;
}
