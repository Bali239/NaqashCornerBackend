import { z } from "zod";

export const cartItemSchema = z.object({
  body: z.object({ productId: z.string().regex(/^[a-f\d]{24}$/i), quantity: z.number().int().min(1).max(99) }).strict(),
});
export const updateCartItemSchema = z.object({
  params: z.object({ productId: z.string().regex(/^[a-f\d]{24}$/i) }),
  body: z.object({ quantity: z.number().int().min(1).max(99) }).strict(),
});
export const cartProductIdSchema = z.object({ params: z.object({ productId: z.string().regex(/^[a-f\d]{24}$/i) }) });
