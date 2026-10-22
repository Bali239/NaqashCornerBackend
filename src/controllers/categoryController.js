import * as categories from "../services/CategoryService.js";
import { sendSuccessResponse } from "../utils/Response.js";

export const list = async (req, res) => sendSuccessResponse(res, { message: "Categories loaded.", data: await categories.listCategories({ all: req.authUser?.role === "admin" }) });
export const create = async (req, res) => sendSuccessResponse(res, { statusCode: 201, message: "Category created.", data: await categories.createCategory(req.validated.body) });
export const update = async (req, res) => sendSuccessResponse(res, { message: "Category updated.", data: await categories.updateCategory(req.validated.params.categoryId, req.validated.body) });
export const remove = async (req, res) => sendSuccessResponse(res, { message: "Category deleted.", data: await categories.deleteCategory(req.validated.params.categoryId) });
