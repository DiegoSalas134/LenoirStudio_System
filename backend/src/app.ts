import dotenv from "dotenv";
dotenv.config();

import { Server } from "./server.js";
import { AppRoutes } from "./routes/index.js";
import { pool } from "./config/database.js";

const port = Number(process.env["PORT"]) || 3000;

async function main(): Promise<void> {
  try {
    const connection = await pool.getConnection();

    await connection.query("SELECT 1");
    connection.release();

    console.log("MySQL conectado correctamente.");

    const server = new Server({
      port,
      routes: AppRoutes.router
    });

    server.start();
  } catch (error) {
    console.error("Error al conectar con MySQL:", error);
    await pool.end();
    process.exitCode = 1;
  }
}

main();
