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
}