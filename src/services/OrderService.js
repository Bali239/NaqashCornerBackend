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
  for (const entry of cart.items) {
    const product = entry.product;
    if (!product || product.status !== "published") throw new AppError("A cart item is no longer available.", { statusCode: 409, code: "PRODUCT_UNAVAILABLE" });
    if (product.trackInventory && product.availablePieces < entry.quantity) throw new AppError(`${product.name} does not have enough stock.`, { statusCode: 409, code: "INSUFFICIENT_STOCK" });
    const unitPriceMinor = Math.round(product.priceMinor * (100 - product.discountPercent) / 100);
    items.push({ product: product._id, name: product.name, slug: product.slug, imageUrl: product.images[0]?.secureUrl || "", unitPriceMinor, quantity: entry.quantity, lineTotalMinor: unitPriceMinor * entry.quantity });
  }
  const subtotalMinor = items.reduce((sum, item) => sum + item.lineTotalMinor, 0);
  const order = await Order.create({ orderNumber: `NC-${Date.now().toString(36).toUpperCase()}-${randomBytes(3).toString("hex").toUpperCase()}`, user: userId, items, currency: items.length ? (await Product.findById(items[0].product).select("currency")).currency : "PKR", subtotalMinor, discountMinor: 0, totalMinor: subtotalMinor });
  return order;
};
