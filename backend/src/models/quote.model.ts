import { pool } from "../config/database.js";

export interface BasePrice {
  service_id: number;
  service_name: string;
  technique_id: number;
  technique_name: string;
  base_price: string;
  included_tones: number;
  min_length: number | null;
  included_length_through: number | null;
  length_increment: string;
  max_length: number | null;
  length_natural_only: number;
}

export interface ServiceOption {
  option_id: number;
  name: string;
  category: string;
  unit_price: string;
  unit_type: "per_nail" | "per_piece" | "per_tone" | "flat";
}

export interface RemovalMaterial {
  material_id: number;
  name: string;
  price_per_nail: string;
  lenoir_price_per_nail: string;
}

export class QuoteModel {
  static async findBasePrice(
    serviceId: number,
    techniqueId: number
  ): Promise<BasePrice | null> {
    const [rows] = await pool.query(
      `SELECT
          s.service_id,
          s.name AS service_name,
          st.technique_id,
          st.name AS technique_name,
          sbp.base_price,
          sbp.included_tones,
          sbp.min_length,
          sbp.included_length_through,
          sbp.length_increment,
          sbp.max_length,
          sbp.length_natural_only
       FROM service_base_price sbp
       INNER JOIN service s
          ON s.service_id = sbp.service_id
       INNER JOIN service_technique st
          ON st.technique_id = sbp.technique_id
       WHERE sbp.service_id = ?
         AND sbp.technique_id = ?`,
      [serviceId, techniqueId]
    );

    const prices = rows as BasePrice[];
    return prices[0] ?? null;
  }

  static async findOptionById(
    optionId: number
  ): Promise<ServiceOption | null> {
    const [rows] = await pool.query(
      `SELECT
          option_id,
          name,
          category,
          unit_price,
          unit_type
       FROM service_option
       WHERE option_id = ?`,
      [optionId]
    );

    const options = rows as ServiceOption[];
    return options[0] ?? null;
  }

  static async findExtraToneOption(): Promise<ServiceOption | null> {
    const [rows] = await pool.query(
      `SELECT
          option_id,
          name,
          category,
          unit_price,
          unit_type
       FROM service_option
       WHERE unit_type = 'per_tone'
       ORDER BY option_id ASC
       LIMIT 1`
    );

    const options = rows as ServiceOption[];
    return options[0] ?? null;
  }

  static async isOptionAllowed(
    serviceId: number,
    optionId: number
  ): Promise<boolean> {
    const [rows] = await pool.query(
      `SELECT 1
       FROM service_option_assignment
       WHERE service_id = ?
         AND option_id = ?
       LIMIT 1`,
      [serviceId, optionId]
    );

    return (rows as unknown[]).length > 0;
  }

  static async findRemovalMaterialById(
    materialId: number
  ): Promise<RemovalMaterial | null> {
    const [rows] = await pool.query(
      `SELECT
          material_id,
          name,
          price_per_nail,
          lenoir_price_per_nail
       FROM removal_material
       WHERE material_id = ?`,
      [materialId]
    );

    const materials = rows as RemovalMaterial[];
    return materials[0] ?? null;
  }
}