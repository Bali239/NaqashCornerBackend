import mongoose from "mongoose";

const categorySchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 100 },
  slug: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
  description: { type: String, default: "", maxlength: 1000 },
  isActive: { type: Boolean, default: true, index: true },
}, { timestamps: true });

export default mongoose.models.Category || mongoose.model("Category", categorySchema);
