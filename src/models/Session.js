import mongoose from "mongoose";

const sessionSchema = new mongoose.Schema(
  {
    tokenHash: { type: String, required: true, unique: true, index: true },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    expiresAt: { type: Date, required: true, expires: 0 },
    lastSeenAt: { type: Date, default: Date.now },
    userAgent: { type: String, default: "" },
    ipAddress: { type: String, default: "" },
  },
  { timestamps: true },
);

export default mongoose.models.Session ||
  mongoose.model("Session", sessionSchema);
