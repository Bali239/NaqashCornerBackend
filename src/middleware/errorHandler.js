import { ZodError } from "zod";
import AppError from "../utils/AppError.js";
import { sendErrorResponse } from "../utils/Response.js";

export const notFoundHandler = (req, _res, next) => {
  next(new AppError(`Route ${req.method} ${req.originalUrl} was not found.`, { statusCode: 404, code: "ROUTE_NOT_FOUND" }));
};

export const errorHandler = (error, req, res, _next) => {
  if (res.headersSent) return;
  if (error instanceof ZodError) {
    return sendErrorResponse(res, {
      statusCode: 400,
      code: "VALIDATION_ERROR",
      message: "Request validation failed.",
      details: error.issues.map(({ path, message, code }) => ({ path: path.join("."), message, code })),
      requestId: req.id,
    });
  }

  if (error?.name === "CastError") {
    return sendErrorResponse(res, { statusCode: 400, code: "INVALID_ID", message: "The supplied identifier is invalid.", requestId: req.id });
  }
  if (error?.name === "ValidationError") {
    return sendErrorResponse(res, { statusCode: 400, code: "VALIDATION_ERROR", message: "The submitted data is invalid.", details: Object.values(error.errors || {}).map((item) => ({ path: item.path, message: "Invalid value." })), requestId: req.id });
  }
  if (error?.code === 11000) {
    return sendErrorResponse(res, { statusCode: 409, code: "DUPLICATE_RESOURCE", message: "A record with this value already exists.", requestId: req.id });
  }
  if (error?.name === "MulterError") {
    const tooLarge = error.code === "LIMIT_FILE_SIZE";
    return sendErrorResponse(res, { statusCode: tooLarge ? 413 : 400, code: tooLarge ? "UPLOAD_TOO_LARGE" : "UPLOAD_ERROR", message: tooLarge ? "An uploaded image exceeds the configured size limit." : error.message, requestId: req.id });
  }
  if (error?.type === "entity.parse.failed") return sendErrorResponse(res, { statusCode: 400, code: "INVALID_JSON", message: "Request body contains invalid JSON.", requestId: req.id });
  if (error?.type === "entity.too.large") return sendErrorResponse(res, { statusCode: 413, code: "REQUEST_TOO_LARGE", message: "Request body exceeds the size limit.", requestId: req.id });

  const known = error instanceof AppError;
  const statusCode = known ? error.statusCode : 500;
  const message = known ? error.message : "An unexpected error occurred.";
  if (!known || statusCode >= 500) console.error({ requestId: req.id, error: error?.message, stack: error?.stack });
  return sendErrorResponse(res, {
    statusCode,
    code: known ? error.code : "INTERNAL_ERROR",
    message,
    details: known ? error.details : undefined,
    requestId: req.id,
  });
};
