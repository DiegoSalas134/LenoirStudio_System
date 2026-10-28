import { env } from "./config/env.ts";
import { sequelize } from "./config/sequelize.connection.ts";
import { syncDatabase } from "./models/index.ts";
import { Server } from "./server.ts";
import { AppRoutes } from "./routes/index.ts";

await sequelize.authenticate();
await syncDatabase();
console.log("database connected");

new Server({ port: env.port, routes: AppRoutes.router }).start();