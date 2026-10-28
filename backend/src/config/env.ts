import dotenv from "dotenv";

dotenv.config();

const required = [
  "DB_HOST", "DB_PORT", "DB_USER", "DB_PASSWORD",
  "DB_NAME", "DB_NAME_TEST", "JWT_SECRET",
] as const;

for (const key of required) {
  if (!process.env[key]) throw new Error(`Missing environment variable: ${key}`);
}
if ((process.env["JWT_SECRET"] as string).length < 32) {
  throw new Error("JWT_SECRET must be at least 32 characters");
}

const isTest = process.env["NODE_ENVIRONMENT"] === "test";

export const env = {
  port: Number(process.env["PORT"] ?? 3000),
  dbHost: process.env["DB_HOST"] as string,
  dbPort: Number(process.env["DB_PORT"]),
  dbUser: process.env["DB_USER"] as string,
  dbPassword: process.env["DB_PASSWORD"] as string,
  dbName: (isTest ? process.env["DB_NAME_TEST"] : process.env["DB_NAME"]) as string,
  isProduction: process.env["NODE_ENVIRONMENT"] === "production",
  jwtSecret: process.env["JWT_SECRET"] as string,
  isTest,
};