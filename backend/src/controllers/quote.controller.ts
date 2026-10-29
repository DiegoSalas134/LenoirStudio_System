import type { Request, Response } from "express";
import { QuoteService } from "../services/quote.service.ts";

export class QuoteController {
  static catalog = async (_req: Request, res: Response): Promise<void> => {
    res.status(200).json(await QuoteService.getCatalog());
  };

  static calculate = async (req: Request, res: Response): Promise<void> => {
    const { techniqueId, length, extraTones = 0, decorations = [], removal = null } = req.body;
    const quote = await QuoteService.calculate({ techniqueId, length, extraTones, decorations, removal });
    res.status(200).json(quote);
  };
    static save = async (req: Request, res: Response): Promise<void> => {
    const { techniqueId, length, extraTones = 0, decorations = [], removal = null } = req.body;
    const saved = await QuoteService.save({ techniqueId, length, extraTones, decorations, removal });
    res.status(201).json(saved);
  };

  static list = async (_req: Request, res: Response): Promise<void> => {
    res.status(200).json(await QuoteService.list());
  };
}