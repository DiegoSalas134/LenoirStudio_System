import { DataTypes, Model } from "sequelize";
import { sequelize } from "../config/sequelize.connection.ts";

// Hours or days the administrator marks as unavailable
export class TimeBlock extends Model {
  declare id: number;
  declare startsAt: Date;
  declare endsAt: Date;
  declare reason: string | null;
}

TimeBlock.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    startsAt: { type: DataTypes.DATE, allowNull: false },
    endsAt: { type: DataTypes.DATE, allowNull: false },
    reason: { type: DataTypes.STRING(200), allowNull: true },
  },
  { sequelize, tableName: "time_blocks" },
);