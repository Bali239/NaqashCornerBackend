import { Router } from "express";
import { createHash, randomBytes } from "node:crypto";
import { OAuth2Client } from "google-auth-library";
import User from "../models/User.js";
import Session from "../models/Session.js";
import OAuthState from "../models/OAuthState.js";

const router = Router();
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const OAUTH_STATE_TTL_MS = 10 * 60 * 1000;
const hash = (value) => createHash("sha256").update(value).digest("hex");
const oauthConfigured = () => process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET && process.env.GOOGLE_REDIRECT_URI;
const googleClient = () => new OAuth2Client(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET, process.env.GOOGLE_REDIRECT_URI);
const readSessionToken = (req) => {
  const match = (req.get("authorization") || "").match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim() || "";
};
const publicUser = (user) => ({
  id: user.id,
  name: user.name,
  username: user.username || user.name,
  email: user.email,
  photoUrl: user.photoUrl || user.picture || "",
});

router.get("/google", async (_req, res) => {
  try {
    if (!oauthConfigured()) return res.status(503).send("Google OAuth is not configured. Set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_REDIRECT_URI.");
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
  } catch (error) {
    console.error("Could not start Google OAuth:", error.message);
    return res.status(500).send("Could not start Google sign-in. Please try again.");
  }
});

// The path spelling matches the redirect URI provided for Google Cloud Console.
router.get("/google/callaback", async (req, res) => {
  const frontendUrl = process.env.CLIENT_URL || "http://localhost:3000";
  const redirectError = (reason) => res.redirect(`${frontendUrl}/?auth_error=${encodeURIComponent(reason)}`);
  try {
    if (req.query.error) return redirectError("Google sign-in was cancelled or denied.");
    const { code, state } = req.query;
    if (typeof code !== "string" || typeof state !== "string") return redirectError("Google did not return an authorization code.");
    if (!oauthConfigured()) return res.status(503).send("Google OAuth is not configured on the server.");

    const savedState = await OAuthState.findOneAndDelete({ stateHash: hash(state), expiresAt: { $gt: new Date() } });
    if (!savedState) return redirectError("Google sign-in expired or could not be verified. Please try again.");

    const client = googleClient();
    const { tokens } = await client.getToken(code);
    if (!tokens.id_token || !tokens.access_token) return redirectError("Google did not provide the required sign-in tokens.");

    const ticket = await client.verifyIdToken({ idToken: tokens.id_token, audience: process.env.GOOGLE_CLIENT_ID });
    const verifiedIdentity = ticket.getPayload();
    const profileResponse = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    if (!profileResponse.ok) throw new Error("Google userinfo request failed.");
    const profile = await profileResponse.json();
    if (!verifiedIdentity?.sub || profile.sub !== verifiedIdentity.sub || !profile.email || verifiedIdentity.email_verified !== true) {
      return redirectError("Google account could not be verified.");
    }

    const email = profile.email.toLowerCase();
    const name = profile.name || email;
    const photoUrl = profile.picture || "";
    let user = await User.findOne({ googleId: profile.sub });
    if (!user) user = await User.findOne({ email });
    if (user) {
      user.googleId = profile.sub;
      user.email = email;
      user.name = name;
      user.username = user.username || name;
      user.picture = photoUrl;
      user.photoUrl = photoUrl;
      user.provider = "google";
      user.emailVerified = true;
      user.lastLoginAt = new Date();
      await user.save();
    } else {
      user = await User.create({ googleId: profile.sub, email, name, username: name, picture: photoUrl, photoUrl, provider: "google", emailVerified: true, lastLoginAt: new Date() });
    }

    const sessionToken = randomBytes(32).toString("base64url");
    const now = Date.now();
    const expiresAt = new Date(now + SESSION_TTL_MS);
    await Session.create({
      tokenHash: hash(sessionToken),
      user: user._id,
      expiresAt,
      lastSeenAt: new Date(now),
      userAgent: req.get("user-agent") || "",
      ipAddress: req.ip || "",
    });

    // Deliver the app session through a URL fragment; fragments are not sent in HTTP requests or Referer headers.
    return res.redirect(`${frontendUrl}/#session=${encodeURIComponent(JSON.stringify({ token: sessionToken, expiresAt: expiresAt.toISOString(), user: publicUser(user) }))}`);
  } catch (error) {
    console.error("Google OAuth callback failed:", error.message);
    if (error?.code === 11000) return redirectError("This account is already in use. Please try again.");
    return redirectError("Google sign-in failed. Please try again.");
  }
});

router.get("/me", async (req, res) => {
  const rawToken = readSessionToken(req);
  if (!rawToken) return res.status(401).json({ message: "Not signed in." });
  const session = await Session.findOne({ tokenHash: hash(rawToken), expiresAt: { $gt: new Date() } }).populate("user");
  if (!session?.user) return res.status(401).json({ message: "Session expired. Please sign in again." });
  session.lastSeenAt = new Date();
  await session.save();
  return res.json({ user: publicUser(session.user) });
});

router.post("/logout", async (req, res) => {
  const rawToken = readSessionToken(req);
  if (rawToken) await Session.deleteOne({ tokenHash: hash(rawToken) });
  return res.json({ message: "Signed out." });
});

export default router;
