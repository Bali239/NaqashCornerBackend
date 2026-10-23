import { randomBytes } from "node:crypto";
import Cart from "../models/Cart.js";
import Order from "../models/Order.js";
import Product from "../models/Product.js";
import AppError from "../utils/AppError.js";

export const listOrders = (userId) => Order.find({ user: userId }).sort({ createdAt: -1 }).lean();
export const getOrder = async (userId, orderNumber) => {
  const order = await Order.findOne({ user: userId, orderNumber }).lean();
  if (!order) throw new AppError("Order not found.", { statusCode: 404, code: "ORDER_NOT_FOUND" });
  return order;
};
export const createCheckoutOrder = async (userId) => {
  const cart = await Cart.findOne({ user: userId }).populate("items.product");
  if (!cart?.items.length) throw new AppError("Your cart is empty.", { statusCode: 400, code: "EMPTY_CART" });
  const items = [];
  let priceChanged = false;
  for (const entry of cart.items) {
    const product = entry.product;
    if (!product || product.status !== "published") throw new AppError("A cart item is no longer available.", { statusCode: 409, code: "PRODUCT_UNAVAILABLE" });
    if (!Number.isSafeInteger(entry.quantity) || entry.quantity < 1 || entry.quantity > 99) throw new AppError("A cart item has an invalid quantity. Update your cart before checkout.", { statusCode: 409, code: "INVALID_CART_QUANTITY" });
    if (product.trackInventory && product.availablePieces < entry.quantity) throw new AppError(`${product.name} does not have enough stock.`, { statusCode: 409, code: "INSUFFICIENT_STOCK" });
    const unitPriceMinor = Math.round(product.priceMinor * (100 - product.discountPercent) / 100);
    items.push({ product: product._id, name: product.name, slug: product.slug, imageUrl: product.images[0]?.secureUrl || "", unitPriceMinor, quantity: entry.quantity, lineTotalMinor: unitPriceMinor * entry.quantity });
  }
  if (priceChanged) throw new AppError("Product prices have changed. Please review your cart before checkout.", { statusCode: 409, code: "CART_PRICE_CHANGED" });
  const subtotalMinor = items.reduce((sum, item) => sum + item.lineTotalMinor, 0);
  const currency = (await Product.findById(items[0].product).select("currency")).currency;
  if (items.some((item) => item.product.currency && item.product.currency !== currency)) throw new AppError("Your cart contains items with different currencies.", { statusCode: 409, code: "MIXED_CURRENCIES" });
  const orderNumber = `NC-${Date.now().toString(36).toUpperCase()}-${randomBytes(6).toString("hex").toUpperCase()}`;
  const reserved = [];
  let order;
  try {
    for (const item of items) {
      const product = cart.items.find((entry) => entry.product?._id?.toString() === item.product.toString())?.product;
      if (!product?.trackInventory) continue;
      const result = await Product.updateOne({ _id: item.product, status: "published", trackInventory: true, availablePieces: { $gte: item.quantity } }, { $inc: { availablePieces: -item.quantity } });
      if (result.modifiedCount !== 1) throw new AppError(`Only ${product.availablePieces} units of ${product.name} are currently available.`, { statusCode: 409, code: "INSUFFICIENT_STOCK", details: { availableQuantity: product.availablePieces } });
      reserved.push({ productId: item.product, quantity: item.quantity });
    }
    order = await Order.create({ orderNumber, user: userId, items, currency, subtotalMinor, discountMinor: 0, totalMinor: subtotalMinor });
    const cleared = await Cart.updateOne({ _id: cart._id, __v: cart.__v }, { $set: { items: [] }, $inc: { __v: 1 } });
    if (cleared.modifiedCount !== 1) throw new AppError("Your cart changed during checkout. Please review it.", { statusCode: 409, code: "CART_CHANGED" });
    return order;
  } catch (error) {
    if (order?._id) await Order.deleteOne({ _id: order._id }).catch(() => {});
    await Promise.allSettled(reserved.map(({ productId, quantity }) => Product.updateOne({ _id: productId }, { $inc: { availablePieces: quantity } })));
    throw error;
  }
};
