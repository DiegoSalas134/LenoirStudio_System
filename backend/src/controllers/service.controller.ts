import type { Request, Response } from "express";
import { ServiceModel } from "../models/service.model.js";

export class ServiceController {
  static async getServices(_req: Request, res: Response): Promise<void> {
    try {
      const services = await ServiceModel.findAll();

      res.status(200).json({
        status: "success",
        data: services
      });
    } catch (error) {
      console.error("Error al consultar los servicios:", error);

      res.status(500).json({
        status: "error",
        message: "No fue posible obtener los servicios."
      });
    }
  }
}
