import Product from "../models/Product.js";
import User from "../models/User.js";
import Category from "../models/Category.js";
import AppError from "../utils/AppError.js";

const salePrice = (priceMinor, discountPercent) =>
  Math.round((priceMinor * (100 - discountPercent)) / 100);

export const getWishlist = async (userId, filters = {}) => {
  const {
    q,
    category,
    brand,
    tag,
    minPrice,
    maxPrice,
    inStock,
    discounted,
    sort = "newest",
    page = 1,
    limit = 12,
  } = filters;
  const user = await User.findById(userId).select("wishlist").lean();
  const savedIds = user?.wishlist || [];
  const query = { _id: { $in: savedIds }, status: "published" };
  if (q) query.$text = { $search: q };
  if (brand)
    query.brand = new RegExp(brand.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
  if (tag)
    query.tags = new RegExp(
      `^${tag.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`,
      "i",
    );
  if (category) {
    const categoryFilter = category.match(/^[a-f\\d]{24}$/i)
      ? { _id: category }
      : { slug: category };
    const categoryRecord = await Category.findOne(categoryFilter)
      .select("_id")
      .lean();
    if (!categoryRecord)
      return { items: [], pagination: { page, limit, total: 0, pages: 0 } };
    query.category = categoryRecord._id;
  }
  if (minPrice !== undefined || maxPrice !== undefined)
    query.priceMinor = {
      ...(minPrice !== undefined ? { $gte: minPrice } : {}),
      ...(maxPrice !== undefined ? { $lte: maxPrice } : {}),
    };
  if (inStock === true)
    query.$expr = {
      $or: [
        { $eq: ["$trackInventory", false] },
        { $gt: ["$availablePieces", 0] },
      ],
    };
  if (inStock === false)
    query.$expr = {
      $and: [
        { $eq: ["$trackInventory", true] },
        { $eq: ["$availablePieces", 0] },
      ],
    };
  if (discounted === true) query.discountPercent = { $gt: 0 };
  if (discounted === false) query.discountPercent = 0;

  const sorts = {
    newest: { createdAt: -1 },
    oldest: { createdAt: 1 },
    price_asc: { priceMinor: 1 },
    price_desc: { priceMinor: -1 },
    name_asc: { name: 1 },
    discount_desc: { discountPercent: -1, createdAt: -1 },
  };
  const [items, total] = await Promise.all([
    Product.find(query)
      .sort(q ? { score: { $meta: "textScore" }, ...sorts[sort] } : sorts[sort])
      .skip((page - 1) * limit)
      .limit(limit)
      .populate("category", "name slug")
      .lean(),
    Product.countDocuments(query),
  ]);
  return {
    items: items.map((product) => ({
      ...product,
      salePriceMinor: salePrice(product.priceMinor, product.discountPercent),
    })),
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  };
};

export const addWishlistItem = async (userId, productId) => {
  const product = await Product.findOne({
    _id: productId,
    status: "published",
  }).select("_id");
  if (!product)
    throw new AppError("Product not found.", {
      statusCode: 404,
      code: "PRODUCT_NOT_FOUND",
    });
  await User.updateOne(
    { _id: userId },
    { $addToSet: { wishlist: product._id } },
  );
  return getWishlist(userId);
};

export const removeWishlistItem = async (userId, productId) => {
  await User.updateOne({ _id: userId }, { $pull: { wishlist: productId } });
  return getWishlist(userId);
};
