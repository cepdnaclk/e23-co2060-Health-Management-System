import { HARDCODED_RECEPTIONIST_PASSWORD } from "../config/env.js";

const HARD_CODED_RECEPTIONISTS = [
  {
    id: "receptionist1",
    username: "receptionist1",
    password: HARDCODED_RECEPTIONIST_PASSWORD,
    fullName: "Receptionist One",
    email: "receptionist1@invex.local"
  }
];

export function findReceptionistByUsername(username) {
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
