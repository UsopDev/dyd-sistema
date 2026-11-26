import { z } from "zod"

export const estadoMaquinaSchema = z.enum([
  "OPERATIVA",
  "EN_MANTENIMIENTO",
  "FUERA_DE_SERVICIO",
])

export const crearMaquinaSchema = z.object({
  id_cliente: z.uuid().nullable().optional(),
  codigo: z.string().trim().min(1).max(30).nullable().optional(),
  nombre: z.string().trim().min(1).max(100),
  tipo: z.string().trim().max(50).nullable().optional(),
  marca: z.string().trim().max(50).nullable().optional(),
  modelo: z.string().trim().max(50).nullable().optional(),
  nro_serie: z.string().trim().max(50).nullable().optional(),
  es_propia: z.boolean().optional(),
  horas_uso: z.number().int().min(0).max(999999999).optional(),
  estado: estadoMaquinaSchema.optional(),
})

export const actualizarMaquinaSchema = crearMaquinaSchema
  .partial()
  .refine((datos) => Object.keys(datos).length > 0, {
    message: "Envía al menos un campo",
  })

export const listarMaquinasSchema = z.object({
  q: z.string().trim().max(100).optional(),
  estado: z.enum(["OPERATIVA", "EN_MANTENIMIENTO", "FUERA_DE_SERVICIO"]).optional(),
  id_cliente: z.uuid().optional(),
  es_propia: z.enum(["true", "false"]).optional(),
  horas_min: z.coerce.number().int().min(0).optional(),
  horas_max: z.coerce.number().int().min(0).optional(),
  pagina: z.coerce.number().int().min(1).default(1),
  limite: z.coerce.number().int().min(1).max(100).default(20),
})

export const idSchema = z.object({ id: z.uuid() })

export type CrearMaquinaInput = z.infer<typeof crearMaquinaSchema>
export type ActualizarMaquinaInput = z.infer<typeof actualizarMaquinaSchema>
export type ListarMaquinasInput = z.infer<typeof listarMaquinasSchema>
export type EstadoMaquina = z.infer<typeof estadoMaquinaSchema>
