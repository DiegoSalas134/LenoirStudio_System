import { DataTypes, Model } from "sequelize";
import { sequelize } from "../config/sequelize.connection.ts";

export type CatalogType = "TECHNIQUE" | "DECORATION" | "REMOVAL" | "TONE_RULE";

export class CatalogItem extends Model {
  declare id: number;
  declare type: CatalogType;
  declare name: string;
  declare price: number;
  declare unit: "NAIL" | "PIECE" | null;
  declare maxQuantity: number | null;
  declare includedLength: number | null;
  declare maxLength: number | null;
  declare extraLengthPrice: number | null;
  declare includedTones: number | null;
  declare active: boolean;
}

CatalogItem.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    type: { type: DataTypes.ENUM("TECHNIQUE", "DECORATION", "REMOVAL", "TONE_RULE"), allowNull: false },
    name: { type: DataTypes.STRING(100), allowNull: false },
    price: { type: DataTypes.INTEGER, allowNull: false, validate: { min: 0 } },
    unit: { type: DataTypes.ENUM("NAIL", "PIECE"), allowNull: true },
    maxQuantity: { type: DataTypes.INTEGER, allowNull: true },
    includedLength: { type: DataTypes.INTEGER, allowNull: true },
    maxLength: { type: DataTypes.INTEGER, allowNull: true },
    extraLengthPrice: { type: DataTypes.INTEGER, allowNull: true },
    includedTones: { type: DataTypes.INTEGER, allowNull: true },
    active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  },
  { sequelize, tableName: "catalog_items", indexes: [{ unique: true, fields: ["type", "name"] }] },
);