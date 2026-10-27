import * as products from "../services/ProductService.js";
import { sendSuccessResponse } from "../utils/Response.js";

export const list = async (req, res) =>
  sendSuccessResponse(res, {
    message: "Products loaded.",
    data: await products.listProducts(req.validated.query, {
      includeHidden: req.authUser?.role === "admin",
    }),
  });
export const get = async (req, res) =>
  sendSuccessResponse(res, {
    message: "Product loaded.",
    data: await products.getProduct(req.validated.params.identifier, {
      includeHidden: req.authUser?.role === "admin",
    }),
  });
export const create = async (req, res) =>
  sendSuccessResponse(res, {
    statusCode: 201,
    message: "Product created.",
    data: await products.createProduct(req.validated.body),
  });
export const update = async (req, res) =>
  sendSuccessResponse(res, {
    message: "Product updated.",
    data: await products.updateProduct(
      req.validated.params.productId,
      req.validated.body,
    ),
  });
export const remove = async (req, res) =>
  sendSuccessResponse(res, {
    message: "Product deleted.",
    data: await products.deleteProduct(req.validated.params.productId),
  });
export const addImages = async (req, res) =>
  sendSuccessResponse(res, {
    statusCode: 201,
    message: "Product images uploaded.",
    data: await products.addProductImages(
      req.validated.params.productId,
      req.files,
      req.body.altText || "",
    ),
  });
export const removeImage = async (req, res) =>
  sendSuccessResponse(res, {
    message: "Product image deleted.",
    data: await products.removeProductImage(
      req.validated.params.productId,
      req.validated.params.imageId,
    ),
  });
