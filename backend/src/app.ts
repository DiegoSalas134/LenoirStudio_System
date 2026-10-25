import dotenv from "dotenv";
import { Server } from "./server.js";
import { AppRoutes } from "./routes/index.js";

dotenv.config();

const port = Number(process.env["PORT"]) || 3000;

function main(): void {
  const server = new Server({
    port,
    routes: AppRoutes.router
  });

  server.start();
}

main();