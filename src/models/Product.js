import mongoose from "mongoose";

const imageSchema = new mongoose.Schema({
  publicId: { type: String, required: true },
  secureUrl: { type: String, required: true },
  altText: { type: String, default: "", maxlength: 200 },
  width: { type: Number, default: null },
  height: { type: Number, default: null },
  format: { type: String, default: "" },
  bytes: { type: Number, default: null },
  sortOrder: { type: Number, default: 0 },
}, { _id: true });

const attributeSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 80 },
  value: { type: String, required: true, trim: true, maxlength: 300 },
}, { _id: false });

const productSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 180 },
  slug: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
  sku: { type: String, trim: true, uppercase: true, sparse: true, unique: true },
  description: { type: String, required: true, trim: true, maxlength: 12000 },
  shortDescription: { type: String, default: "", trim: true, maxlength: 400 },
  category: { type: mongoose.Schema.Types.ObjectId, ref: "Category", required: true, index: true },
  brand: { type: String, default: "", trim: true, maxlength: 100, index: true },
  tags: { type: [String], default: [], index: true },
  attributes: { type: [attributeSchema], default: [] },
  priceMinor: { type: Number, required: true, min: 0 },
  discountPercent: { type: Number, default: 0, min: 0, max: 90 },
  currency: { type: String, required: true, uppercase: true, minlength: 3, maxlength: 3 },
  availablePieces: { type: Number, required: true, min: 0, default: 0 },
  trackInventory: { type: Boolean, default: true },
  status: { type: String, enum: ["draft", "published", "archived"], default: "draft", index: true },
  images: { type: [imageSchema], default: [] },
  weightGrams: { type: Number, min: 0, default: null },
  dimensionsCm: {
    length: { type: Number, min: 0, default: null },
    width: { type: Number, min: 0, default: null },
    height: { type: Number, min: 0, default: null },
  },
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } });

productSchema.index({ status: 1, category: 1, priceMinor: 1, createdAt: -1 });
productSchema.index({ status: 1, createdAt: -1 });
productSchema.index({ name: "text", description: "text", shortDescription: "text", brand: "text", tags: "text" });

export default mongoose.models.Product || mongoose.model("Product", productSchema);
