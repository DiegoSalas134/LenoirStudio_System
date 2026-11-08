import type { Request, Response } from "express";
import { AvailabilityService } from "../services/availability.service.ts";
import { BookingService } from "../services/booking.service.ts";

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
}