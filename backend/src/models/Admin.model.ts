import { DataTypes, Model } from "sequelize";
import { sequelize } from "../config/sequelize.connection.ts";

export class Admin extends Model {
  declare id: number;
  declare username: string;
  declare passwordHash: string;
}

Admin.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    username: { type: DataTypes.STRING(50), allowNull: false, unique: true },
    passwordHash: { type: DataTypes.STRING(100), allowNull: false },
  },
  { sequelize, tableName: "admins" },
);