import bcrypt from "bcrypt";
import "../config/env.ts";
import { sequelize } from "../config/sequelize.connection.ts";
import { Admin, CatalogItem, syncDatabase } from "../models/index.ts";

const techniques = [
  { name: "Soft Gel", price: 320, includedLength: 3, maxLength: 9, extraLengthPrice: 20, includedTones: 10 },
  { name: "Polygel", price: 340, includedLength: 3, maxLength: 9, extraLengthPrice: 25, includedTones: 5 },
  { name: "Builder Gel", price: 320, includedLength: 5, maxLength: 9, extraLengthPrice: 15, includedTones: 5 },
  { name: "Gel Semipermanente", price: 200, includedLength: 3, maxLength: 3, extraLengthPrice: 0, includedTones: 5 },
  { name: "Rubber Gel", price: 300, includedLength: 3, maxLength: 3, extraLengthPrice: 0, includedTones: 5 },
];

const perNail: [string, number][] = [
  ["Francés", 5], ["3D sencillo", 20], ["3D complejo", 40], ["Cromo uña entera", 5],
  ["Cromo detalles sencillos", 10], ["Cromo detalles complejos", 15], ["Cromo 3D", 22],
  ["Mano alzada sencilla", 15], ["Mano alzada compleja", 20], ["Efecto aurora", 7],
  ["Aura básico", 7], ["Aura mixto", 10], ["Foil", 5], ["Cadena de balines", 9],
];

const perPiece: [string, number][] = [
  ["Diamante chico", 3], ["Diamante grande", 6], ["Pinchos", 4], ["Balines", 1],
  ["Medias perlas metálicas chicas", 2], ["Medias perlas metálicas grandes", 5],
];

const items = [
  ...techniques.map((t) => ({ type: "TECHNIQUE" as const, ...t })),
  { type: "TONE_RULE" as const, name: "Tono extra", price: 5 },
  ...perNail.map(([name, price]) => ({ type: "DECORATION" as const, name, price, unit: "NAIL" as const, maxQuantity: 10 })),
  ...perPiece.map(([name, price]) => ({ type: "DECORATION" as const, name, price, unit: "PIECE" as const, maxQuantity: 100 })),
  { type: "REMOVAL" as const, name: "Retiro Acrílico", price: 10, unit: "NAIL" as const, maxQuantity: 10 },
  { type: "REMOVAL" as const, name: "Retiro Gel Semipermanente", price: 8, unit: "NAIL" as const, maxQuantity: 10 },
];

const run = async () => {
  await sequelize.authenticate();
  await syncDatabase();

  for (const { type, name, ...rest } of items) {
    await CatalogItem.findOrCreate({ where: { type, name }, defaults: { type, name, ...rest } });
  }

  const username = process.env["ADMIN_USER"];
  const password = process.env["ADMIN_PASSWORD"];
  if (!username || !password || password.length < 12) {
    throw new Error("ADMIN_USER and ADMIN_PASSWORD (min 12 chars) are required");
  }
  const passwordHash = await bcrypt.hash(password, 12);
  await Admin.findOrCreate({ where: { username }, defaults: { username, passwordHash } });

  console.log("seed completed");
  await sequelize.close();
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});