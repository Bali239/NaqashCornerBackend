import * as wishlist from "../services/WishlistService.js";
import { sendSuccessResponse } from "../utils/Response.js";

export const get = async (req, res) => sendSuccessResponse(res, {
  message: "Wishlist loaded.",
  data: await wishlist.getWishlist(req.authUser.id, req.validated.query),
});

export const add = async (req, res) => sendSuccessResponse(res, {
  message: "Product added to wishlist.",
  data: await wishlist.addWishlistItem(req.authUser.id, req.validated.params.productId),
});

export const remove = async (req, res) => sendSuccessResponse(res, {
  message: "Product removed from wishlist.",
  data: await wishlist.removeWishlistItem(req.authUser.id, req.validated.params.productId),
});
