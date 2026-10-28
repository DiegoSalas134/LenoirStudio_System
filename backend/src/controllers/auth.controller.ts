import type { Request, Response } from "express";
import { env } from "../config/env.ts";
import { AuthService, COOKIE_NAME, TOKEN_TTL_SECONDS } from "../services/auth.service.ts";

const cookieOptions = {
  httpOnly: true,
  sameSite: "strict" as const,
  secure: env.isProduction,
  path: "/",
};

export class AuthController {
  static login = async (req: Request, res: Response): Promise<void> => {
    const { username, password } = req.body;
    const token = await AuthService.login(username, password);
    res.cookie(COOKIE_NAME, token, { ...cookieOptions, maxAge: TOKEN_TTL_SECONDS * 1000 });
    res.status(200).json({ message: "Logged in" });
  };

  static logout = (req: Request, res: Response): void => {
    AuthService.revoke(req.cookies[COOKIE_NAME]);
    res.clearCookie(COOKIE_NAME, cookieOptions);
    res.status(200).json({ message: "Logged out" });
  };

  static me = (_req: Request, res: Response): void => {
    const admin = res.locals["admin"];
    res.status(200).json({ id: Number(admin.sub), username: admin.username, role: admin.role });
  };
}