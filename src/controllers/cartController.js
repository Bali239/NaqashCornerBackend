import * as carts from "../services/CartService.js";
import { sendSuccessResponse } from "../utils/Response.js";

export const get = async (req, res) => sendSuccessResponse(res, { message: "Cart loaded.", data: await carts.getCart(req.authUser.id) });
export const add = async (req, res) => sendSuccessResponse(res, { statusCode: 201, message: "Cart updated.", data: await carts.addCartItem(req.authUser.id, req.validated.body.productId, req.validated.body.quantity) });
export const update = async (req, res) => sendSuccessResponse(res, { message: "Cart updated.", data: await carts.setCartQuantity(req.authUser.id, req.validated.params.productId, req.validated.body.quantity) });
export const remove = async (req, res) => sendSuccessResponse(res, { message: "Cart item removed.", data: await carts.removeCartItem(req.authUser.id, req.validated.params.productId) });
