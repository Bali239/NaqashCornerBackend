import { createHash } from "node:crypto";
import Session from "../models/Session.js";
import { env } from "../config/env.js";
import AppError from "../utils/AppError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const hashToken = (value) => createHash("sha256").update(value).digest("hex");

export const requireAuth = asyncHandler(async (req, _res, next) => {
  const match = (req.get("authorization") || "").match(/^Bearer\s+(.+)$/i);
  const token = match?.[1]?.trim();
  if (!token) throw new AppError("Authentication is required.", { statusCode: 401, code: "UNAUTHENTICATED" });

  const session = await Session.findOne({ tokenHash: hashToken(token), expiresAt: { $gt: new Date() } }).populate("user");
  if (!session?.user) throw new AppError("Your session expired. Sign in again.", { statusCode: 401, code: "SESSION_EXPIRED" });
  const allowlistedAdmin = env.ADMIN_EMAILS.includes(session.user.email.toLowerCase());
  const expectedRole = allowlistedAdmin ? "admin" : "customer";
  if (session.user.role !== expectedRole) {
    session.user.role = expectedRole;
    await session.user.save();
  }
  session.lastSeenAt = new Date();
  await session.save();
  req.authUser = session.user;
  req.authSession = session;
  next();
});

export const requireRole = (...roles) => (req, _res, next) => {
  if (!req.authUser) return next(new AppError("Authentication is required.", { statusCode: 401, code: "UNAUTHENTICATED" }));
  if (!roles.includes(req.authUser.role)) return next(new AppError("You do not have permission to perform this action.", { statusCode: 403, code: "FORBIDDEN" }));
  return next();
};

export const optionalAuth = (req, res, next) => {
  if (!req.get("authorization")) return next();
  return requireAuth(req, res, next);
};

export const requireAdmin = [requireAuth, requireRole("admin")];
