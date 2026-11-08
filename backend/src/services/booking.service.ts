import { UniqueConstraintError } from "sequelize";
import { sequelize } from "../config/sequelize.connection.ts";
import { Appointment, Customer, Quote } from "../models/index.ts";
import { AppError } from "../middlewares/errorHandler.ts";
import { AvailabilityService } from "./availability.service.ts";
import { FileService } from "./file.service.ts";

export interface BookingInput {
  name: string;
  phone: string;
  quoteCode: string;
  slotStart: string;
}

const slotTaken = () => new AppError(409, "SLOT_TAKEN", "That time block is no longer available");

export class BookingService {
  static async create(input: BookingInput, receipt: Express.Multer.File | undefined) {
    const quote = await Quote.findOne({ where: { code: input.quoteCode } });
    if (!quote) throw new AppError(404, "NOT_FOUND", "Quote not found");
    if (await Appointment.findOne({ where: { quoteId: quote.id } })) {
      throw new AppError(409, "QUOTE_ALREADY_BOOKED", "This quote already has an appointment");
    }

    const start = new Date(input.slotStart);
    const slot = AvailabilityService.findSlot(start);
    if (!slot) throw new AppError(400, "INVALID_SLOT", "slotStart must be one of the studio's 3-hour blocks");
    if (!AvailabilityService.inBookingWindow(start)) {
      throw new AppError(400, "OUT_OF_WINDOW", "Appointments can be booked from 24 hours up to 14 days ahead");
    }

    const receiptName = await FileService.saveImage(receipt, "receipt");
    try {
      return await sequelize.transaction(async (transaction) => {
        if (!(await AvailabilityService.isSlotFree(slot, transaction))) throw slotTaken();

        // The phone number identifies the customer: reuse the row if it already exists
        const [customer] = await Customer.findOrCreate({
          where: { phone: input.phone },
          defaults: { name: input.name, phone: input.phone },
          transaction,
        });
        if (customer.name !== input.name) await customer.update({ name: input.name }, { transaction });

        const appointment = await Appointment.create(
          {
            customerId: customer.id,
            quoteId: quote.id,
            slotStart: slot.start,
            slotEnd: slot.end,
            activeSlot: slot.start,
            status: "PENDING",
            estimatedTotal: quote.estimatedTotal,
            receiptPath: receiptName,
          },
          { transaction },
        );
        return {
          code: appointment.code,
          status: appointment.status,
          slotStart: slot.start.toISOString(),
          slotEnd: slot.end.toISOString(),
          estimatedTotal: appointment.estimatedTotal,
        };
      });
    } catch (error) {
      await FileService.remove(receiptName); // no orphan files when the booking fails
      // The UNIQUE index on activeSlot is the last line of defense against double booking
      if (error instanceof UniqueConstraintError) throw slotTaken();
      throw error;
    }
  }
}