import { Router } from "express";
import { optionalAuth, requireAdmin } from "../middleware/auth.js";
import { validateRequest } from "../middleware/validateRequest.js";
import {
  categoryIdSchema,
  categoryListQuerySchema,
  createCategorySchema,
  updateCategorySchema,
} from "../schemas/category.schema.js";
import * as controller from "../controllers/categoryController.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();
router.get(
  "/",
  optionalAuth,
  validateRequest({ query: categoryListQuerySchema.shape.query }),
  asyncHandler(controller.list),
);
router.post(
  "/",
  requireAdmin,
  validateRequest({ body: createCategorySchema.shape.body }),
  asyncHandler(controller.create),
);
router.patch(
  "/:categoryId",
  requireAdmin,
  validateRequest({
    params: updateCategorySchema.shape.params,
    body: updateCategorySchema.shape.body,
  }),
  asyncHandler(controller.update),
);
router.delete(
  "/:categoryId",
  requireAdmin,
  validateRequest({ params: categoryIdSchema.shape.params }),
  asyncHandler(controller.remove),
);
export default router;
