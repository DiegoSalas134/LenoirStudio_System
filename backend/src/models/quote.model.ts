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
      `SELECT option_id, name, category, unit_price, unit_type
       FROM service_option
       WHERE option_id = ?`,
      [optionId]
    );

    const options = rows as ServiceOption[];
    return options[0] ?? null;
  }
}