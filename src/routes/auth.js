import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import * as controller from "../controllers/authController.js";

const router = Router();

router.get("/google", asyncHandler(controller.googleAuth));
router.get("/google/callaback", asyncHandler(controller.googleCallback));
router.get("/me", requireAuth, asyncHandler(controller.me));
router.post("/logout", requireAuth, asyncHandler(controller.logout));

export default router;
