import express, { Router } from "express";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { AppError, errorHandler } from "./middlewares/errorHandler.ts";
import path from "node:path";

interface ServerOptions {
  port: number;
  routes: Router;
}

export class Server {
  readonly app = express();

  constructor(private readonly options: ServerOptions) {
    this.app.use(helmet());
    this.app.use(express.json({ limit: "100kb" }));
    this.app.use(cookieParser());
    this.app.use(express.static(path.resolve(import.meta.dirname, "../../frontend/test")));
    this.app.use("/api/v1", options.routes);
    this.app.use((_req, _res, next) => next(new AppError(404, "NOT_FOUND", "Route not found")));
    this.app.use(errorHandler);
  }

  start() {
    this.app.listen(this.options.port, () => {
      console.log(`server running on port: ${this.options.port}`);
    });
  }
}