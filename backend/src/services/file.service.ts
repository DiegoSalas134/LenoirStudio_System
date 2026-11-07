import { randomUUID } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { env } from "../config/env.ts";
import { AppError } from "../middlewares/errorHandler.ts";

const JPEG_START = [0xff, 0xd8, 0xff];
const PNG_START = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

const startsWith = (buffer: Buffer, signature: number[]) => signature.every((byte, i) => buffer[i] === byte);

export class FileService {
  static detectExtension(buffer: Buffer): "jpg" | "png" | null {
    if (startsWith(buffer, JPEG_START)) return "jpg";
    if (startsWith(buffer, PNG_START)) return "png";
    return null;
  }

  static async saveImage(file: Express.Multer.File | undefined): Promise<string> {
    if (!file) throw new AppError(400, "FILE_REQUIRED", "referencePhoto is required");
    const extension = this.detectExtension(file.buffer);
    if (!extension) throw new AppError(415, "UNSUPPORTED_FILE", "Only JPG or PNG images are allowed");
    await mkdir(env.uploadDir, { recursive: true });
    const name = `${randomUUID()}.${extension}`;
    await writeFile(path.join(env.uploadDir, name), file.buffer, { flag: "wx" });
    return name;
  }

  static async remove(name: string): Promise<void> {
    await unlink(this.pathOf(name)).catch(() => undefined);
  }

  static pathOf(name: string): string {
    return path.join(env.uploadDir, path.basename(name));
  }
}