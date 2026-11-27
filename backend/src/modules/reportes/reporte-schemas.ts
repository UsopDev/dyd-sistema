import { z } from "zod";

/**
 * Schema de filtros del reporte operativo de órdenes de trabajo.
 * Los strings vacíos (envío del front cuando no hay filtro) se convierten
 * en `undefined` para que no fallen las validaciones de uuid() / enum().
 */
const limpiarVacios = <T extends z.ZodTypeAny>(schema: T) =>
  z.preprocess((val) => (val === "" ? undefined : val), schema);

export const filtroReporteOrdenesSchema = z.object({
  fecha_desde: z.iso.date().optional().describe("Fecha de creación desde (YYYY-MM-DD)"),
  fecha_hasta: z.iso.date().optional().describe("Fecha de creación hasta (YYYY-MM-DD)"),
  id_cliente: limpiarVacios(z.string().uuid().optional()).describe("UUID del cliente"),
  id_tecnico: limpiarVacios(z.string().uuid().optional()).describe("UUID del técnico"),
  estado: limpiarVacios(
    z.enum(["PENDIENTE", "EN_PROCESO", "FINALIZADA", "CANCELADA"]).optional()
  ).describe("Estado de la orden"),
  tipo_servicio: limpiarVacios(
    z.enum(["PREVENTIVO", "CORRECTIVO"]).optional()
  ).describe("Tipo de servicio"),
  prioridad: limpiarVacios(
    z.enum(["ALTA", "MEDIA", "BAJA"]).optional()
  ).describe("Prioridad"),
  q: z.string().max(200).optional().describe("Búsqueda por texto"),
});

export type FiltrosReporteOrdenes = z.infer<typeof filtroReporteOrdenesSchema>;
