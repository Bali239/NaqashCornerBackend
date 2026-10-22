import * as orders from "../services/OrderService.js";
import { sendSuccessResponse } from "../utils/Response.js";

export const list = async (req, res) => sendSuccessResponse(res, { message: "Orders loaded.", data: await orders.listOrders(req.authUser.id) });
export const get = async (req, res) => sendSuccessResponse(res, { message: "Order loaded.", data: await orders.getOrder(req.authUser.id, req.params.orderNumber) });
export const checkout = async (req, res) => sendSuccessResponse(res, { statusCode: 201, message: "Order created. Payment is not enabled yet.", data: await orders.createCheckoutOrder(req.authUser.id) });
