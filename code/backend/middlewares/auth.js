import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../config/env.js";

export function signToken(user) {
  return jwt.sign(
    {
      sub: user.id,
      email: user.email || null,
      username: user.username || null,
      role: user.role || "patient"
    },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
}

export function authRequired(req, res, next) {
  const auth = req.headers.authorization || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";

  if (!token) return res.status(401).json({ error: "Missing token" });

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.auth = payload;
    req.role = payload.role || "patient";
    req.userId = req.role === "patient" ? Number(payload.sub) : payload.sub;
    return next();
  } catch {
    return res.status(401).json({ error: "Invalid token" });
  }
}

export function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (allowedRoles.includes(req.role)) return next();
    return res.status(403).json({ error: "Forbidden for this role" });
  };
}
