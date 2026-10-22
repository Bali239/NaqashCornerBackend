import { z } from "zod";

const text = (max) => z.string().trim().max(max);
const positiveInt = z.coerce.number().int().min(0).max(1_000_000_000);
const productFields = {
  name: z.string().trim().min(2).max(180),
  slug: z.string().trim().min(2).max(200).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/i).optional(),
  sku: z.string().trim().min(2).max(64).regex(/^[a-zA-Z0-9_-]+$/).optional(),
  description: z.string().trim().min(5).max(12000),
  shortDescription: text(400).optional(),
  categoryId: z.string().regex(/^[a-f\d]{24}$/i, "A valid category ID is required"),
  brand: text(100).optional(),
  tags: z.array(z.string().trim().min(1).max(40)).max(30).optional(),
  attributes: z.array(z.object({ name: z.string().trim().min(1).max(80), value: z.string().trim().min(1).max(300) }).strict()).max(50).optional(),
  priceMinor: positiveInt,
  discountPercent: z.number().int().min(0).max(90).optional(),
  currency: z.string().trim().length(3).toUpperCase().optional(),
  availablePieces: positiveInt,
  trackInventory: z.boolean().optional(),
  status: z.enum(["draft", "published", "archived"]).optional(),
  weightGrams: positiveInt.nullable().optional(),
  dimensionsCm: z.object({ length: positiveInt.nullable(), width: positiveInt.nullable(), height: positiveInt.nullable() }).strict().optional(),
};

export const createProductSchema = z.object({ body: z.object(productFields).strict() });
export const updateProductSchema = z.object({
  params: z.object({ productId: z.string().regex(/^[a-f\d]{24}$/i) }),
  body: z.object(productFields).partial().strict().refine((value) => Object.keys(value).length > 0, "Provide at least one field to update"),
});
export const productIdSchema = z.object({ params: z.object({ productId: z.string().regex(/^[a-f\d]{24}$/i) }) });
export const productImageSchema = z.object({
  params: z.object({ productId: z.string().regex(/^[a-f\d]{24}$/i) }),
  body: z.object({ altText: text(200).optional() }).strict().optional(),
});
export const imageIdSchema = z.object({
  params: z.object({ productId: z.string().regex(/^[a-f\d]{24}$/i), imageId: z.string().regex(/^[a-f\d]{24}$/i) }),
});

const queryBoolean = z.preprocess((value) => {
  if (value === "true") return true;
  if (value === "false") return false;
  return value;
}, z.boolean());

export const productListQuerySchema = z.object({
  query: z.object({
    q: z.string().trim().max(100).optional(),
    category: z.string().trim().max(200).optional(),
    brand: z.string().trim().max(100).optional(),
    tag: z.string().trim().max(40).optional(),
    minPrice: positiveInt.optional(),
    maxPrice: positiveInt.optional(),
    inStock: queryBoolean.optional(),
    discounted: queryBoolean.optional(),
    status: z.enum(["draft", "published", "archived"]).optional(),
    sort: z.enum(["newest", "oldest", "price_asc", "price_desc", "name_asc", "name_desc", "discount_desc"]).default("newest"),
    page: z.coerce.number().int().min(1).max(1_000_000).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
  }).strict(),
});

export const productIdentifierSchema = z.object({ params: z.object({ identifier: z.string().trim().min(1).max(220) }) });
