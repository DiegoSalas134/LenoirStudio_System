import { Router } from "express";
import { AppointmentController } from "../controllers/appointment.controller.ts";
import { publicWriteLimiter } from "../middlewares/rateLimit.ts";
import { upload } from "../middlewares/upload.ts";
import { validate } from "../middlewares/validate.ts";
import {
  appointmentCodeValidator,
  appointmentListValidator,
  appointmentValidator,
  availabilityValidator,
  confirmValidator,
} from "../validators/appointment.validator.ts";

export class AppointmentRoutes {
  static get router(): Router {
    const router = Router();
    router.get("/availability", availabilityValidator, validate, AppointmentController.availability);
    router.post(
      "/appointments",
      publicWriteLimiter,
      upload.single("receipt"),
      appointmentValidator,
      validate,
      AppointmentController.create,
    );
    return router;
  }
  static get adminRouter(): Router {
    const router = Router();
    router.get("/", appointmentListValidator, validate, AppointmentController.list);
    router.get("/:code/receipt", appointmentCodeValidator, validate, AppointmentController.receipt);
    router.patch("/:code/confirm", confirmValidator, validate, AppointmentController.confirm);
    router.patch("/:code/cancel", appointmentCodeValidator, validate, AppointmentController.cancel);
    return router;
  }
}