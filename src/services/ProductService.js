import Product from "../models/Product.js";
import Category from "../models/Category.js";
import { env } from "../config/env.js";
import AppError from "../utils/AppError.js";
import { deleteImage, uploadImage } from "./CloudinaryService.js";

const slugify = (value) => value.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
const getCategory = async (id) => {
  const category = await Category.findOne({ _id: id, isActive: true });
  if (!category) throw new AppError("Category was not found or is inactive.", { statusCode: 400, code: "INVALID_CATEGORY" });
  return category;
};
const availableSlug = async (name, excludeId) => {
  const base = slugify(name) || "product";
  let slug = base;
  let suffix = 2;
  while (await Product.exists({ slug, ...(excludeId ? { _id: { $ne: excludeId } } : {}) })) slug = `${base}-${suffix++}`;
  return slug;
};
const discountPrice = (price, percent) => Math.round(price * (100 - percent) / 100);

export const listProducts = async (filters, { includeHidden = false } = {}) => {
  const { q, category, brand, tag, minPrice, maxPrice, inStock, discounted, status, sort, page, limit } = filters;
  const query = includeHidden ? {} : { status: "published" };
  if (includeHidden && status) query.status = status;
  if (q) query.$text = { $search: q };
  if (brand) query.brand = new RegExp(brand.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
  if (tag) query.tags = tag;
  if (category) {
    const cat = await Category.findOne({ $or: [{ _id: category.match(/^[a-f\d]{24}$/i) ? category : null }, { slug: category }], ...(includeHidden ? {} : { isActive: true }) }).select("_id");
    if (!cat) return { items: [], pagination: { page, limit, total: 0, pages: 0 } };
    query.category = cat._id;
  }
  if (minPrice !== undefined || maxPrice !== undefined) query.priceMinor = { ...(minPrice !== undefined ? { $gte: minPrice } : {}), ...(maxPrice !== undefined ? { $lte: maxPrice } : {}) };
  if (inStock === true) query.$expr = { $or: [{ $eq: ["$trackInventory", false] }, { $gt: ["$availablePieces", 0] }] };
  if (inStock === false) query.$expr = { $and: [{ $eq: ["$trackInventory", true] }, { $eq: ["$availablePieces", 0] }] };
  if (discounted === true) query.discountPercent = { $gt: 0 };
  if (discounted === false) query.discountPercent = 0;
  const sorts = { newest: { createdAt: -1 }, oldest: { createdAt: 1 }, price_asc: { priceMinor: 1 }, price_desc: { priceMinor: -1 }, name_asc: { name: 1 }, name_desc: { name: -1 }, discount_desc: { discountPercent: -1, createdAt: -1 } };
  const [items, total] = await Promise.all([
    Product.find(query).sort(q ? { score: { $meta: "textScore" }, ...sorts[sort] } : sorts[sort]).skip((page - 1) * limit).limit(limit).populate("category", "name slug").lean(),
    Product.countDocuments(query),
  ]);
  return { items: items.map((p) => ({ ...p, salePriceMinor: discountPrice(p.priceMinor, p.discountPercent) })), pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
};

export const getProduct = async (identifier, { includeHidden = false } = {}) => {
  const query = { ...(includeHidden ? {} : { status: "published" }) };
  query[identifier.match(/^[a-f\d]{24}$/i) ? "_id" : "slug"] = identifier;
  const product = await Product.findOne(query).populate("category", "name slug").lean();
  if (!product) throw new AppError("Product not found.", { statusCode: 404, code: "PRODUCT_NOT_FOUND" });
  return { ...product, salePriceMinor: discountPrice(product.priceMinor, product.discountPercent) };
};

export const createProduct = async (input) => {
  await getCategory(input.categoryId);
  const { categoryId, ...fields } = input;
  fields.slug = input.slug ? slugify(input.slug) : await availableSlug(input.name);
  fields.category = categoryId;
  fields.currency = input.currency || env.STORE_CURRENCY;
  return Product.create(fields);
};
export const updateProduct = async (id, input) => {
  const product = await Product.findById(id);
  if (!product) throw new AppError("Product not found.", { statusCode: 404, code: "PRODUCT_NOT_FOUND" });
  if (input.categoryId) { await getCategory(input.categoryId); product.category = input.categoryId; }
  const { categoryId, ...fields } = input;
  Object.assign(product, fields);
  if (input.name && !input.slug) product.slug = await availableSlug(input.name, id);
  if (input.slug) product.slug = slugify(input.slug);
  await product.save();
  return product;
};
export const deleteProduct = async (id) => {
  const product = await Product.findByIdAndDelete(id);
  if (!product) throw new AppError("Product not found.", { statusCode: 404, code: "PRODUCT_NOT_FOUND" });
  await Promise.allSettled(product.images.map(({ publicId }) => deleteImage(publicId)));
  return product;
};
export const addProductImages = async (id, files, altText = "") => {
  const product = await Product.findById(id);
  if (!product) throw new AppError("Product not found.", { statusCode: 404, code: "PRODUCT_NOT_FOUND" });
  if (!files?.length) throw new AppError("Choose at least one image.", { statusCode: 400, code: "NO_IMAGES" });
  if (product.images.length + files.length > env.MAX_PRODUCT_IMAGES) throw new AppError(`A product can have at most ${env.MAX_PRODUCT_IMAGES} images.`, { statusCode: 400, code: "IMAGE_LIMIT" });
  const uploaded = [];
  try {
    for (const file of files) uploaded.push({ ...(await uploadImage(file)), altText, sortOrder: product.images.length + uploaded.length });
    product.images.push(...uploaded);
    await product.save();
    return product;
  } catch (error) {
    await Promise.allSettled(uploaded.map(({ publicId }) => deleteImage(publicId)));
    throw error;
  }
};
export const removeProductImage = async (productId, imageId) => {
  const product = await Product.findById(productId);
  if (!product) throw new AppError("Product not found.", { statusCode: 404, code: "PRODUCT_NOT_FOUND" });
  const image = product.images.id(imageId);
  if (!image) throw new AppError("Product image not found.", { statusCode: 404, code: "IMAGE_NOT_FOUND" });
  const publicId = image.publicId;
  image.deleteOne();
  await product.save();
  await deleteImage(publicId);
  return product;
};
