import { z } from "zod";

/**
 * Esquema de rango de fechas genérico (campos: fecha_desde, fecha_hasta).
 */
export const rangoFechaSchema = z.object({
  fecha_desde: z.iso.date().optional().describe("Fecha inicio (YYYY-MM-DD)"),
  fecha_hasta: z.iso.date().optional().describe("Fecha fin (YYYY-MM-DD)"),
}).refine(
  (data) => !data.fecha_desde || !data.fecha_hasta || data.fecha_desde <= data.fecha_hasta,
  { message: "fecha_desde debe ser anterior o igual a fecha_hasta", path: ["fecha_desde"] }
);

/**
 * Crea un ZodObject con múltiples rangos de fecha, cada uno con su validación.
 * Se usa con .merge() para combinar con el esquema base.
 */
export function rangosFechaCampos(...campos: string[]) {
  const shape: Record<string, z.ZodOptional<z.ZodISODate>> = {};
  const refinements: Array<{ campo: string; desdeKey: string; hastaKey: string }> = [];

  for (const campo of campos) {
    const desdeKey = `${campo}_desde` as const;
    const hastaKey = `${campo}_hasta` as const;
    shape[desdeKey] = z.iso.date().optional().describe(`${campo} inicio (YYYY-MM-DD)`);
    shape[hastaKey] = z.iso.date().optional().describe(`${campo} fin (YYYY-MM-DD)`);
    refinements.push({ campo, desdeKey, hastaKey });
  }

  return z.object(shape).superRefine((data, ctx) => {
    for (const { campo, desdeKey, hastaKey } of refinements) {
      const desde = data[desdeKey] as string | undefined;
      const hasta = data[hastaKey] as string | undefined;
      if (desde && hasta && desde > hasta) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `${campo}_desde debe ser anterior o igual a ${campo}_hasta`,
          path: [desdeKey],
        });
      }
    }
  });
}

/**
 * Convierte un YYYY-MM-DD en un Date en la zona horaria local del servidor.
 * No usar `new Date("YYYY-MM-DD")` porque lo interpreta como UTC y luego
 * `setHours` lo pasa a local, corriendo el rango un día hacia atrás.
 */
function fechaLocal(valor: string, finDeDia: boolean): Date {
  const [anio, mes, dia] = valor.split("-").map(Number);
  return finDeDia
    ? new Date(anio, mes - 1, dia, 23, 59, 59, 999)
    : new Date(anio, mes - 1, dia, 0, 0, 0, 0);
}

/**
 * Helper para construir cláusula where de Prisma para un rango de fechas inclusive.
 * fecha_hasta se interpreta como fin de día (23:59:59.999) en hora local.
 */
export function whereRangoFecha(campo: string, desde?: string, hasta?: string): Record<string, unknown> {
  const where: Record<string, unknown> = {};
  if (desde || hasta) {
    const campoWhere: Record<string, unknown> = {};
    if (desde) campoWhere.gte = fechaLocal(desde, false);
    if (hasta) campoWhere.lte = fechaLocal(hasta, true);
    where[campo] = campoWhere;
  }
  return Object.keys(where).length ? where : {};
}

/**
 * Igual que `whereRangoFecha`, pero para columnas `@db.Date` (sin hora).
 * Prisma las lee/escribe como medianoche UTC, así que el rango también
 * debe construirse en UTC para no correrse un día según la zona horaria.
 */
export function whereRangoFechaDia(campo: string, desde?: string, hasta?: string): Record<string, unknown> {
  const where: Record<string, unknown> = {};
  if (desde || hasta) {
    const campoWhere: Record<string, unknown> = {};
    if (desde) campoWhere.gte = new Date(`${desde}T00:00:00.000Z`);
    if (hasta) campoWhere.lte = new Date(`${hasta}T23:59:59.999Z`);
    where[campo] = campoWhere;
  }
  return Object.keys(where).length ? where : {};
}

/**
 * Combina múltiples rangos de fecha en un solo where.
 */
export function whereRangosFecha(rangos: Array<{ campo: string; desde?: string; hasta?: string }>): Record<string, unknown> {
  const combined: Record<string, unknown> = {};
  for (const r of rangos) {
    const w = whereRangoFecha(r.campo, r.desde, r.hasta);
    for (const [key, value] of Object.entries(w)) {
      combined[key] = value;
    }
  }
  return combined;
}

/**
 * Tipo que representa los filtros de fecha expandidos para un campo.
 */
export type FiltrosFechaCampo<T extends string> = {
  [K in `${T}_desde` | `${T}_hasta`]?: string;
};

/**
 * Tipo base para filtros de lista con paginación.
 */
export interface FiltrosBase {
  pagina: number;
  limite: number;
}