import { Server } from "socket.io";
import { createHash } from "node:crypto";
import Session from "../models/Session.js";
import { env } from "../config/env.js";

const hashToken = (value) => createHash("sha256").update(value).digest("hex");

let io;

export const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: env.CLIENT_URL,
      credentials: false,
    },
  });

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.query?.token;
      if (!token || typeof token !== "string") return next(new Error("unauthorized"));
      const session = await Session.findOne({ tokenHash: hashToken(token.trim()), expiresAt: { $gt: new Date() } }).populate("user");
      if (!session?.user) return next(new Error("unauthorized"));
      socket.data.userId = session.user._id.toString();
      socket.data.userRole = session.user.role;
      next();
    } catch (error) {
      next(new Error("unauthorized"));
    }
  });

  io.on("connection", (socket) => {
    const userId = socket.data.userId;
    if (userId) {
      socket.join(`user:${userId}`);
    }
    if (socket.data.userRole === "admin") {
      socket.join("admins");
    }
    socket.on("order:subscribe", (orderId) => {
      if (orderId) socket.join(`order:${orderId}`);
    });
    socket.on("order:unsubscribe", (orderId) => {
      if (orderId) socket.leave(`order:${orderId}`);
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) throw new Error("Socket.IO not initialized");
  return io;
};
