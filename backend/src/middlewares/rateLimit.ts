import rateLimit from "express-rate-limit";
import { AppError } from "./errorHandler.ts";

export const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  skipSuccessfulRequests: true,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  handler: (_req, _res, next) => next(new AppError(429, "TOO_MANY_REQUESTS", "Too many login attempts, try again later")),
});
