import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import * as controller from "../controllers/orderController.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();
router.use(requireAuth);
router.get("/", asyncHandler(controller.list));
router.post("/checkout", asyncHandler(controller.checkout));
router.get("/:orderNumber", asyncHandler(controller.get));
export default router;
