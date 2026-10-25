import { Router } from "express";
import { ServiceController } from "../controllers/service.controller.js";

const router = Router();

router.get("/", ServiceController.getServices);
router.get("/options", ServiceController.getServiceOptions);
router.get("/:id/pricing", ServiceController.getServicePricing);
router.get("/:id", ServiceController.getServiceById);
export default router;
