import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { randomUUID } from "node:crypto";
import { env } from "../config/env.ts";
import { Admin } from "../models/index.ts";
import { AppError } from "../middlewares/errorHandler.ts";

export const COOKIE_NAME = "lenoir_admin_token";
export const TOKEN_TTL_SECONDS = 60 * 60;

export interface TokenPayload {
  sub: string;
  username: string;
  role: "admin";
  jti: string;
  exp: number;
}

const DUMMY_HASH = bcrypt.hashSync("dummy-password-for-timing", 12);

const revoked = new Map<string, number>();

export class AuthService {
  static async login(username: string, password: string): Promise<string> {
    const admin = await Admin.findOne({ where: { username } });
    const valid = await bcrypt.compare(password, admin?.passwordHash ?? DUMMY_HASH);
    if (!admin || !valid) {
      throw new AppError(401, "INVALID_CREDENTIALS", "Invalid username or password");
    }
    return jwt.sign({ username: admin.username, role: "admin" }, env.jwtSecret, {
      algorithm: "HS256",
      subject: String(admin.id),
      jwtid: randomUUID(),
      expiresIn: TOKEN_TTL_SECONDS,
    });
  }

  static verify(token: string): TokenPayload {
    try {
      const payload = jwt.verify(token, env.jwtSecret, { algorithms: ["HS256"] }) as unknown as TokenPayload;
      if (revoked.has(payload.jti)) throw new Error("revoked");
      return payload;
    } catch {
      throw new AppError(401, "UNAUTHENTICATED", "Invalid or expired session");
    }
  }

  static revoke(token: string): void {
    const payload = jwt.decode(token) as TokenPayload | null;
    if (!payload) return;
    revoked.set(payload.jti, payload.exp);
    const now = Math.floor(Date.now() / 1000);
    for (const [jti, exp] of revoked) if (exp < now) revoked.delete(jti);
  }
}