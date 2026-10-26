import { Router } from "express";
import { requireAdmin, requireAuth } from "../middleware/auth.js";
import { validateRequest } from "../middleware/validateRequest.js";
import { orderCreateSchema, orderStatusUpdateSchema } from "../schemas/order.schema.js";
import * as controller from "../controllers/orderController.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();
router.use(requireAuth);
router.get("/", asyncHandler(controller.list));
router.post("/", validateRequest({ body: orderCreateSchema }), asyncHandler(controller.checkout));
router.post("/checkout", validateRequest({ body: orderCreateSchema }), asyncHandler(controller.checkout));
router.get("/admin", requireAdmin, asyncHandler(controller.adminList));
router.get("/:orderNumber", asyncHandler(controller.get));
router.patch("/:orderId/status", requireAdmin, validateRequest({ body: orderStatusUpdateSchema }), asyncHandler(controller.updateStatus));
export default router;
