import { sequelize } from "../config/sequelize.connection.ts";
import { env } from "../config/env.ts";
import { Quote } from "./Quote.model.ts";
import { Admin } from "./Admin.model.ts";
import { Customer } from "./Customer.model.ts";
import { CatalogItem } from "./CatalogItem.model.ts";
import { Appointment } from "./Appointment.model.ts";
import { TimeBlock } from "./TimeBlock.model.ts";

Customer.hasMany(Appointment, { foreignKey: "customerId" });
Appointment.belongsTo(Customer, { foreignKey: "customerId" });
Quote.hasOne(Appointment, { foreignKey: "quoteId" });
Appointment.belongsTo(Quote, { foreignKey: "quoteId" });

export { Admin, Customer, CatalogItem, Quote, Appointment, TimeBlock };

export const syncDatabase = async (): Promise<void> => {
  // force (drop + recreate) is only allowed on the test database
  await sequelize.sync({ force: env.isTest });
};