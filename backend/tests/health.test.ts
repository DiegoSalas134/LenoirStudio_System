import { describe, it, expect } from "vitest";
import request from "supertest";
import { Server } from "../src/server.ts";
import { AppRoutes } from "../src/routes/index.ts";

const { app } = new Server({ port: 0, routes: AppRoutes.router });

describe("GET /api/v1/health", () => {
  it("returns 200 and status ok", async () => {
    const res = await request(app).get("/api/v1/health");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: "ok" });
  });
});