import Product from "../models/Product.js";
import User from "../models/User.js";
import AppError from "../utils/AppError.js";

const salePrice = (priceMinor, discountPercent) => Math.round(priceMinor * (100 - discountPercent) / 100);

export const getWishlist = async (userId) => {
  const user = await User.findById(userId).populate({
    path: "wishlist",
    match: { status: "published" },
    populate: { path: "category", select: "name slug" },
  }).lean();
  return (user?.wishlist || []).filter(Boolean).map((product) => ({
    ...product,
    salePriceMinor: salePrice(product.priceMinor, product.discountPercent),
  }));
};

export const addWishlistItem = async (userId, productId) => {
  const product = await Product.findOne({ _id: productId, status: "published" }).select("_id");
  if (!product) throw new AppError("Product not found.", { statusCode: 404, code: "PRODUCT_NOT_FOUND" });
  await User.updateOne({ _id: userId }, { $addToSet: { wishlist: product._id } });
  return getWishlist(userId);
};

export const removeWishlistItem = async (userId, productId) => {
  await User.updateOne({ _id: userId }, { $pull: { wishlist: productId } });
  return getWishlist(userId);
};
