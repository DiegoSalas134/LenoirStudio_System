import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import bcrypt from "bcrypt";
import { env } from "../src/config/env.ts";
import { sequelize } from "../src/config/sequelize.connection.ts";
import { Admin, syncDatabase } from "../src/models/index.ts";
import { Server } from "../src/server.ts";
import { AppRoutes } from "../src/routes/index.ts";

if (!env.isTest) throw new Error("Integration tests must run with NODE_ENVIRONMENT=test");

const { app } = new Server({ port: 0, routes: AppRoutes.router });
const USER = "admin_test";
const PASS = "Test-password-123";
const login = (username: string, password: string) =>
  request(app).post("/api/v1/admin/auth/login").send({ username, password });

beforeAll(async () => {
  await syncDatabase();
  await Admin.create({ username: USER, passwordHash: await bcrypt.hash(PASS, 4) });
});

afterAll(async () => {
  await sequelize.close();
});

describe("admin auth", () => {
  it("logs in with valid credentials and sets a secure cookie", async () => {
    const res = await login(USER, PASS);
    expect(res.status).toBe(200);
    const cookie = String(res.headers["set-cookie"]);
    expect(cookie).toContain("HttpOnly");
    expect(cookie).toContain("SameSite=Strict");
    expect(JSON.stringify(res.body)).not.toContain("eyJ");
  });

  it("rejects wrong password and unknown user with the same message", async () => {
    const wrong = await login(USER, "wrong-password-1");
    const unknown = await login("nobody", "wrong-password-1");
    expect(wrong.status).toBe(401);
    expect(unknown.status).toBe(401);
    expect(wrong.body).toEqual(unknown.body);
  });

  it("rejects invalid bodies with 400", async () => {
    const res = await request(app).post("/api/v1/admin/auth/login").send({});
    expect(res.status).toBe(400);
  });

  it("blocks /me without cookie (401) and with a tampered token (401)", async () => {
    expect((await request(app).get("/api/v1/admin/auth/me")).status).toBe(401);
    const res = await request(app).get("/api/v1/admin/auth/me").set("Cookie", "lenoir_admin_token=abc.def.ghi");
    expect(res.status).toBe(401);
  });

  it("allows /me with a valid cookie and never returns the hash", async () => {
    const agent = request.agent(app);
    await agent.post("/api/v1/admin/auth/login").send({ username: USER, password: PASS });
    const res = await agent.get("/api/v1/admin/auth/me");
    expect(res.status).toBe(200);
    expect(res.body.username).toBe(USER);
    expect(JSON.stringify(res.body)).not.toContain("passwordHash");
    expect(res.headers["cache-control"]).toBe("no-store");
  });

  it("rejects the old cookie after logout", async () => {
    const loginRes = await login(USER, PASS);
    const cookie = loginRes.headers["set-cookie"];
    expect((await request(app).post("/api/v1/admin/auth/logout").set("Cookie", cookie)).status).toBe(200);
    expect((await request(app).get("/api/v1/admin/auth/me").set("Cookie", cookie)).status).toBe(401);
  });

  it("rate limits repeated failed logins (keep this test last)", async () => {
    const statuses: number[] = [];
    for (let i = 0; i < 6; i++) statuses.push((await login(USER, "wrong-password-1")).status);
    expect(statuses).toContain(429);
  });
});