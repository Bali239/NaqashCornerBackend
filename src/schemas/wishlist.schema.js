import { z } from "zod";

export const wishlistProductIdSchema = z.object({
  params: z.object({ productId: z.string().regex(/^[a-f\d]{24}$/i) }),
});
