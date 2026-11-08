import { Op, type Transaction } from "sequelize";
import { Appointment, TimeBlock } from "../models/index.ts";
import { AppError } from "../middlewares/errorHandler.ts";

const MEXICO_OFFSET = "-06:00";
const BLOCK_START_HOURS = [10, 13, 16]; // change these for the studio's real hours
const BLOCK_HOURS = 3;
const HOUR_MS = 3600 * 1000;
const DAY_MS = 24 * HOUR_MS;
const MIN_NOTICE_MS = DAY_MS;
const MAX_AHEAD_MS = 14 * DAY_MS;
const MAX_RANGE_DAYS = 15;

const pad = (n: number) => String(n).padStart(2, "0");

export interface Slot {
  start: Date;
  end: Date;
  label: string;
}

export class AvailabilityService {
  static slotsForDate(date: string): Slot[] {
    return BLOCK_START_HOURS.map((hour) => {
      const start = new Date(`${date}T${pad(hour)}:00:00${MEXICO_OFFSET}`);
      return {
        start,
        end: new Date(start.getTime() + BLOCK_HOURS * HOUR_MS),
        label: `${pad(hour)}:00-${pad(hour + BLOCK_HOURS)}:00`,
      };
    });
  }

  // Business rule: from 24 hours up to 14 days ahead
  static inBookingWindow(start: Date, now = new Date()): boolean {
    const diff = start.getTime() - now.getTime();
    return diff >= MIN_NOTICE_MS && diff <= MAX_AHEAD_MS;
  }

  // The requested start must be exactly one of the studio's blocks (same calendar date in Mexico time)
  static findSlot(start: Date): Slot | undefined {
    const mexicoDate = new Date(start.getTime() - 6 * HOUR_MS).toISOString().slice(0, 10);
    return this.slotsForDate(mexicoDate).find((slot) => slot.start.getTime() === start.getTime());
  }

  static async isSlotFree(slot: Slot, transaction: Transaction): Promise<boolean> {
    const taken = await Appointment.findOne({ where: { activeSlot: slot.start }, transaction });
    if (taken) return false;
    const blocked = await TimeBlock.findOne({
      where: { startsAt: { [Op.lt]: slot.end }, endsAt: { [Op.gt]: slot.start } },
      transaction,
    });
    return !blocked;
  }

  static async getAvailability(from: string, to: string, now = new Date()) {
    const fromMs = Date.parse(`${from}T00:00:00Z`);
    const toMs = Date.parse(`${to}T00:00:00Z`);
    if (toMs < fromMs) throw new AppError(400, "INVALID_RANGE", "to must not be before from");
    const days = (toMs - fromMs) / DAY_MS + 1;
    if (days > MAX_RANGE_DAYS) throw new AppError(400, "INVALID_RANGE", `Range cannot exceed ${MAX_RANGE_DAYS} days`);

    const dates = Array.from({ length: days }, (_, i) => new Date(fromMs + i * DAY_MS).toISOString().slice(0, 10));
    const slots = dates.flatMap((date) => this.slotsForDate(date).map((slot) => ({ date, ...slot })));
    const candidates = slots.filter((slot) => this.inBookingWindow(slot.start, now));
    if (candidates.length === 0) return [];

    const rangeStart = candidates[0]!.start;
    const rangeEnd = candidates[candidates.length - 1]!.end;
    const taken = await Appointment.findAll({
      where: { activeSlot: { [Op.between]: [rangeStart, rangeEnd] } },
      attributes: ["activeSlot"],
    });
    const takenTimes = new Set(taken.map((a) => a.activeSlot!.getTime()));
    const blocks = await TimeBlock.findAll({
      where: { startsAt: { [Op.lt]: rangeEnd }, endsAt: { [Op.gt]: rangeStart } },
    });

    const free = candidates.filter(
      (slot) =>
        !takenTimes.has(slot.start.getTime()) &&
        !blocks.some((block) => block.startsAt < slot.end && block.endsAt > slot.start),
    );

    return dates
      .map((date) => ({
        date,
        blocks: free
          .filter((slot) => slot.date === date)
          .map((slot) => ({ start: slot.start.toISOString(), end: slot.end.toISOString(), label: slot.label })),
      }))
      .filter((day) => day.blocks.length > 0);
  }
}