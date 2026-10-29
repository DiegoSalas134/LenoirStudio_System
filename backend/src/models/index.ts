import { sequelize } from "../config/sequelize.connection.ts";
import { env } from "../config/env.ts";
import { Quote } from "./Quote.model.ts";
export { Quote };
export { Admin } from "./Admin.model.ts";
export { Customer } from "./Customer.model.ts";
export { CatalogItem } from "./CatalogItem.model.ts";

export const syncDatabase = async (): Promise<void> => {
  // force (drop + recreate) is only allowed on the test database
  await sequelize.sync({ force: env.isTest });
};