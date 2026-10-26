
import { pool } from "../config/database.js";

export interface Service {
  service_id: number;
  name: string;
  duration_hours: string;
}

export class ServiceModel {
  static async findAll(): Promise<Service[]> {
    const [rows] = await pool.query(
      `SELECT service_id, name, duration_hours
       FROM service
       ORDER BY service_id ASC`
    );

    return rows as Service[];
  }

  static async findById(id: number): Promise<Service | null> {
    const [rows] = await pool.query(
      `SELECT service_id, name, duration_hours
       FROM service
       WHERE service_id = ?`,
      [id]
    );

    const services = rows as Service[];
    return services[0] ?? null;
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

  static async findOptionsByServiceId(serviceId: number) {
    const [rows] = await pool.query(
      `SELECT
          so.option_id,
          so.category,
          so.name,
          so.unit_price,
          so.unit_type
       FROM service_option so
       INNER JOIN service_option_assignment soa
          ON soa.option_id = so.option_id
       WHERE soa.service_id = ?
       ORDER BY so.category ASC, so.name ASC`,
      [serviceId]
    );

    return rows;
  }

  static async findAllOptions() {
    const [rows] = await pool.query(
      `SELECT
          option_id,
          category,
          name,
          unit_price,
          unit_type
       FROM service_option
       ORDER BY category ASC, name ASC`
    );

    return rows;
  }
}