import { Router } from "express";
import { OAuth2Client } from "google-auth-library";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

const router = Router();

router.post("/google", async (req, res) => {
  try {
    const { credential } = req.body ?? {};
    if (!credential) return res.status(400).json({ message: "Google credential is required." });
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.JWT_SECRET) {
      return res.status(503).json({ message: "Authentication is not configured on the server." });
    }

    const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
    const ticket = await client.verifyIdToken({ idToken: credential, audience: process.env.GOOGLE_CLIENT_ID });
    const profile = ticket.getPayload();
    if (!profile?.sub || !profile.email || profile.email_verified !== true) {
      return res.status(401).json({ message: "Google account could not be verified." });
    }

    let user = await User.findOne({ googleId: profile.sub });
    if (!user) {
      user = await User.findOne({ email: profile.email.toLowerCase() });
      if (user) {
        user.googleId = profile.sub;
        user.name = profile.name || user.name;
        user.picture = profile.picture || user.picture;
        await user.save();
      } else {
        user = await User.create({ googleId: profile.sub, email: profile.email, name: profile.name || profile.email, picture: profile.picture || "" });
      }
    } else {
      user.name = profile.name || user.name;
      user.picture = profile.picture || user.picture;
      await user.save();
    }

    const token = jwt.sign({ sub: user.id }, process.env.JWT_SECRET, { expiresIn: "7d" });
    return res.json({ token, user: { id: user.id, name: user.name, email: user.email, picture: user.picture } });
  } catch (error) {
    console.error("Google authentication failed:", error.message);
    return res.status(401).json({ message: "Google sign-in failed. Please try again." });
  }
});

export default router;
