import { Appointment, Customer, Quote } from "../models/index.ts";
import { sequelize } from "../config/sequelize.connection.ts";
import { AppError } from "../middlewares/errorHandler.ts";
import type { AppointmentStatus } from "../models/Appointment.model.ts";
import { FileService } from "./file.service.ts";

export interface ConfirmInput {
  finalTotal: number | undefined;
  depositAmount: number;
}

const ADMIN_API = "/api/v1/admin";

// Admin side of the appointment lifecycle: PENDING -> CONFIRMED / CANCELLED, CONFIRMED -> CANCELLED
export class AppointmentService {
  static async list(status: AppointmentStatus | undefined) {
    const rows = await Appointment.findAll({
      where: status ? { status } : {},
      include: [Customer, Quote],
      order: [["slotStart", "ASC"]],
    });
    return rows.map((a) => {
      const customer = (a as unknown as { Customer: Customer }).Customer;
      const quote = (a as unknown as { Quote: Quote }).Quote;
      return {
        code: a.code,
        status: a.status,
        slotStart: a.slotStart,
        slotEnd: a.slotEnd,
        customer: { name: customer.name, phone: customer.phone },
        quote: quote.details,
        estimatedTotal: a.estimatedTotal,
        finalTotal: a.finalTotal,
        depositAmount: a.depositAmount,
        balance: a.finalTotal === null || a.depositAmount === null ? null : a.finalTotal - a.depositAmount,
        receiptUrl: `${ADMIN_API}/appointments/${a.code}/receipt`,
        referencePhotoUrl: `${ADMIN_API}/quotes/${quote.code}/photo`,
      };
    });
  }

  // Confirm: the admin checked the transfer, may adjust the price and records the deposit received
  static async confirm(code: string, input: ConfirmInput) {
    return sequelize.transaction(async (transaction) => {
      const appointment = await Appointment.findOne({ where: { code }, transaction, lock: transaction.LOCK.UPDATE });
      if (!appointment) throw new AppError(404, "NOT_FOUND", "Appointment not found");
      if (appointment.status !== "PENDING") {
        throw new AppError(409, "INVALID_STATUS", `Only PENDING appointments can be confirmed (this one is ${appointment.status})`);
      }
      const finalTotal = input.finalTotal ?? appointment.estimatedTotal;
      if (input.depositAmount > finalTotal) {
        throw new AppError(400, "INVALID_DEPOSIT", "depositAmount cannot be greater than the final total");
      }
      await appointment.update({ status: "CONFIRMED", finalTotal, depositAmount: input.depositAmount }, { transaction });
      return {
        code: appointment.code,
        status: appointment.status,
        finalTotal,
        depositAmount: input.depositAmount,
        balance: finalTotal - input.depositAmount,
      };
    });
  }

  // Cancel (invalid receipt, customer request...): the 3-hour block becomes available again
  static async cancel(code: string) {
    return sequelize.transaction(async (transaction) => {
      const appointment = await Appointment.findOne({ where: { code }, transaction, lock: transaction.LOCK.UPDATE });
      if (!appointment) throw new AppError(404, "NOT_FOUND", "Appointment not found");
      if (appointment.status !== "PENDING" && appointment.status !== "CONFIRMED") {
        throw new AppError(409, "INVALID_STATUS", `Only PENDING or CONFIRMED appointments can be cancelled (this one is ${appointment.status})`);
      }
      await appointment.update({ status: "CANCELLED", activeSlot: null }, { transaction });
      return { code: appointment.code, status: appointment.status };
    });
  }

  static async getReceiptPath(code: string): Promise<string> {
    const appointment = await Appointment.findOne({ where: { code } });
    if (!appointment) throw new AppError(404, "NOT_FOUND", "Appointment not found");
    return FileService.pathOf(appointment.receiptPath);
  }
}