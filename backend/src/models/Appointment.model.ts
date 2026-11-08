import { DataTypes, Model } from "sequelize";
import { sequelize } from "../config/sequelize.connection.ts";

export type AppointmentStatus = "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED";

export class Appointment extends Model {
  declare id: number;
  declare code: string;
  declare customerId: number;
  declare quoteId: number;
  declare slotStart: Date;
  declare slotEnd: Date;
  declare activeSlot: Date | null;
  declare status: AppointmentStatus;
  declare estimatedTotal: number;
  declare finalTotal: number | null;
  declare depositAmount: number | null;
  declare receiptPath: string;
}

Appointment.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    code: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, allowNull: false, unique: true },
    customerId: { type: DataTypes.INTEGER, allowNull: false },
    // One quote can only become one appointment
    quoteId: { type: DataTypes.INTEGER, allowNull: false, unique: true },
    slotStart: { type: DataTypes.DATE, allowNull: false },
    slotEnd: { type: DataTypes.DATE, allowNull: false },
    // Equals slotStart while PENDING/CONFIRMED and NULL otherwise. UNIQUE = no double booking.
    activeSlot: { type: DataTypes.DATE, allowNull: true, unique: true },
    status: { type: DataTypes.ENUM("PENDING", "CONFIRMED", "CANCELLED", "COMPLETED"), allowNull: false, defaultValue: "PENDING" },
    estimatedTotal: { type: DataTypes.INTEGER, allowNull: false, validate: { min: 0 } },
    finalTotal: { type: DataTypes.INTEGER, allowNull: true, validate: { min: 0 } },
    depositAmount: { type: DataTypes.INTEGER, allowNull: true, validate: { min: 0 } },
    // File name only; the folder comes from env.uploadDir
    receiptPath: { type: DataTypes.STRING(100), allowNull: false },
  },
  { sequelize, tableName: "appointments" },
);