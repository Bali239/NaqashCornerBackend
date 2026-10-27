import { randomBytes } from "node:crypto";
import nodemailer from "nodemailer";
import mongoose from "mongoose";
import { env } from "../config/env.js";
import Order from "../models/Order.js";
import Product from "../models/Product.js";
import AppError from "../utils/AppError.js";

export const normalizePhoneNumber = (value) => {
  if (value == null) return "";
  const formatted = String(value).trim();
  if (!/^03\d{2}-\d{7}$/.test(formatted)) return "";
  return `+92${formatted.replace(/\D/g, "").slice(1)}`;
};

export const calculateOrderTotals = ({ items = [], shippingFeeMinor = 0, taxRatePercent = 0 }) => {
  const subtotalMinor = items.reduce((sum, item) => sum + Number(item.unitPriceMinor || 0) * (Number(item.quantity) || 0), 0);
  const discountAmountMinor = items.reduce((sum, item) => {
    const unitPriceMinor = Number(item.unitPriceMinor || 0);
    const quantity = Number(item.quantity) || 0;
    const discountPercent = Math.min(100, Math.max(0, Number(item.discountPercent || 0)));
    const discountedUnitPrice = Math.round(unitPriceMinor * (100 - discountPercent) / 100);
    const lineSubtotal = unitPriceMinor * quantity;
    const lineDiscount = lineSubtotal - discountedUnitPrice * quantity;
    return sum + lineDiscount;
  }, 0);
  const taxMinor = Math.round((subtotalMinor - discountAmountMinor + shippingFeeMinor) * (Number(taxRatePercent) || 0) / 100);
  const totalMinor = subtotalMinor - discountAmountMinor + shippingFeeMinor + taxMinor;

  return {
    subtotalMinor,
    discountAmountMinor,
    shippingFeeMinor,
    taxMinor,
    totalMinor,
  };
};

export const validateOrderInputs = (payload = {}) => {
  const recipientName = String(payload.recipientName || "").trim();
  if (recipientName.length < 2) throw new AppError("Recipient name is required.", { statusCode: 400, code: "INVALID_RECIPIENT_NAME" });

  const normalizedPhone = normalizePhoneNumber(payload.phoneNumber);
  if (!normalizedPhone) {
    throw new AppError("Enter your mobile number as 03xx-xxxxxxx.", { statusCode: 400, code: "INVALID_PHONE_NUMBER" });
  }

  const address = String(payload.address || "").trim();
  if (address.length < 5) throw new AppError("Enter a complete delivery address.", { statusCode: 400, code: "INVALID_ADDRESS" });

  const items = Array.isArray(payload.items) ? payload.items : [];
  if (!items.length) throw new AppError("Please add at least one product to your order.", { statusCode: 400, code: "EMPTY_ORDER_ITEMS" });

  return {
    idempotencyKey: String(payload.idempotencyKey || "").trim(),
    recipientName,
    phoneNumber: normalizedPhone,
    address,
    items: items.map((item) => {
      if (!item || !item.productId) throw new AppError("Each order item must include a product ID.", { statusCode: 400, code: "INVALID_ITEM" });
      if (!mongoose.isValidObjectId(item.productId)) throw new AppError("One or more product IDs are invalid.", { statusCode: 400, code: "INVALID_PRODUCT_ID" });
      const quantity = Number(item.quantity);
      if (!Number.isInteger(quantity) || quantity < 1 || quantity > 99) throw new AppError("Each product quantity must be between 1 and 99.", { statusCode: 400, code: "INVALID_QUANTITY" });
      return { productId: String(item.productId), quantity };
    }),
  };
};

export const listOrders = (userId) => Order.find({ user: userId }).sort({ createdAt: -1 }).lean();

export const getOrder = async (userId, orderNumber) => {
  const order = await Order.findOne({ user: userId, orderNumber }).lean();
  if (!order) throw new AppError("Order not found.", { statusCode: 404, code: "ORDER_NOT_FOUND" });
  return order;
};

export const listOrdersForAdmin = async (filters = {}) => {
  const query = {};
  const page = Math.max(1, Number(filters.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(filters.limit) || 20));
  const skip = (page - 1) * limit;

  if (filters.status) query.status = filters.status;
  if (filters.paymentStatus) query.paymentStatus = filters.paymentStatus;
  if (filters.q) {
    const search = String(filters.q).trim();
    if (search) {
      query.$or = [
        { orderNumber: { $regex: search, $options: "i" } },
        { recipientName: { $regex: search, $options: "i" } },
        { customerEmail: { $regex: search, $options: "i" } },
        { phoneNumber: { $regex: search, $options: "i" } },
      ];
    }
  }

  if (filters.fromDate || filters.toDate) {
    query.createdAt = {};
    if (filters.fromDate) query.createdAt.$gte = new Date(filters.fromDate);
    if (filters.toDate) query.createdAt.$lte = new Date(filters.toDate);
  }

  const total = await Order.countDocuments(query);
  const items = await Order.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean();

  return {
    items,
    pagination: {
      page,
      limit,
      total,
      pages: Math.max(1, Math.ceil(total / limit)),
    },
  };
};

export const updateOrderStatus = async (orderId, adminUser, payload = {}) => {
  const order = await Order.findById(orderId);
  if (!order) throw new AppError("Order not found.", { statusCode: 404, code: "ORDER_NOT_FOUND" });

  const nextStatus = payload.status;
  if (nextStatus) {
    const validStatuses = ["placed", "confirmed", "processing", "shipped", "delivered", "cancelled", "returned"];
    if (!validStatuses.includes(nextStatus)) {
      throw new AppError("The order status is invalid.", { statusCode: 400, code: "INVALID_ORDER_STATUS" });
    }
    order.status = nextStatus;
    order.statusHistory.push({ status: nextStatus, changedBy: adminUser?._id || adminUser?.id || null, note: payload.note || "Admin status update", at: new Date() });
  }

  if (payload.paymentStatus) {
    const valid = ["pending", "collected", "failed", "refunded"];
    if (!valid.includes(payload.paymentStatus)) {
      throw new AppError("The payment status is invalid.", { statusCode: 400, code: "INVALID_PAYMENT_STATUS" });
    }
    order.paymentStatus = payload.paymentStatus;
    order.paymentHistory.push({ status: payload.paymentStatus, changedBy: adminUser?._id || adminUser?.id || null, note: payload.note || "Payment status update", at: new Date() });
  }

  if (payload.note && !nextStatus && !payload.paymentStatus) {
    order.adminNotes.push({ text: payload.note, author: adminUser?._id || adminUser?.id || null, createdAt: new Date() });
  }

  if (payload.note && (nextStatus || payload.paymentStatus)) {
    order.adminNotes.push({ text: payload.note, author: adminUser?._id || adminUser?.id || null, createdAt: new Date() });
  }

  await order.save();
  return order.toObject();
};

export const createCheckoutOrder = async (userId, userEmail, payload = {}) => {
  const validated = validateOrderInputs(payload);
  const duplicate = validated.idempotencyKey
    ? await Order.findOne({ user: userId, idempotencyKey: validated.idempotencyKey }).lean()
    : null;
  if (duplicate) return duplicate;

  const uniqueProductIds = [...new Set(validated.items.map((item) => item.productId))];
  const productDocs = await Product.find({ _id: { $in: uniqueProductIds }, status: "published" }).lean();
  if (productDocs.length !== uniqueProductIds.length) {
    throw new AppError("One or more products are unavailable or no longer published.", { statusCode: 409, code: "PRODUCT_UNAVAILABLE" });
  }

  const productMap = new Map(productDocs.map((product) => [product._id.toString(), product]));
  const shippingFeeMinor = Number(env.SHIPPING_FEE_MINOR || 0);
  const taxRatePercent = Number(env.TAX_RATE_PERCENT || 0);
  const itemSnapshots = [];

  for (const item of validated.items) {
    const product = productMap.get(item.productId);
    if (!product) throw new AppError("One or more products are unavailable.", { statusCode: 409, code: "PRODUCT_UNAVAILABLE" });

    if (product.trackInventory && product.availablePieces < item.quantity) {
      throw new AppError(`Only ${product.availablePieces} units of ${product.name} are available.`, { statusCode: 409, code: "INSUFFICIENT_STOCK", details: { productId: item.productId, availableQuantity: product.availablePieces } });
    }

    const unitPriceMinor = Number(product.priceMinor || 0);
    const discountPercent = Number(product.discountPercent || 0);
    const discountedUnitPriceMinor = Math.round(unitPriceMinor * (100 - discountPercent) / 100);
    const lineSubtotalMinor = unitPriceMinor * item.quantity;
    const lineDiscountMinor = lineSubtotalMinor - discountedUnitPriceMinor * item.quantity;
    const lineTotalMinor = discountedUnitPriceMinor * item.quantity;

    itemSnapshots.push({
      product: product._id,
      productName: product.name,
      sku: product.sku || "",
      imageUrl: product.images?.[0]?.secureUrl || "",
      unitPriceMinor,
      discountedUnitPriceMinor,
      quantity: item.quantity,
      discountPercent,
      discountAmountMinor: lineDiscountMinor,
      lineTotalMinor,
    });
  }

  const totals = calculateOrderTotals({
    items: itemSnapshots.map((item) => ({ unitPriceMinor: item.unitPriceMinor, quantity: item.quantity, discountPercent: item.discountPercent })),
    shippingFeeMinor,
    taxRatePercent,
  });

  const orderNumber = `NC-${Date.now().toString(36).toUpperCase()}-${randomBytes(6).toString("hex").toUpperCase()}`;
  const orderPayload = {
    orderNumber,
    idempotencyKey: validated.idempotencyKey || `${userId}:${orderNumber}`,
    user: userId,
    customerEmail: userEmail || "",
    recipientName: validated.recipientName,
    phoneNumber: validated.phoneNumber,
    shipping: {
      address: validated.address,
    },
    paymentMethod: "cod",
    paymentStatus: "pending",
    status: "placed",
    items: itemSnapshots,
    currency: env.STORE_CURRENCY,
    subtotalMinor: totals.subtotalMinor,
    discountAmountMinor: totals.discountAmountMinor,
    shippingFeeMinor: totals.shippingFeeMinor,
    taxMinor: totals.taxMinor,
    totalMinor: totals.totalMinor,
    statusHistory: [{ status: "placed", changedBy: null, note: "Order placed by customer", at: new Date() }],
    paymentHistory: [{ status: "pending", changedBy: null, note: "Cash on delivery pending", at: new Date() }],
    adminNotes: [{
      text: `New COD order ${orderNumber} received from ${validated.recipientName}.`,
      author: null,
      createdAt: new Date(),
    }],
  };

  const session = await mongoose.startSession();

  try {
    let createdOrder = null;
    await session.withTransaction(async () => {
      if (validated.idempotencyKey) {
        const existingIdempotency = await Order.findOne({ user: userId, idempotencyKey: validated.idempotencyKey }).session(session).lean();
        if (existingIdempotency) {
          createdOrder = existingIdempotency;
          return;
        }
      }

      for (const item of itemSnapshots) {
        if (!item.product) continue;
        const product = productMap.get(item.product.toString());
        if (!product || (product.trackInventory && product.availablePieces < item.quantity)) {
          throw new AppError(`Only ${product?.availablePieces ?? 0} units of ${product?.name || "this product"} are available.`, { statusCode: 409, code: "INSUFFICIENT_STOCK" });
        }
        if (product.trackInventory) {
          const result = await Product.updateOne(
            { _id: item.product, status: "published", availablePieces: { $gte: item.quantity } },
            { $inc: { availablePieces: -item.quantity } },
            { session },
          );
          if (result.modifiedCount !== 1) {
            throw new AppError(`Only ${product.availablePieces} units of ${product.name} are available.`, { statusCode: 409, code: "INSUFFICIENT_STOCK", details: { productId: item.product.toString(), availableQuantity: product.availablePieces } });
          }
        }
      }

      const order = new Order(orderPayload);
      await order.save({ session });
      createdOrder = order.toObject();
    });

    if (createdOrder?._id && process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS && env.ADMIN_EMAILS.length) {
      const adminEmails = env.ADMIN_EMAILS || [];
      try {
        const transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: Number(process.env.SMTP_PORT || 587),
          secure: String(process.env.SMTP_SECURE || "false") === "true",
          auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
        });
        await transporter.sendMail({
          from: process.env.SMTP_FROM || process.env.SMTP_USER,
          to: adminEmails,
          subject: `New order received - ${createdOrder.orderNumber}`,
          text: `A new COD order has been placed.\nOrder Number: ${createdOrder.orderNumber}\nCustomer: ${createdOrder.recipientName}\nPhone: ${createdOrder.phoneNumber}\nEmail: ${createdOrder.customerEmail || "N/A"}\nAmount: PKR ${(createdOrder.totalMinor / 100).toFixed(2)}`,
        });
      } catch (error) {
        console.error(`Unable to email admins about order ${createdOrder.orderNumber}:`, error);
      }
    }

    return createdOrder;
  } finally {
    await session.endSession();
  }
};
