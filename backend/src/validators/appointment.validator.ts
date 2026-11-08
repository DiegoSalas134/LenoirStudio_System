import { body, param, query } from "express-validator";

// "(449) 123-4567", "449 123 4567" and "+52 449 123 4567" all become "4491234567"
export const normalizePhone = (value: unknown): string => {
  const digits = String(value ?? "").replace(/\D/g, "");
  return digits.length === 12 && digits.startsWith("52") ? digits.slice(2) : digits;
};

export const appointmentValidator = [
  body("name").isString().trim().isLength({ min: 2, max: 100 }).withMessage("name must be 2-100 characters"),
  body("phone").customSanitizer(normalizePhone).matches(/^\d{10}$/).withMessage("phone must have 10 digits"),
  body("quoteCode").isUUID().withMessage("quoteCode must be a valid UUID"),
  body("slotStart").isISO8601({ strict: true }).withMessage("slotStart must be an ISO date"),
];

const dateOptions = { format: "YYYY-MM-DD", strictMode: true, delimiters: ["-"] };

export const availabilityValidator = [
  query("from").isDate(dateOptions).withMessage("from must be a date in YYYY-MM-DD format"),
  query("to").isDate(dateOptions).withMessage("to must be a date in YYYY-MM-DD format"),
];

export const appointmentCodeValidator = [param("code").isUUID().withMessage("code must be a valid UUID")];

export const appointmentListValidator = [
  query("status").optional().isIn(["PENDING", "CONFIRMED", "CANCELLED", "COMPLETED"]).withMessage("invalid status filter"),
];

export const confirmValidator = [
  ...appointmentCodeValidator,
  body("finalTotal").optional().isInt({ min: 0, max: 100000 }).withMessage("finalTotal must be between 0 and 100000").toInt(),
  body("depositAmount").isInt({ min: 0, max: 100000 }).withMessage("depositAmount must be between 0 and 100000").toInt(),
];