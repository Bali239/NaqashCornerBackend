import { z } from "zod";

export const wishlistProductIdSchema = z.object({
  params: z.object({ productId: z.string().regex(/^[a-f\d]{24}$/i) }),
});

const queryBoolean = z.preprocess((value) => {
  if (value === "true") return true;
  if (value === "false") return false;
  return value;
}, z.boolean());

export const wishlistQuerySchema = z.object({
  query: z.object({
    q: z.string().trim().max(100).optional(),
    category: z.string().trim().max(200).optional(),
    brand: z.string().trim().max(100).optional(),
    tag: z.string().trim().max(40).optional(),
    minPrice: z.coerce.number().int().min(0).max(1_000_000_000).optional(),
    maxPrice: z.coerce.number().int().min(0).max(1_000_000_000).optional(),
    inStock: queryBoolean.optional(),
    discounted: queryBoolean.optional(),
    sort: z.enum(["newest", "oldest", "price_asc", "price_desc", "discount_desc", "name_asc"]).default("newest"),
    page: z.coerce.number().int().min(1).max(1_000_000).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(12),
  }).strict(),
});
