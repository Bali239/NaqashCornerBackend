import { Router } from "express";
import { createHash, randomBytes } from "node:crypto";
import { OAuth2Client } from "google-auth-library";
import { env } from "../config/env.js";
import OAuthState from "../models/OAuthState.js";
import { requireAuth } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendSuccessResponse } from "../utils/Response.js";
import { createSession, publicUser, revokeSession, upsertGoogleUser } from "../services/AuthService.js";

const router = Router();
const OAUTH_STATE_TTL_MS = 10 * 60 * 1000;
const hash = (value) => createHash("sha256").update(value).digest("hex");
const googleClient = () => new OAuth2Client(env.GOOGLE_CLIENT_ID, env.GOOGLE_CLIENT_SECRET, env.GOOGLE_REDIRECT_URI);

router.get("/google", asyncHandler(async (_req, res) => {
  const state = randomBytes(32).toString("hex");
  await OAuthState.create({ stateHash: hash(state), expiresAt: new Date(Date.now() + OAUTH_STATE_TTL_MS) });
  const authorizationUrl = googleClient().generateAuthUrl({
    access_type: "online",
    prompt: "select_account",
    response_type: "code",
    scope: ["openid", "email", "profile"],
    state,
  });
  return res.redirect(authorizationUrl);
}));

router.get("/google/callaback", asyncHandler(async (req, res) => {
  const redirectError = (reason) => res.redirect(`${env.CLIENT_URL}/?auth_error=${encodeURIComponent(reason)}`);
  if (req.query.error) return redirectError("Google sign-in was cancelled or denied.");
  const { code, state } = req.query;
  if (typeof code !== "string" || typeof state !== "string") return redirectError("Google did not return an authorization code.");

  const savedState = await OAuthState.findOneAndDelete({ stateHash: hash(state), expiresAt: { $gt: new Date() } });
  if (!savedState) return redirectError("Google sign-in expired or could not be verified. Please try again.");

  const client = googleClient();
  const { tokens } = await client.getToken(code);
  if (!tokens.id_token || !tokens.access_token) return redirectError("Google did not provide the required sign-in tokens.");
  const ticket = await client.verifyIdToken({ idToken: tokens.id_token, audience: env.GOOGLE_CLIENT_ID });
  const verifiedIdentity = ticket.getPayload();
  const profileResponse = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  });
  if (!profileResponse.ok) throw new Error("Google userinfo request failed.");
  const profile = await profileResponse.json();
  if (!verifiedIdentity?.sub || profile.sub !== verifiedIdentity.sub || !profile.email || verifiedIdentity.email_verified !== true) {
    return redirectError("Google account could not be verified.");
  }

  const user = await upsertGoogleUser({ ...profile, sub: verifiedIdentity.sub });
  const session = await createSession(user, req);
  const handoff = encodeURIComponent(JSON.stringify({ ...session, user: publicUser(user) }));
  return res.redirect(`${env.CLIENT_URL}/#session=${handoff}`);
}));

router.get("/me", requireAuth, (req, res) => sendSuccessResponse(res, {
  message: "Current session loaded.",
  data: { user: publicUser(req.authUser) },
}));

router.post("/logout", requireAuth, asyncHandler(async (req, res) => {
  const token = req.get("authorization").replace(/^Bearer\s+/i, "").trim();
  await revokeSession(token);
  return sendSuccessResponse(res, { message: "Signed out successfully.", data: null });
}));

export default router;
