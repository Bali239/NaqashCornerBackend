import * as orders from "../services/OrderService.js";
import { sendSuccessResponse } from "../utils/Response.js";

export const list = async (req, res) => sendSuccessResponse(res, { message: "Orders loaded.", data: await orders.listOrders(req.authUser.id) });
export const get = async (req, res) => sendSuccessResponse(res, { message: "Order loaded.", data: await orders.getOrder(req.authUser.id, req.params.orderNumber) });
export const checkout = async (req, res) => sendSuccessResponse(res, { statusCode: 201, message: "Order created successfully.", data: await orders.createCheckoutOrder(req.authUser.id, req.authUser.email, req.validated.body) });
export const adminList = async (req, res) => sendSuccessResponse(res, { message: "Admin orders loaded.", data: await orders.listOrdersForAdmin(req.query) });
export const updateStatus = async (req, res) => sendSuccessResponse(res, { message: "Order status updated.", data: await orders.updateOrderStatus(req.params.orderId, req.authUser, req.validated.body) });
