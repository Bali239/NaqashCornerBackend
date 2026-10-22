import Cart from "../models/Cart.js";
import Product from "../models/Product.js";
import AppError from "../utils/AppError.js";

const populate = (cart) => cart.populate({ path: "items.product", select: "name slug priceMinor discountPercent currency images availablePieces trackInventory status" });
const calculate = (cart) => {
  const items = cart.items.filter((item) => item.product && item.product.status === "published").map((item) => {
    const unitPriceMinor = Math.round(item.product.priceMinor * (100 - item.product.discountPercent) / 100);
    return { product: item.product, quantity: item.quantity, unitPriceMinor, lineTotalMinor: unitPriceMinor * item.quantity };
  });
  return { id: cart.id, items, subtotalMinor: items.reduce((sum, item) => sum + item.lineTotalMinor, 0), itemCount: items.reduce((sum, item) => sum + item.quantity, 0), currency: items[0]?.product.currency || "PKR" };
};
export const getCart = async (userId) => calculate(await populate(await Cart.findOneAndUpdate({ user: userId }, { $setOnInsert: { user: userId } }, { upsert: true, new: true })));
export const addCartItem = async (userId, productId, quantity) => {
  const product = await Product.findOne({ _id: productId, status: "published" });
  if (!product) throw new AppError("Product not found.", { statusCode: 404, code: "PRODUCT_NOT_FOUND" });
  const cart = await Cart.findOneAndUpdate({ user: userId }, { $setOnInsert: { user: userId } }, { upsert: true, new: true });
  const item = cart.items.find((entry) => entry.product.toString() === productId);
  const nextQuantity = (item?.quantity || 0) + quantity;
  if (product.trackInventory && nextQuantity > product.availablePieces) throw new AppError("Requested quantity exceeds available stock.", { statusCode: 409, code: "INSUFFICIENT_STOCK" });
  if (item) item.quantity = nextQuantity; else cart.items.push({ product: productId, quantity });
  await cart.save();
  return calculate(await populate(cart));
};
export const setCartQuantity = async (userId, productId, quantity) => {
  const product = await Product.findOne({ _id: productId, status: "published" });
  if (!product) throw new AppError("Product not found.", { statusCode: 404, code: "PRODUCT_NOT_FOUND" });
  if (product.trackInventory && quantity > product.availablePieces) throw new AppError("Requested quantity exceeds available stock.", { statusCode: 409, code: "INSUFFICIENT_STOCK" });
  const cart = await Cart.findOne({ user: userId });
  const item = cart?.items.find((entry) => entry.product.toString() === productId);
  if (!item) throw new AppError("Cart item not found.", { statusCode: 404, code: "CART_ITEM_NOT_FOUND" });
  item.quantity = quantity;
  await cart.save();
  return calculate(await populate(cart));
};
export const removeCartItem = async (userId, productId) => {
  const cart = await Cart.findOne({ user: userId });
  if (!cart) return getCart(userId);
  cart.items = cart.items.filter((item) => item.product.toString() !== productId);
  await cart.save();
  return calculate(await populate(cart));
};
