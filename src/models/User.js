import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  googleId: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  name: { type: String, required: true },
  username: { type: String, default: "" },
  picture: { type: String, default: "" },
  photoUrl: { type: String, default: "" },
  provider: { type: String, default: "google" },
  emailVerified: { type: Boolean, default: false },
  lastLoginAt: { type: Date, default: null },
}, { timestamps: true });

export default mongoose.models.User || mongoose.model("User", userSchema);
