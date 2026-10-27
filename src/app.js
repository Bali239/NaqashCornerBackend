import { randomUUID } from "node:crypto";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import { env } from "./config/env.js";
import authRouter from "./routes/auth.js";
import productsRouter from "./routes/products.js";
import categoriesRouter from "./routes/categories.js";
import cartRouter from "./routes/cart.js";
import ordersRouter from "./routes/orders.js";
import wishlistRouter from "./routes/wishlist.js";
import notificationsRouter from "./routes/notifications.js";
import { notFoundHandler, errorHandler } from "./middleware/errorHandler.js";
import { sendSuccessResponse } from "./utils/Response.js";

const app = express();
app.disable("x-powered-by");
app.use((req, res, next) => {
  req.id = req.get("x-request-id")?.slice(0, 100) || randomUUID();
  res.setHeader("X-Request-Id", req.id);
  next();
});
app.use(helmet());
app.use(
  cors({
    origin: env.CLIENT_URL,
    credentials: false,
    allowedHeaders: ["Content-Type", "Authorization", "X-Request-Id"],
  }),
);
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: false, limit: "1mb" }));
app.use("/api/auth", authRouter);
app.use("/api/products", productsRouter);
app.use("/api/categories", categoriesRouter);
app.use("/api/cart", cartRouter);
app.use("/api/orders", ordersRouter);
app.use("/api/wishlist", wishlistRouter);
app.use("/api/notifications", notificationsRouter);
app.get("/health", (_req, res) =>
  sendSuccessResponse(res, {
    message: "Server is healthy.",
    data: { status: "ok" },
  }),
);
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
