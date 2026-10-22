import AppError from "../utils/AppError.js";

export const validateRequest = (schemas) => (req, _res, next) => {
  const validated = {};
  for (const [part, schema] of Object.entries(schemas)) {
    const result = schema.safeParse(req[part]);
    if (!result.success) {
      return next(new AppError("Request validation failed.", {
        statusCode: 400,
        code: "VALIDATION_ERROR",
        details: result.error.issues.map(({ path, message, code }) => ({ path: `${part}.${path.join(".")}`, message, code })),
      }));
    }
    validated[part] = result.data;
  }
  req.validated = validated;
  return next();
};
