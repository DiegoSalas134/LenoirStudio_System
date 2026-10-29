import { DataTypes, Model } from "sequelize";
import { sequelize } from "../config/sequelize.connection.ts";

export class Quote extends Model {
  declare id: number;
  declare code: string;
  declare details: object;
  declare estimatedTotal: number;
  declare createdAt: Date;
}

Quote.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    code: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, allowNull: false, unique: true },
    // Frozen breakdown: later catalog price changes never alter a saved quote
    details: { type: DataTypes.JSON, allowNull: false },
    estimatedTotal: { type: DataTypes.INTEGER, allowNull: false, validate: { min: 0 } },
  },
  { sequelize, tableName: "quotes" },
);