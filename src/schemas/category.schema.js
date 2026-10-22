import { z } from "zod";

export const createCategorySchema = z.object({
  body: z.object({ name: z.string().trim().min(2).max(100), description: z.string().trim().max(1000).optional(), isActive: z.boolean().optional() }).strict(),
});
export const updateCategorySchema = z.object({
  params: z.object({ categoryId: z.string().regex(/^[a-f\d]{24}$/i) }),
  body: z.object({ name: z.string().trim().min(2).max(100).optional(), description: z.string().trim().max(1000).optional(), isActive: z.boolean().optional() }).strict().refine((value) => Object.keys(value).length > 0, "Provide at least one field to update"),
});
export const categoryIdSchema = z.object({ params: z.object({ categoryId: z.string().regex(/^[a-f\d]{24}$/i) }) });
