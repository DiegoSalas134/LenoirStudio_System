import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import bcrypt from "bcrypt";
import { env } from "../src/config/env.ts";
import { sequelize } from "../src/config/sequelize.connection.ts";
import { Admin, CatalogItem, Quote, syncDatabase } from "../src/models/index.ts";
import { Server } from "../src/server.ts";
import { AppRoutes } from "../src/routes/index.ts";

if (!env.isTest) throw new Error("Integration tests must run with NODE_ENVIRONMENT=test");

const { app } = new Server({ port: 0, routes: AppRoutes.router });
const USER = "admin_quotes";
const PASS = "Test-password-123";
let soft: CatalogItem;

beforeAll(async () => {
  await syncDatabase();
  soft = await CatalogItem.create({ type: "TECHNIQUE", name: "Soft Gel", price: 320, includedLength: 3, maxLength: 9, extraLengthPrice: 20, includedTones: 10 });
  await CatalogItem.create({ type: "TONE_RULE", name: "Tono extra", price: 5 });
  await Admin.create({ username: USER, passwordHash: await bcrypt.hash(PASS, 4) });
});

afterAll(async () => {
  await sequelize.close();
});

describe("POST /quotes (persisted)", () => {
  it("saves the quote with a code and the server-calculated total", async () => {
    const res = await request(app).post("/api/v1/quotes").send({ techniqueId: soft.id, length: 5, extraTones: 2, estimatedTotal: 1 });
    expect(res.status).toBe(201);
    expect(res.body.code).toBeTruthy();
    expect(res.body.estimatedTotal).toBe(370);
    const row = await Quote.findOne({ where: { code: res.body.code } });
    expect(row?.estimatedTotal).toBe(370);
  });

  it("does not save anything when the input is invalid", async () => {
    const before = await Quote.count();
    const res = await request(app).post("/api/v1/quotes").send({ techniqueId: soft.id, length: 12 });
    expect(res.status).toBe(400);
    expect(await Quote.count()).toBe(before);
  });
});

describe("GET /admin/quotes", () => {
  it("is private: 401 without cookie and with a tampered token", async () => {
    expect((await request(app).get("/api/v1/admin/quotes")).status).toBe(401);
    const res = await request(app).get("/api/v1/admin/quotes").set("Cookie", "lenoir_admin_token=abc.def.ghi");
    expect(res.status).toBe(401);
  });

  it("lists the saved quotes for a logged-in admin", async () => {
    const agent = request.agent(app);
    await agent.post("/api/v1/admin/auth/login").send({ username: USER, password: PASS });
    const res = await agent.get("/api/v1/admin/quotes");
    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThanOrEqual(1);
    expect(res.body[0]).toHaveProperty("details");
    expect(res.headers["cache-control"]).toBe("no-store");
  });
});