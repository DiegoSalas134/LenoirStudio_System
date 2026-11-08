import { Router } from "express";
import { QuoteController } from "../controllers/quote.controller.ts";
import { publicWriteLimiter } from "../middlewares/rateLimit.ts";
import { parseQuoteField, upload } from "../middlewares/upload.ts";
import { validate } from "../middlewares/validate.ts";
import { quoteCodeValidator, quoteValidator } from "../validators/quote.validator.ts";

export class QuoteRoutes {
  static get router(): Router {
    const router = Router();
    router.get("/catalog", QuoteController.catalog);
    router.post("/quotes/calculate", quoteValidator, validate, QuoteController.calculate);
    router.post(
      "/quotes",
      publicWriteLimiter,
      upload.single("referencePhoto"),
      parseQuoteField,
      quoteValidator,
      validate,
      QuoteController.save,
    );
    return router;
  }

  static get adminRouter(): Router {
    const router = Router();
    router.get("/", QuoteController.list);
    router.get("/:code/photo", quoteCodeValidator, validate, QuoteController.photo);
    return router;
  }
}