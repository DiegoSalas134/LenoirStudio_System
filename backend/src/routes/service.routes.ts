import { Router } from "express";
import { ServiceController } from "../controllers/service.controller.js";
import { QuoteController } from "../controllers/quote.controller.js";

const router = Router();

router.get("/", ServiceController.getServices);
router.get("/options", ServiceController.getServiceOptions);
router.get("/:id/pricing", ServiceController.getServicePricing);
router.post("/:id/quote", QuoteController.calculate);
router.get("/:id", ServiceController.getServiceById);
export default router;
