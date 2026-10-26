import mongoose from "mongoose";

const orderStatusEntrySchema = new mongoose.Schema({
  status: { type: String, required: true, enum: ["placed", "confirmed", "processing", "shipped", "delivered", "cancelled", "returned"] },
  changedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  note: { type: String, default: "" },
  at: { type: Date, default: Date.now },
}, { _id: false });

const paymentStatusEntrySchema = new mongoose.Schema({
  status: { type: String, required: true, enum: ["pending", "collected", "failed", "refunded"] },
  changedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  note: { type: String, default: "" },
  at: { type: Date, default: Date.now },
}, { _id: false });

const orderItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
  productName: { type: String, required: true, trim: true },
  sku: { type: String, default: "" },
  imageUrl: { type: String, default: "" },
  unitPriceMinor: { type: Number, required: true, min: 0 },
  discountedUnitPriceMinor: { type: Number, required: true, min: 0 },
  quantity: { type: Number, required: true, min: 1 },
  discountPercent: { type: Number, default: 0, min: 0, max: 100 },
  discountAmountMinor: { type: Number, default: 0, min: 0 },
  lineTotalMinor: { type: Number, required: true, min: 0 },
}, { _id: false });

const orderSchema = new mongoose.Schema({
  orderNumber: { type: String, required: true, unique: true, index: true },
  idempotencyKey: { type: String, default: "", index: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  customerEmail: { type: String, required: true, lowercase: true, trim: true },
  recipientName: { type: String, required: true, trim: true },
  phoneNumber: { type: String, required: true, trim: true },
  shipping: {
    address: { type: String, required: true, trim: true },
  },
  paymentMethod: { type: String, enum: ["cod"], default: "cod" },
  paymentStatus: { type: String, enum: ["pending", "collected", "failed", "refunded"], default: "pending", index: true },
  status: { type: String, enum: ["placed", "confirmed", "processing", "shipped", "delivered", "cancelled", "returned"], default: "placed", index: true },
  items: { type: [orderItemSchema], required: true },
  currency: { type: String, required: true, uppercase: true, minlength: 3, maxlength: 3 },
  subtotalMinor: { type: Number, required: true, min: 0 },
  discountAmountMinor: { type: Number, required: true, min: 0 },
  shippingFeeMinor: { type: Number, required: true, min: 0 },
  taxMinor: { type: Number, required: true, min: 0 },
  totalMinor: { type: Number, required: true, min: 0 },
  statusHistory: { type: [orderStatusEntrySchema], default: [] },
  paymentHistory: { type: [paymentStatusEntrySchema], default: [] },
  adminNotes: { type: [{ text: String, author: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, createdAt: { type: Date, default: Date.now } }], default: [] },
}, { timestamps: true });

orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ idempotencyKey: 1, user: 1 }, { unique: true, sparse: true });

export default mongoose.models.Order || mongoose.model("Order", orderSchema);
