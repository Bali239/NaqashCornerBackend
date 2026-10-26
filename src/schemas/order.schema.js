import { z } from "zod";

const orderLineSchema = z.object({
  productId: z.string().trim().min(1, "Product is required."),
  quantity: z.coerce.number().int().min(1).max(99, "Quantity must be between 1 and 99."),
});

export const orderCreateSchema = z.object({
  idempotencyKey: z.string().trim().min(1).max(128).optional(),
  recipientName: z.string().trim().min(2, "Recipient name is required.").max(120),
  phoneNumber: z.string().trim().regex(/^03\d{2}-\d{7}$/, "Enter your mobile number as 03xx-xxxxxxx."),
  address: z.string().trim().min(5, "Enter a complete delivery address.").max(300),
  items: z.array(orderLineSchema).min(1, "Please add at least one product."),
});

export const orderStatusUpdateSchema = z.object({
  status: z.enum(["placed", "confirmed", "processing", "shipped", "delivered", "cancelled", "returned"]).optional(),
  paymentStatus: z.enum(["pending", "collected", "failed", "refunded"]).optional(),
  note: z.string().trim().max(500).optional(),
});
