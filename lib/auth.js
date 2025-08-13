// lib/auth.js
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
    throw new Error("Missing JWT_SECRET in environment");
}

export function signToken(payload, opts = {}) {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: opts.expiresIn || "8h" });
}

export function verifyToken(token) {
    return jwt.verify(token, JWT_SECRET);
}

/**
 * extracts & verifies token from a Request object.
 * throws Error on missing/invalid token.
 */
export function verifyTokenFromRequest(req) {
    const auth = req.headers.get("authorization") || "";
    if (!auth) throw new Error("No Authorization header");
    const parts = auth.split(" ");
    if (parts.length !== 2 || parts[0] !== "Bearer") throw new Error("Invalid Authorization format");
    const token = parts[1];
    return verifyToken(token);
}
