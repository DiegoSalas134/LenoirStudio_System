import type { RequestHandler } from "express";
import { validationResult } from "express-validator";
import { AppError } from "./errorHandler.ts";

export const validate: RequestHandler = (req, _res, next) => {
  const result = validationResult(req);
  if (result.isEmpty()) {
    next();
    return;
  }
  const message = result.array().map((e) => e.msg).join(", ");
  next(new AppError(400, "VALIDATION_ERROR", message));
};