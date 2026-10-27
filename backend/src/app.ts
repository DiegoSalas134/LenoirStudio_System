import dotenv from "dotenv";
import { Server } from "./server.ts";
import { AppRoutes } from "./routes/index.ts";

dotenv.config();

const server = new Server({ port: Number(process.env["PORT"] ?? 3000), routes: AppRoutes.router });
server.start();
