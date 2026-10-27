import { Router } from "express";

export class AppRoutes {
  static get router(): Router {
    const router = Router();
    router.get("/health", (_req, res) => {
      res.status(200).json({ status: "ok" });
    });
    return router;
  }
}