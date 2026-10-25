
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

  static async getServiceById(req: Request, res: Response): Promise<void> {
    try {
      const id = Number(req.params.id);

      if (!Number.isInteger(id) || id <= 0) {
        res.status(400).json({
          status: "error",
          message: "El ID debe ser un entero positivo."
        });
        return;
      }

      const service = await ServiceModel.findById(id);

      if (!service) {
        res.status(404).json({
          status: "error",
          message: "Servicio no encontrado."
        });
        return;
      }

      res.status(200).json({
        status: "success",
        data: service
      });
    } catch (error) {
      console.error("Error al consultar el servicio:", error);
      res.status(500).json({
        status: "error",
        message: "No fue posible obtener el servicio."
      });
    }
  }

    static async getServicePricing(
    req: Request,
    res: Response
  ): Promise<void> {
    try {
      const id = Number(req.params.id);

      if (!Number.isInteger(id) || id <= 0) {
        res.status(400).json({
          status: "error",
          message: "El ID debe ser un entero positivo."
        });
        return;
      }

      const service = await ServiceModel.findById(id);

      if (!service) {
        res.status(404).json({
          status: "error",
          message: "Servicio no encontrado."
        });
        return;
      }

      const pricing = await ServiceModel.findPricingByServiceId(id);

      res.status(200).json({
        status: "success",
        data: {
          service,
          techniques: pricing
        }
      });
    } catch (error) {
      console.error("Error al consultar los precios del servicio:", error);

      res.status(500).json({
        status: "error",
        message: "No fue posible obtener los precios del servicio."
      });
    }
  }
}