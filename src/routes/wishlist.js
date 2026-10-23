import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { validateRequest } from "../middleware/validateRequest.js";
import { wishlistProductIdSchema, wishlistQuerySchema } from "../schemas/wishlist.schema.js";
import * as controller from "../controllers/wishlistController.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();
router.use(requireAuth);
router.get("/", validateRequest({ query: wishlistQuerySchema.shape.query }), asyncHandler(controller.get));
router.post("/:productId", validateRequest({ params: wishlistProductIdSchema.shape.params }), asyncHandler(controller.add));
router.delete("/:productId", validateRequest({ params: wishlistProductIdSchema.shape.params }), asyncHandler(controller.remove));

export default router;
