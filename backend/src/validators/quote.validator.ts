import { body } from "express-validator";

export const quoteValidator = [
  body("techniqueId").isInt({ min: 1 }).withMessage("techniqueId must be a positive integer").toInt(),
  body("length").isInt({ min: 1, max: 9 }).withMessage("length must be between 1 and 9").toInt(),
  body("extraTones").optional().isInt({ min: 0, max: 20 }).withMessage("extraTones must be between 0 and 20").toInt(),
  body("decorations").optional().isArray({ max: 30 }).withMessage("decorations must be an array"),
  body("decorations.*.id").isInt({ min: 1 }).withMessage("decoration id must be a positive integer").toInt(),
  body("decorations.*.quantity").isInt({ min: 1, max: 100 }).withMessage("decoration quantity must be between 1 and 100").toInt(),
  body("removal").optional({ values: "null" }).isObject().withMessage("removal must be an object"),
  body("removal.id").optional().isInt({ min: 1 }).withMessage("removal id must be a positive integer").toInt(),
  body("removal.nailCount").optional().isInt({ min: 1, max: 10 }).withMessage("removal nailCount must be between 1 and 10").toInt(),
];