
import type { Request, Response } from "express";
import { QuoteModel } from "../models/quote.model.js";

interface QuoteOptionRequest {
  option_id: number;
  quantity: number;
  nails?: number;
}

interface RemovalRequest {
  material_id: number;
  nails: number;
  at_lenoir: boolean;
}

interface QuoteRequest {
  technique_id?: number;
  length?: number;
  tones?: number;
  options?: QuoteOptionRequest[];
  removal?: RemovalRequest;
}

export class QuoteController {
  static async calculate(req: Request, res: Response): Promise<void> {
    try {
      const serviceId = Number(req.params.id);
      const body = req.body as QuoteRequest;

      if (!Number.isInteger(serviceId) || serviceId < 1 || serviceId > 3) {
        res.status(400).json({
          status: "error",
          message: "El servicio debe ser Aplicación, Relleno o Retiro."
        });
        return;
      }

      const options = body.options ?? [];

      if (!Array.isArray(options)) {
        res.status(400).json({
          status: "error",
          message: "Las opciones deben enviarse como una lista."
        });
        return;
      }

      // Retiro independiente: no requiere técnica, largo, tonos ni extras.
      if (serviceId === 3) {
        if (
          body.technique_id !== undefined ||
          body.length !== undefined ||
          body.tones !== undefined ||
          options.length > 0
        ) {
          res.status(400).json({
            status: "error",
            message: "El retiro no admite técnica, largo, tonos ni decoraciones."
          });
          return;
        }

        if (
          !body.removal ||
          !Number.isInteger(body.removal.material_id) ||
          body.removal.material_id <= 0 ||
          !Number.isInteger(body.removal.nails) ||
          body.removal.nails < 1 ||
          body.removal.nails > 10 ||
          typeof body.removal.at_lenoir !== "boolean"
        ) {
          res.status(400).json({
            status: "error",
            message: "Indica el material, la cantidad de uñas y si la aplicación anterior fue en LenoirStudio."
          });
          return;
        }

        const material = await QuoteModel.findRemovalMaterialById(
          body.removal.material_id
        );

        if (!material) {
          res.status(400).json({
            status: "error",
            message: "El material de retiro seleccionado no existe."
          });
          return;
        }

        const unitPrice = body.removal.at_lenoir
          ? Number(material.lenoir_price_per_nail)
          : Number(material.price_per_nail);

        const subtotal = Number(
          (unitPrice * body.removal.nails).toFixed(2)
        );

        const quoteDetails = {
          schema_version: 1,
          currency: "MXN",
          service: {
            service_id: 3,
            name: "Retiro"
          },
          selections: {
            removal: {
              required: true,
              material_id: material.material_id,
              material_name: material.name,
              nails: body.removal.nails,
              at_lenoir: body.removal.at_lenoir
            }
          },
          pricing: {
            removal: {
              unit_price: unitPrice,
              quantity: body.removal.nails,
              subtotal
            },
            estimated_total: subtotal
          },
          admin_quote: {
            reviewed: false,
            final_price: null,
            adjustment_note: null
          }
        };

        res.status(200).json({
          status: "success",
          data: quoteDetails
        });
        return;
      }

      // Aplicación y Relleno requieren técnica válida.
      if (
        !Number.isInteger(body.technique_id) ||
        body.technique_id! <= 0
      ) {
        res.status(400).json({
          status: "error",
          message: "Debes indicar una técnica válida."
        });
        return;
      }

      const tones = body.tones ?? 4;

      if (
        !Number.isInteger(tones) ||
        tones < 1 ||
        tones > 20
      ) {
        res.status(400).json({
          status: "error",
          message: "La cantidad de tonos debe estar entre 1 y 20."
        });
        return;
      }

      if (body.removal !== undefined && serviceId !== 1) {
        res.status(400).json({
          status: "error",
          message: "El retiro previo solo se puede añadir a una Aplicación."
        });
        return;
      }

      const base = await QuoteModel.findBasePrice(
        serviceId,
        body.technique_id!
      );

      if (!base) {
        res.status(400).json({
          status: "error",
          message: "La técnica no está disponible para este servicio."
        });
        return;
      }

      // Validar largo según la técnica configurada.
      let lengthCost = 0;
      const hasLengthRules =
        base.min_length !== null || base.max_length !== null;

      if (hasLengthRules) {
        if (
          !Number.isInteger(body.length) ||
          body.length === undefined ||
          (base.min_length !== null &&
            body.length < base.min_length) ||
          (base.max_length !== null &&
            body.length > base.max_length)
        ) {
          res.status(400).json({
            status: "error",
            message: "El largo no está permitido para esta técnica."
          });
          return;
        }

        if (
          base.length_natural_only === 1 &&
          body.length > (base.included_length_through ?? 3)
        ) {
          res.status(400).json({
            status: "error",
            message: "Esta técnica solo permite largo natural hasta el nivel 3."
          });
          return;
        }

        if (
          base.included_length_through !== null &&
          body.length > base.included_length_through
        ) {
          lengthCost =
            (body.length - base.included_length_through) *
            Number(base.length_increment);
        }
      } else if (body.length !== undefined) {
        res.status(400).json({
          status: "error",
          message: "Esta técnica no permite seleccionar un largo."
        });
        return;
      }

      // Precio de los tonos adicionales consultado desde el catálogo.
      const extraTones = Math.max(0, tones - base.included_tones);
      const extraToneOption = await QuoteModel.findExtraToneOption();

      if (extraTones > 0 && !extraToneOption) {
        res.status(500).json({
          status: "error",
          message: "No está configurado el precio de los tonos adicionales."
        });
        return;
      }

      const toneUnitPrice = extraToneOption
        ? Number(extraToneOption.unit_price)
        : 0;

      const toneCost = Number(
        (extraTones * toneUnitPrice).toFixed(2)
      );

      let optionsCost = 0;

      const optionDetails: {
        option_id: number;
        name: string;
        category: string;
        unit_type: string;
        quantity: number;
        nails?: number;
        unit_price: number;
        subtotal: number;
      }[] = [];

      for (const requested of options) {
        if (
          !Number.isInteger(requested.option_id) ||
          requested.option_id <= 0 ||
          !Number.isInteger(requested.quantity) ||
          requested.quantity <= 0 ||
          requested.quantity > 100 ||
          (requested.nails !== undefined &&
            (!Number.isInteger(requested.nails) ||
              requested.nails < 1 ||
              requested.nails > 10))
        ) {
          res.status(400).json({
            status: "error",
            message: "Una de las opciones tiene cantidades no válidas."
          });
          return;
        }

        const option = await QuoteModel.findOptionById(
          requested.option_id
        );

        if (!option) {
          res.status(400).json({
            status: "error",
            message: `La opción ${requested.option_id} no existe.`
          });
          return;
        }

        // Los tonos adicionales se calculan una sola vez por separado.
        if (option.unit_type === "per_tone") {
          res.status(400).json({
            status: "error",
            message: "Los tonos adicionales se calculan automáticamente."
          });
          return;
        }

        const allowed = await QuoteModel.isOptionAllowed(
          serviceId,
          requested.option_id
        );

        if (!allowed) {
          res.status(400).json({
            status: "error",
            message: "Esta opción no está permitida para el servicio seleccionado."
          });
          return;
        }

        const unitPrice = Number(option.unit_price);
        let subtotal: number;

        if (option.unit_type === "per_nail") {
          if (
            requested.nails === undefined ||
            requested.nails > 10
          ) {
            res.status(400).json({
              status: "error",
              message: `Indica cuántas uñas llevan ${option.name} (de 1 a 10).`
            });
            return;
          }

          subtotal =
            unitPrice * requested.quantity * requested.nails;
        } else if (option.unit_type === "per_piece") {
          subtotal = unitPrice * requested.quantity;
        } else {
          // Opción de precio fijo: solo se cobra una vez.
          if (requested.quantity !== 1) {
            res.status(400).json({
              status: "error",
              message: `La opción ${option.name} se cobra una sola vez.`
            });
            return;
          }

          subtotal = unitPrice;
        }

        subtotal = Number(subtotal.toFixed(2));
        optionsCost += subtotal;

        optionDetails.push({
          option_id: option.option_id,
          name: option.name,
          category: option.category,
          unit_type: option.unit_type,
          quantity: requested.quantity,
          ...(requested.nails !== undefined
            ? { nails: requested.nails }
            : {}),
          unit_price: unitPrice,
          subtotal
        });
      }

      // El retiro previo solo puede sumarse a Aplicación.
      let removalDetails = null;
      let removalCost = 0;

      if (body.removal !== undefined) {
        const removal = body.removal;

        if (
          !Number.isInteger(removal.material_id) ||
          removal.material_id <= 0 ||
          !Number.isInteger(removal.nails) ||
          removal.nails < 1 ||
          removal.nails > 10 ||
          typeof removal.at_lenoir !== "boolean"
        ) {
          res.status(400).json({
            status: "error",
            message: "Los datos del retiro previo no son válidos."
          });
          return;
        }

        const material = await QuoteModel.findRemovalMaterialById(
          removal.material_id
        );

        if (!material) {
          res.status(400).json({
            status: "error",
            message: "El material de retiro seleccionado no existe."
          });
          return;
        }

        const unitPrice = removal.at_lenoir
          ? Number(material.lenoir_price_per_nail)
          : Number(material.price_per_nail);

        removalCost = Number(
          (unitPrice * removal.nails).toFixed(2)
        );

        removalDetails = {
          required: true,
          material_id: material.material_id,
          material_name: material.name,
          nails: removal.nails,
          at_lenoir: removal.at_lenoir,
          unit_price: unitPrice,
          subtotal: removalCost
        };
      }

      const basePrice = Number(base.base_price);
      const estimatedTotal = Number(
        (
          basePrice +
          lengthCost +
          toneCost +
          optionsCost +
          removalCost
        ).toFixed(2)
      );

      const quoteDetails = {
        schema_version: 1,
        currency: "MXN",
        service: {
          service_id: base.service_id,
          name: base.service_name,
          technique_id: base.technique_id,
          technique_name: base.technique_name
        },
        selections: {
          length: body.length ?? null,
          tones_count: tones,
          extras: optionDetails,
          removal: removalDetails ?? {
            required: false,
            material_id: null,
            material_name: null,
            nails: null,
            at_lenoir: null
          }
        },
        pricing: {
          base_price: basePrice,
          included_tones: base.included_tones,
          extra_tones: {
            option_id: extraToneOption?.option_id ?? null,
            quantity: extraTones,
            unit_price: toneUnitPrice,
            subtotal: toneCost
          },
          length_adjustment: {
            levels_charged:
              base.included_length_through !== null &&
              body.length !== undefined
                ? Math.max(0, body.length - base.included_length_through)
                : 0,
            increment_per_level: Number(base.length_increment),
            subtotal: Number(lengthCost.toFixed(2))
          },
          extras_subtotal: Number(optionsCost.toFixed(2)),
          removal_subtotal: removalCost,
          estimated_total: estimatedTotal
        },
        admin_quote: {
          reviewed: false,
          final_price: null,
          adjustment_note: null
        }
      };

      res.status(200).json({
        status: "success",
        data: quoteDetails
      });
    } catch (error) {
      console.error("Error al calcular la cotización:", error);

      res.status(500).json({
        status: "error",
        message: "No fue posible calcular la cotización."
      });
    }
  }
}