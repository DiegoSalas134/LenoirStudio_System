import type { ErrorRequestHandler } from "express";

export class AppError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
  }
}

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof AppError) {
    res.status(err.status).json({ error: { code: err.code, message: err.message } });
    return;
  }
  if (err?.type === "entity.parse.failed") {
    res.status(400).json({ error: { code: "INVALID_JSON", message: "Malformed JSON body" } });
    return;
  }
  if (err?.code === "LIMIT_FILE_SIZE") {
    res.status(413).json({ error: { code: "FILE_TOO_LARGE", message: "Image must be 5 MB or smaller" } });
    return;
  }
  if (typeof err?.code === "string" && err.code.startsWith("LIMIT_")) {
    res.status(400).json({ error: { code: "INVALID_UPLOAD", message: "Unexpected file or field in the upload" } });
    return;
  }
  console.error(err);
  res.status(500).json({ error: { code: "INTERNAL_ERROR", message: "Unexpected error" } });
};