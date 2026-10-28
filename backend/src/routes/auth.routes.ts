import { Router } from "express";
import { AuthController } from "../controllers/auth.controller.ts";
import { authenticate, requireAdmin } from "../middlewares/authenticate.ts";
import { loginRateLimiter } from "../middlewares/rateLimit.ts";
import { validate } from "../middlewares/validate.ts";
import { loginValidator } from "../validators/auth.validator.ts";

export class AuthRoutes {
  static get router(): Router {
    const router = Router();
    router.post("/login", loginRateLimiter, loginValidator, validate, AuthController.login);
    router.post("/logout", authenticate, requireAdmin, AuthController.logout);
    router.get("/me", authenticate, requireAdmin, AuthController.me);
    return router;
  }
}