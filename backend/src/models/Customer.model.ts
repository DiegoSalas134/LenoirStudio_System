import { DataTypes, Model } from "sequelize";
import { sequelize } from "../config/sequelize.connection.ts";

export class Customer extends Model {
  declare id: number;
  declare name: string;
  declare phone: string;
}

Customer.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    name: { type: DataTypes.STRING(100), allowNull: false },
    phone: { type: DataTypes.STRING(10), allowNull: false, unique: true },
  },
  { sequelize, tableName: "customers" },
);