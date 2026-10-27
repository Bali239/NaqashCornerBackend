import { createHash, randomBytes } from "node:crypto";
import { env } from "../config/env.js";
import User from "../models/User.js";
import Session from "../models/Session.js";

const hashToken = (token) => createHash("sha256").update(token).digest("hex");

export const upsertGoogleUser = async (profile) => {
  const email = profile.email.toLowerCase();
  const isAdmin = env.ADMIN_EMAILS.includes(email);
  let user =
    (await User.findOne({ googleId: profile.sub })) ||
    (await User.findOne({ email }));
  const values = {
    googleId: profile.sub,
    email,
    name: profile.name || email,
    username: profile.name || email,
    picture: profile.picture || "",
    photoUrl: profile.picture || "",
    provider: "google",
    emailVerified: true,
    role: isAdmin ? "admin" : "customer",
    lastLoginAt: new Date(),
  };
  if (user) Object.assign(user, values);
  else user = new User(values);
  await user.save();
  return user;
};

export const createSession = async (user, request) => {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(
    Date.now() + env.SESSION_TTL_DAYS * 24 * 60 * 60 * 1000,
  );
  await Session.create({
    tokenHash: hashToken(token),
    user: user._id,
    expiresAt,
    lastSeenAt: new Date(),
    userAgent: request.get("user-agent") || "",
    ipAddress: request.ip || "",
  });
  return { token, expiresAt };
};

export const publicUser = (user) => ({
  id: user.id,
  name: user.name,
  username: user.username || user.name,
  email: user.email,
  photoUrl: user.photoUrl || user.picture || "",
  role: user.role,
});

export const revokeSession = async (token) =>
  Session.deleteOne({ tokenHash: hashToken(token) });
