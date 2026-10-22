export const sendSuccessResponse = (res, { statusCode = 200, message = "Success", data = null, meta } = {}) => {
  const body = { success: true, message, data };
  if (meta !== undefined) body.meta = meta;
  return res.status(statusCode).json(body);
};

export const sendErrorResponse = (res, { statusCode = 500, message = "Internal server error", code = "INTERNAL_ERROR", details, requestId } = {}) => {
  const body = { success: false, message, code };
  if (details !== undefined) body.details = details;
  if (requestId) body.requestId = requestId;
  return res.status(statusCode).json(body);
};
