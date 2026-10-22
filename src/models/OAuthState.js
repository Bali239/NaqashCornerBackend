import mongoose from "mongoose";

const oauthStateSchema = new mongoose.Schema({
  stateHash: { type: String, required: true, unique: true },
  returnTo: { type: String, default: "/" },
  expiresAt: { type: Date, required: true, expires: 0 },
}, { timestamps: true });

export default mongoose.models.OAuthState || mongoose.model("OAuthState", oauthStateSchema);
