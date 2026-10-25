import { describe, it, expect } from "vitest";
import request from "supertest";
import { Server } from "../src/server.js";
import { AppRoutes } from "../src/routes/index.js";

const app = new Server({
  port: 3000,
  routes: AppRoutes.router,
}).server;

describe("Service catalog integration tests", () => {
  it("GET /services should return the service catalog", async () => {
    const response = await request(app)
      .get("/api/v1/services");

    expect(response.status).toBe(200);
    expect(response.body.status).toBe("success");
    expect(Array.isArray(response.body.data)).toBe(true);
    expect(response.body.data.length).toBeGreaterThan(0);
  });

  it("GET /services/:id should return an existing service", async () => {
    const response = await request(app)
      .get("/api/v1/services/1");

    expect(response.status).toBe(200);
    expect(response.body.status).toBe("success");
    expect(response.body.data.service_id).toBe(1);
    expect(response.body.data.name).toBe("Aplicacion");
  });

  it("GET /services/:id should reject an invalid ID", async () => {
    const response = await request(app)
      .get("/api/v1/services/abc");

    expect(response.status).toBe(400);
  });

  it("GET /services/:id should return 404 for a missing service", async () => {
    const response = await request(app)
      .get("/api/v1/services/999999");

    expect(response.status).toBe(404);
  });

  it("GET /services/:id/pricing should return techniques and prices", async () => {
    const response = await request(app)
      .get("/api/v1/services/1/pricing");

    expect(response.status).toBe(200);
    expect(response.body.status).toBe("success");
    expect(Array.isArray(response.body.data.techniques)).toBe(true);
    expect(response.body.data.techniques.length).toBeGreaterThan(0);
  });

  it("GET /services/options should return additional options", async () => {
    const response = await request(app)
      .get("/api/v1/services/options");

    expect(response.status).toBe(200);
    expect(response.body.status).toBe("success");
    expect(Array.isArray(response.body.data)).toBe(true);
    expect(response.body.data.length).toBeGreaterThan(0);
  });
});
