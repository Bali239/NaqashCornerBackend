import * as notifications from "../services/NotificationService.js";
import { sendSuccessResponse } from "../utils/Response.js";

export const list = async (req, res) => {
  const isAdmin = req.authUser.role === "admin";
  const data = await notifications.listNotifications({
    userId: req.authUser.id,
    isAdmin,
  });
  return sendSuccessResponse(res, { message: "Notifications loaded.", data });
};

export const markAll = async (req, res) => {
  const isAdmin = req.authUser.role === "admin";
  const data = await notifications.markAllRead({
    userId: req.authUser.id,
    isAdmin,
  });
  return sendSuccessResponse(res, {
    message: "Notifications marked as read.",
    data,
  });
};

export const markOne = async (req, res) => {
  const isAdmin = req.authUser.role === "admin";
  const data = await notifications.markRead(req.params.id, {
    userId: req.authUser.id,
    isAdmin,
  });
  return sendSuccessResponse(res, {
    message: "Notification marked as read.",
    data,
  });
};
