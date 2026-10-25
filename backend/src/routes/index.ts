import { Router } from "express";
import serviceRoutes from "./service.routes.js";

export class AppRoutes {
  static get router(): Router {
    const router = Router();

    router.get("/health", (_req, res) => {
      res.status(200).json({
        status: "ok",
        message: "LenoirStudio API funcionando correctamente"
      });
    });

    router.use("/services", serviceRoutes);

    return router;
  }
}
