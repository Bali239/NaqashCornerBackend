import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().min(1).max(65535).default(5000),
  MONGO_URI: z.string().trim().min(1, "MONGO_URI is required").refine((value) => value.startsWith("mongodb://") || value.startsWith("mongodb+srv://"), "MONGO_URI must use mongodb:// or mongodb+srv://"),
  CLIENT_URL: z.string().trim().url("CLIENT_URL must be an absolute URL"),
  GOOGLE_CLIENT_ID: z.string().trim().min(1, "GOOGLE_CLIENT_ID is required"),
  GOOGLE_CLIENT_SECRET: z.string().trim().min(1, "GOOGLE_CLIENT_SECRET is required"),
  GOOGLE_REDIRECT_URI: z.string().trim().url("GOOGLE_REDIRECT_URI must be an absolute URL"),
  CLOUDINARY_CLOUD_NAME: z.string().trim().min(1, "CLOUDINARY_CLOUD_NAME is required"),
  CLOUDINARY_API_KEY: z.string().trim().min(1, "CLOUDINARY_API_KEY is required"),
  CLOUDINARY_API_SECRET: z.string().trim().min(1, "CLOUDINARY_API_SECRET is required"),
  ADMIN_EMAILS: z.string().trim().min(1, "Add at least one email to ADMIN_EMAILS").refine((value) => value.split(",").every((email) => z.email().safeParse(email.trim()).success), "ADMIN_EMAILS must be a comma-separated list of valid emails"),
  STORE_CURRENCY: z.string().trim().length(3).default("PKR"),
  SESSION_TTL_DAYS: z.coerce.number().int().min(1).max(90).default(7),
  MAX_IMAGE_SIZE_BYTES: z.coerce.number().int().min(1024).max(20 * 1024 * 1024).default(5 * 1024 * 1024),
  MAX_PRODUCT_IMAGES: z.coerce.number().int().min(1).max(20).default(8),
}).superRefine((values, context) => {
  const callback = new URL(values.GOOGLE_REDIRECT_URI);
  if (callback.pathname !== "/api/auth/google/callaback") {
    context.addIssue({ code: "custom", path: ["GOOGLE_REDIRECT_URI"], message: "Must end with /api/auth/google/callaback" });
  }
});

const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  const formatted = parsed.error.issues.map(({ path, message }) => `  - ${path.join(".")}: ${message}`).join("\n");
  const setupHint = process.env.RENDER
    ? "Set the values in your Render service's Environment settings, then redeploy. .env.example is only a template and is not loaded by Render."
    : "For local development, copy server/.env.example to server/.env and set the values there.";
  throw new Error(`Invalid server environment configuration:\n${formatted}\n${setupHint}\nSecret values are not printed.`);
}

export const env = Object.freeze({
  ...parsed.data,
  ADMIN_EMAILS: parsed.data.ADMIN_EMAILS.split(",").map((email) => email.trim().toLowerCase()).filter(Boolean),
});
