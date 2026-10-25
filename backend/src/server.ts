import express, { Router } from "express";

interface serverOptions{
  port:number,
  routes:Router
}

export class Server {
  server = express();

  private readonly port: number;
  
  constructor(options:serverOptions) {
    this.port = options.port;
    this.server.use(express.json());
    this.server.use('/api/v1', options.routes);
  }
  start() {
    this.server.listen(this.port, () => {
      console.log(`server running on port: ${this.port}`);
    });
  }
}