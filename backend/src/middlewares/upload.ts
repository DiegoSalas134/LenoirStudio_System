import type { RequestHandler } from "express";
import multer from "multer";
import { AppError } from "./errorHandler.ts";

export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1, fields: 5 },
});

export const parseQuoteField: RequestHandler = (req, _res, next) => {
  let parsed: unknown;
  try {
    parsed = JSON.parse(req.body?.quote ?? "");
  } catch {
    throw new AppError(400, "INVALID_QUOTE", "quote must be a valid JSON string");
  }
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    throw new AppError(400, "INVALID_QUOTE", "quote must be a JSON object");
  }
  req.body = parsed;
  next();
};