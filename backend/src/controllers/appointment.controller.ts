import type { Request, Response } from "express";
import { AvailabilityService } from "../services/availability.service.ts";
import { BookingService } from "../services/booking.service.ts";
import { AppointmentService } from "../services/appointment.service.ts";
import type { AppointmentStatus } from "../models/Appointment.model.ts";

export class AppointmentController {
  static availability = async (req: Request, res: Response): Promise<void> => {
    const { from, to } = req.query as { from: string; to: string };
    res.status(200).json(await AvailabilityService.getAvailability(from, to));
  };

  static create = async (req: Request, res: Response): Promise<void> => {
    const { name, phone, quoteCode, slotStart } = req.body;
    const appointment = await BookingService.create({ name, phone, quoteCode, slotStart }, req.file);
    res.status(201).json(appointment);
  };

  static list = async (req: Request, res: Response): Promise<void> => {
    const status = req.query["status"] as AppointmentStatus | undefined;
    res.status(200).json(await AppointmentService.list(status));
  };

  static confirm = async (req: Request, res: Response): Promise<void> => {
    const { finalTotal, depositAmount } = req.body;
    res.status(200).json(await AppointmentService.confirm(String(req.params["code"]), { finalTotal, depositAmount }));
  };

  static cancel = async (req: Request, res: Response): Promise<void> => {
    res.status(200).json(await AppointmentService.cancel(String(req.params["code"])));
  };

  static receipt = async (req: Request, res: Response): Promise<void> => {
    const filePath = await AppointmentService.getReceiptPath(String(req.params["code"]));
    res.sendFile(filePath, (error) => {
      if (error && !res.headersSent) res.status(404).json({ error: { code: "NOT_FOUND", message: "Receipt not found" } });
    });
  };
}