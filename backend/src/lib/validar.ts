import type { Response } from "express";
import { z } from "zod";

// Valida datos con un esquema Zod. Si son inválidos responde 400 y devuelve null.
export function validar<T extends z.ZodType>(
  schema: T,
  datos: unknown,
  res: Response,
): z.output<T> | null {
  const resultado = schema.safeParse(datos);

  if (!resultado.success) {
    res.status(400).json({ error: "Datos inválidos", detalles: z.flattenError(resultado.error) });
    return null;
  }

  return resultado.data;
}
