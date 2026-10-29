import { Router } from "express";
import { QuoteController } from "../controllers/quote.controller.ts";
import { validate } from "../middlewares/validate.ts";
import { quoteValidator } from "../validators/quote.validator.ts";

export class QuoteRoutes {
  static get router(): Router {
    const router = Router();
    router.get("/catalog", QuoteController.catalog);
    router.post("/quotes/calculate", quoteValidator, validate, QuoteController.calculate);
    router.post("/quotes", quoteValidator, validate, QuoteController.save);
    return router;
  }

  static get adminRouter(): Router {
    const router = Router();
    router.get("/", QuoteController.list);
    return router;
  }
}