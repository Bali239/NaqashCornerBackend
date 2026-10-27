import Notification from "../models/Notification.js";
import { getIO } from "../lib/socket.js";

export const createOrderNotification = async ({ userId, orderId, orderNumber, title, message }) => {
  const notification = await Notification.create({
    user: userId || null,
    order: orderId || null,
    orderNumber: orderNumber || "",
    title,
    message,
    type: "order",
  });
  try {
    const io = getIO();
    if (userId) io.to(`user:${userId.toString()}`).emit("notification:new", notification.toObject());
    io.to("admins").emit("notification:new", notification.toObject());
  } catch (error) {
    // ignore
  }
  return notification.toObject();
};

export const listNotifications = async ({ userId, isAdmin }) => {
  const query = isAdmin ? { $or: [{ role: "admin" }, { role: "all" }, { user: userId }] } : { user: userId };
  const items = await Notification.find(query).sort({ createdAt: -1 }).limit(50).lean();
  const unreadCount = await Notification.countDocuments({ ...query, read: false });
  return { items, unreadCount };
};

export const markAllRead = async ({ userId, isAdmin }) => {
  const query = isAdmin ? { $or: [{ role: "admin" }, { role: "all" }, { user: userId }] } : { user: userId };
  await Notification.updateMany({ ...query, read: false }, { $set: { read: true, readAt: new Date() } });
  return { success: true };
};

export const markRead = async (notificationId, { userId, isAdmin }) => {
  const query = isAdmin ? { _id: notificationId, $or: [{ role: "admin" }, { role: "all" }, { user: userId }] } : { _id: notificationId, user: userId };
  const notification = await Notification.findOneAndUpdate(query, { $set: { read: true, readAt: new Date() } }, { new: true }).lean();
  return notification;
};
