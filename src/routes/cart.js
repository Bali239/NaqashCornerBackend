import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { validateRequest } from "../middleware/validateRequest.js";
import { cartItemSchema, cartProductIdSchema, updateCartItemSchema } from "../schemas/cart.schema.js";
import * as controller from "../controllers/cartController.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();
router.use(requireAuth);
router.get("/", asyncHandler(controller.get));
router.post("/items", validateRequest({ body: cartItemSchema.shape.body }), asyncHandler(controller.add));
router.patch("/items/:productId", validateRequest({ params: updateCartItemSchema.shape.params, body: updateCartItemSchema.shape.body }), asyncHandler(controller.update));
router.delete("/items/:productId", validateRequest({ params: cartProductIdSchema.shape.params }), asyncHandler(controller.remove));
export default router;
