import { Router } from "express";
import { ServiceController } from "../controllers/service.controller.js";

const router = Router();

router.get("/", ServiceController.getServices);
router.get("/:id", ServiceController.getServiceById);
export default router;
