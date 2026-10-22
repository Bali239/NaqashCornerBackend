import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
  name: { type: String, required: true },
  slug: { type: String, required: true },
  imageUrl: { type: String, default: "" },
  unitPriceMinor: { type: Number, required: true, min: 0 },
  quantity: { type: Number, required: true, min: 1 },
  lineTotalMinor: { type: Number, required: true, min: 0 },
}, { _id: false });

const orderSchema = new mongoose.Schema({
  orderNumber: { type: String, required: true, unique: true, index: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  status: { type: String, enum: ["pending_payment", "paid", "cancelled", "fulfilled"], default: "pending_payment", index: true },
  paymentStatus: { type: String, enum: ["unpaid", "paid", "failed", "refunded"], default: "unpaid" },
  items: { type: [orderItemSchema], required: true },
  currency: { type: String, required: true, uppercase: true, minlength: 3, maxlength: 3 },
  subtotalMinor: { type: Number, required: true, min: 0 },
  discountMinor: { type: Number, required: true, min: 0 },
  totalMinor: { type: Number, required: true, min: 0 },
}, { timestamps: true });

orderSchema.index({ user: 1, createdAt: -1 });

export default mongoose.models.Order || mongoose.model("Order", orderSchema);
