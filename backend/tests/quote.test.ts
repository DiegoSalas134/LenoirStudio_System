import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { env } from "../src/config/env.ts";
import { sequelize } from "../src/config/sequelize.connection.ts";
import { CatalogItem, syncDatabase } from "../src/models/index.ts";
import { Server } from "../src/server.ts";
import { AppRoutes } from "../src/routes/index.ts";

if (!env.isTest) throw new Error("Integration tests must run with NODE_ENVIRONMENT=test");

const { app } = new Server({ port: 0, routes: AppRoutes.router });
const calc = (body: object) => request(app).post("/api/v1/quotes/calculate").send(body);

let soft: CatalogItem, rubber: CatalogItem, frances: CatalogItem, diamond: CatalogItem, acrylic: CatalogItem;

beforeAll(async () => {
  await syncDatabase();
  soft = await CatalogItem.create({ type: "TECHNIQUE", name: "Soft Gel", price: 320, includedLength: 3, maxLength: 9, extraLengthPrice: 20, includedTones: 10 });
  rubber = await CatalogItem.create({ type: "TECHNIQUE", name: "Rubber Gel", price: 300, includedLength: 3, maxLength: 3, extraLengthPrice: 0, includedTones: 5 });
  await CatalogItem.create({ type: "TONE_RULE", name: "Tono extra", price: 5 });
  frances = await CatalogItem.create({ type: "DECORATION", name: "Francés", price: 5, unit: "NAIL", maxQuantity: 10 });
  diamond = await CatalogItem.create({ type: "DECORATION", name: "Diamante chico", price: 3, unit: "PIECE", maxQuantity: 100 });
  acrylic = await CatalogItem.create({ type: "REMOVAL", name: "Retiro Acrílico", price: 10, unit: "NAIL", maxQuantity: 10 });
});

afterAll(async () => {
  await sequelize.close();
});

describe("GET /catalog", () => {
  it("returns active options without internal fields", async () => {
    const res = await request(app).get("/api/v1/catalog");
    expect(res.status).toBe(200);
    expect(res.body.techniques).toHaveLength(2);
    expect(res.body.extraTonePrice).toBe(5);
    expect(res.body.techniques[0]).not.toHaveProperty("createdAt");
  });
});

describe("POST /quotes/calculate", () => {
  it("calculates a base quote with no extras", async () => {
    const res = await calc({ techniqueId: soft.id, length: 3 });
    expect(res.status).toBe(200);
    expect(res.body.estimatedTotal).toBe(320);
  });

  it("calculates the full example with every charge", async () => {
    const res = await calc({
      techniqueId: soft.id, length: 5, extraTones: 2,
      decorations: [{ id: frances.id, quantity: 10 }, { id: diamond.id, quantity: 8 }],
      removal: { id: acrylic.id, nailCount: 4 },
    });
    expect(res.status).toBe(200);
    expect(res.body.length.charge).toBe(40);
    expect(res.body.extraTones.charge).toBe(10);
    expect(res.body.decorationsTotal).toBe(74);
    expect(res.body.removal.subtotal).toBe(40);
    expect(res.body.estimatedTotal).toBe(484);
  });

  it("ignores prices sent by the client", async () => {
    const res = await calc({ techniqueId: soft.id, length: 3, price: 1, estimatedTotal: 1 });
    expect(res.status).toBe(200);
    expect(res.body.estimatedTotal).toBe(320);
  });

  it("rejects a length above the technique maximum", async () => {
    expect((await calc({ techniqueId: rubber.id, length: 4 })).status).toBe(400);
  });

  it("rejects a decoration quantity above its maximum", async () => {
    const res = await calc({ techniqueId: soft.id, length: 3, decorations: [{ id: frances.id, quantity: 11 }] });
    expect(res.status).toBe(400);
  });

  it("rejects duplicated decorations", async () => {
    const res = await calc({
      techniqueId: soft.id, length: 3,
      decorations: [{ id: frances.id, quantity: 1 }, { id: frances.id, quantity: 2 }],
    });
    expect(res.status).toBe(400);
  });

  it("rejects unknown techniques and malformed input", async () => {
    expect((await calc({ techniqueId: 9999, length: 3 })).status).toBe(400);
    expect((await calc({ techniqueId: "abc", length: "x" })).status).toBe(400);
    expect((await calc({})).status).toBe(400);
  });
});