import Category from "../models/Category.js";
import Product from "../models/Product.js";
import AppError from "../utils/AppError.js";

const slugify = (value) => value.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
export const listCategories = ({ all = false } = {}) => Category.find(all ? {} : { isActive: true }).sort({ name: 1 }).lean();
export const createCategory = async ({ name, ...input }) => Category.create({ name, slug: slugify(name), ...input });
export const updateCategory = async (id, input) => {
  const category = await Category.findById(id);
  if (!category) throw new AppError("Category not found.", { statusCode: 404, code: "CATEGORY_NOT_FOUND" });
  if (input.name && input.name !== category.name) { category.name = input.name; category.slug = slugify(input.name); }
  if (input.description !== undefined) category.description = input.description;
  if (input.isActive !== undefined) category.isActive = input.isActive;
  await category.save();
  return category;
};
export const deleteCategory = async (id) => {
  const [category, productCount] = await Promise.all([Category.findById(id), Product.countDocuments({ category: id })]);
  if (!category) throw new AppError("Category not found.", { statusCode: 404, code: "CATEGORY_NOT_FOUND" });
  if (productCount) throw new AppError("Move or delete this category's products before deleting it.", { statusCode: 409, code: "CATEGORY_IN_USE" });
  await category.deleteOne();
  return category;
};
