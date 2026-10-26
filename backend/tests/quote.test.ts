import { describe, it, expect } from "vitest";
import request from "supertest";
import { Server } from "../src/server.js";
import { AppRoutes } from "../src/routes/index.js";

const app = new Server({
  port: 3000,
  routes: AppRoutes.router,
}).server;

describe("Quote integration tests", () => {
  it("should calculate an application quote with Polygel", async () => {
    const response = await request(app)
      .post("/api/v1/services/1/quote")
      .send({
        technique_id: 2,
        length: 5,
        tones: 6,
        options: [
          {
            option_id: 1,
            quantity: 1,
            nails: 4,
          },
        ],
      });

    expect(response.status).toBe(200);
    expect(response.body.status).toBe("success");
    expect(response.body.data.pricing.estimated_total).toBe(420);
  });

  it("should calculate a refill quote with Polygel", async () => {
    const response = await request(app)
      .post("/api/v1/services/2/quote")
      .send({
        technique_id: 2,
        tones: 4,
      });

    expect(response.status).toBe(200);
    expect(response.body.status).toBe("success");
    expect(response.body.data.pricing.estimated_total).toBe(300);
  });

  it("should calculate a removal quote when the previous application was not done at LenoirStudio", async () => {
    const response = await request(app)
      .post("/api/v1/services/3/quote")
      .send({
        removal: {
          material_id: 3,
          nails: 10,
          at_lenoir: false,
        },
      });

    expect(response.status).toBe(200);
    expect(response.body.status).toBe("success");
    expect(response.body.data.pricing.estimated_total).toBe(100);
  });

  it("should include removal in an application quote", async () => {
    const response = await request(app)
      .post("/api/v1/services/1/quote")
      .send({
        technique_id: 2,
        length: 3,
        tones: 4,
        removal: {
          material_id: 3,
          nails: 10,
          at_lenoir: true,
        },
      });

    expect(response.status).toBe(200);
    expect(response.body.status).toBe("success");
    expect(response.body.data.pricing.estimated_total).toBe(390);
  });

  it("should reject a length above the technique limit", async () => {
    const response = await request(app)
      .post("/api/v1/services/1/quote")
      .send({
        technique_id: 2,
        length: 10,
        tones: 4,
      });

    expect(response.status).toBe(400);
  });

  it("should reject a removal quote without a material", async () => {
    const response = await request(app)
      .post("/api/v1/services/3/quote")
      .send({
        removal: {
          nails: 10,
          at_lenoir: false,
        },
      });

    expect(response.status).toBe(400);
  });
});