import express, { Router } from "express";

interface ServerOptions {
  port: number;
  routes: Router;
}

export class Server {
  readonly app = express();

  constructor(private readonly options: ServerOptions) {
    this.app.use(express.json({ limit: "100kb" }));
    this.app.use("/api/v1", options.routes);
  }

  start() {
    this.app.listen(this.options.port, () => {
      console.log(`server running on port: ${this.options.port}`);
    });
  }
}