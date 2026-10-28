import { Router } from "express";
import { noStore } from "../middlewares/authenticate.ts";
import { AuthRoutes } from "./auth.routes.ts";
import { QuoteRoutes } from "./quote.routes.ts";

export class AppRoutes {
  static get router(): Router {
    const router = Router();
    router.get("/health", (_req, res) => {
      res.status(200).json({ status: "ok" });
    });
    router.use("/admin", noStore);
    router.use("/admin/auth", AuthRoutes.router);
    router.use("/", QuoteRoutes.router);
    return router;
  }
}