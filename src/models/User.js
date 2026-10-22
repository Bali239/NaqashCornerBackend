import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  googleId: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  name: { type: String, required: true },
  picture: { type: String, default: "" },
}, { timestamps: true });

export default mongoose.models.User || mongoose.model("User", userSchema);
