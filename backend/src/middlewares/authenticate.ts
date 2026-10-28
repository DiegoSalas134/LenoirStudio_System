import type { RequestHandler } from "express";
import { AppError } from "./errorHandler.ts";
import { AuthService, COOKIE_NAME } from "../services/auth.service.ts";

export const authenticate: RequestHandler = (req, res, next) => {
  const token = req.cookies?.[COOKIE_NAME];
  if (!token) throw new AppError(401, "UNAUTHENTICATED", "Authentication required");
  res.locals["admin"] = AuthService.verify(token);
  next();
};

export const requireAdmin: RequestHandler = (_req, res, next) => {
  if (res.locals["admin"]?.role !== "admin") throw new AppError(403, "FORBIDDEN", "Forbidden");
  next();
};

// Stops the browser from caching admin responses (back button after logout)
export const noStore: RequestHandler = (_req, res, next) => {
  res.set("Cache-Control", "no-store");
  next();
};