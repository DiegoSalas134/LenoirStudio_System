import { body } from "express-validator";

export const loginValidator = [
  body("username").isString().trim().isLength({ min: 3, max: 50 }).withMessage("username must be 3-50 characters"),
  body("password").isString().isLength({ min: 8, max: 128 }).withMessage("password must be 8-128 characters"),
];