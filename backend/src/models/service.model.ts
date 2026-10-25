import { pool } from "../config/database.js";

export interface Service {
  service_id: number;
  name: string;
  duration_hours: string;
  base_price: string;
}

export class ServiceModel {
  static async findAll(): Promise<Service[]> {
    const [rows] = await pool.query(
      `SELECT service_id, name, duration_hours, base_price
       FROM service
       ORDER BY service_id ASC`
    );

    return rows as Service[];
  }

  static async findById(id: number): Promise<Service | null> {
    const [rows] = await pool.query(
      `SELECT service_id, name, duration_hours, base_price
       FROM service
       WHERE service_id = ?`,
      [id]
    );

    const services = rows as Service[];

    const service = services[0];
    return service ?? null;
  }

    static async findPricingByServiceId(id: number) {
    const [rows] = await pool.query(
      `SELECT
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
       INNER JOIN service_technique st
          ON sbp.technique_id = st.technique_id
       WHERE sbp.service_id = ?
       ORDER BY st.technique_id ASC`,
      [id]
    );

    return rows;
  }
}