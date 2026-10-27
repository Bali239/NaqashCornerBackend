import { Router } from "express";
import multer from "multer";
import { env } from "../config/env.js";
import { optionalAuth, requireAdmin } from "../middleware/auth.js";
import { validateRequest } from "../middleware/validateRequest.js";
import {
  createProductSchema,
  imageIdSchema,
  productIdSchema,
  productIdentifierSchema,
  productImageSchema,
  productListQuerySchema,
  updateProductSchema,
} from "../schemas/product.schema.js";
import * as controller from "../controllers/productController.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: env.MAX_IMAGE_SIZE_BYTES, files: env.MAX_PRODUCT_IMAGES },
  fileFilter: (_req, file, cb) =>
    cb(null, /^image\/(jpeg|png|webp|avif)$/.test(file.mimetype)),
});
router.get(
  "/",
  optionalAuth,
  validateRequest({ query: productListQuerySchema.shape.query }),
  asyncHandler(controller.list),
);
router.get(
  "/:identifier",
  optionalAuth,
  validateRequest({ params: productIdentifierSchema.shape.params }),
  asyncHandler(controller.get),
);
router.post(
  "/",
  requireAdmin,
  validateRequest({ body: createProductSchema.shape.body }),
  asyncHandler(controller.create),
);
router.patch(
  "/:productId",
  requireAdmin,
  validateRequest({
    params: updateProductSchema.shape.params,
    body: updateProductSchema.shape.body,
  }),
  asyncHandler(controller.update),
);
router.delete(
  "/:productId",
  requireAdmin,
  validateRequest({ params: productIdSchema.shape.params }),
  asyncHandler(controller.remove),
);
router.post(
  "/:productId/images",
  requireAdmin,
  upload.array("images", env.MAX_PRODUCT_IMAGES),
  validateRequest({
    params: productImageSchema.shape.params,
    body: productImageSchema.shape.body,
  }),
  asyncHandler(controller.addImages),
);
router.delete(
  "/:productId/images/:imageId",
  requireAdmin,
  validateRequest({ params: imageIdSchema.shape.params }),
  asyncHandler(controller.removeImage),
);

export default router;
