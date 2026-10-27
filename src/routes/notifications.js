import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import * as controller from "../controllers/notificationController.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();
router.use(requireAuth);
router.get("/", asyncHandler(controller.list));
router.post("/mark-all-read", asyncHandler(controller.markAll));
router.post("/:id/read", asyncHandler(controller.markOne));
export default router;
