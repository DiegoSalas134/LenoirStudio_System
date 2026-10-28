import { Op } from "sequelize";
import { CatalogItem } from "../models/index.ts";
import { AppError } from "../middlewares/errorHandler.ts";

export interface QuoteInput {
  techniqueId: number;
  length: number;
  extraTones: number;
  decorations: { id: number; quantity: number }[];
  removal: { id?: number; nailCount?: number } | null;
}

const bad = (code: string, message: string) => new AppError(400, code, message);

export class QuoteService {
  static async getCatalog() {
    const items = await CatalogItem.findAll({ where: { active: true }, order: [["id", "ASC"]] });
    const of = (type: string) => items.filter((i) => i.type === type);
    return {
      techniques: of("TECHNIQUE").map((t) => ({
        id: t.id, name: t.name, price: t.price, includedLength: t.includedLength,
        maxLength: t.maxLength, extraLengthPrice: t.extraLengthPrice, includedTones: t.includedTones,
      })),
      extraTonePrice: of("TONE_RULE")[0]?.price ?? 0,
      decorations: of("DECORATION").map((d) => ({
        id: d.id, name: d.name, price: d.price, unit: d.unit, maxQuantity: d.maxQuantity,
      })),
      removals: of("REMOVAL").map((r) => ({
        id: r.id, name: r.name, price: r.price, unit: r.unit, maxQuantity: r.maxQuantity,
      })),
    };
  }

  // Prices always come from the database, never from the client
  static async calculate(input: QuoteInput) {
    const technique = await CatalogItem.findOne({ where: { id: input.techniqueId, type: "TECHNIQUE", active: true } });
    if (!technique) throw bad("INVALID_TECHNIQUE", "Technique not found");
    if (input.length > (technique.maxLength ?? 0)) {
      throw bad("INVALID_LENGTH", `${technique.name} supports length up to ${technique.maxLength}`);
    }

    const lengthCharge = Math.max(0, input.length - (technique.includedLength ?? 0)) * (technique.extraLengthPrice ?? 0);

    const toneRule = await CatalogItem.findOne({ where: { type: "TONE_RULE", active: true } });
    const toneUnitPrice = toneRule?.price ?? 0;
    const tonesCharge = input.extraTones * toneUnitPrice;

    const ids = input.decorations.map((d) => d.id);
    if (new Set(ids).size !== ids.length) throw bad("DUPLICATE_DECORATION", "Each decoration can only be added once");
    const found = ids.length
      ? await CatalogItem.findAll({ where: { id: { [Op.in]: ids }, type: "DECORATION", active: true } })
      : [];
    const decorations = input.decorations.map(({ id, quantity }) => {
      const item = found.find((f) => f.id === id);
      if (!item) throw bad("INVALID_DECORATION", `Decoration ${id} not found`);
      if (quantity > (item.maxQuantity ?? 0)) {
        throw bad("INVALID_QUANTITY", `${item.name} allows up to ${item.maxQuantity}`);
      }
      return { id, name: item.name, unit: item.unit, quantity, unitPrice: item.price, subtotal: item.price * quantity };
    });
    const decorationsTotal = decorations.reduce((sum, d) => sum + d.subtotal, 0);

    let removal = null;
    if (input.removal?.id !== undefined) {
      const item = await CatalogItem.findOne({ where: { id: input.removal.id, type: "REMOVAL", active: true } });
      if (!item) throw bad("INVALID_REMOVAL", "Removal option not found");
      const nailCount = input.removal.nailCount;
      if (!nailCount) throw bad("INVALID_REMOVAL", "nailCount is required for removal");
      removal = { id: item.id, name: item.name, nailCount, unitPrice: item.price, subtotal: item.price * nailCount };
    } else if (input.removal) {
      throw bad("INVALID_REMOVAL", "removal id is required");
    }

    return {
      technique: { id: technique.id, name: technique.name, price: technique.price },
      length: { value: input.length, charge: lengthCharge },
      extraTones: { count: input.extraTones, unitPrice: toneUnitPrice, charge: tonesCharge },
      decorations,
      decorationsTotal,
      removal,
      estimatedTotal: technique.price + lengthCharge + tonesCharge + decorationsTotal + (removal?.subtotal ?? 0),
    };
  }
}