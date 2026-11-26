import { z } from "zod"

const MAXIMO = 99999999.99

export const crearMaterialSchema = z.object({
  codigo: z.string().trim().max(30).optional(),
  nombre: z.string().trim().min(1).max(100),
  unidad: z.string().trim().min(1).max(20),
  stock_minimo: z.number().min(0).max(MAXIMO).optional(),
  precio_unitario: z.number().min(0).max(MAXIMO).nullable().optional(),
})

export const actualizarMaterialSchema = crearMaterialSchema
  .partial()
  .extend({ activo: z.boolean().optional() })
  .refine((datos) => Object.keys(datos).length > 0, {
    message: "Envía al menos un campo",
  })

export const listarMaterialesSchema = z.object({
  q: z.string().trim().max(100).optional(),
  activo: z.enum(["true", "false"]).optional(),
  pagina: z.coerce.number().int().min(1).default(1),
  limite: z.coerce.number().int().min(1).max(100).default(20),
})

export const movimientoInventarioSchema = z.object({
  tipo: z.enum(["ENTRADA", "SALIDA"]),
  cantidad: z.number().positive().max(MAXIMO),
  motivo: z.string().trim().min(1).max(150).optional(),
})

export const idSchema = z.object({ id: z.uuid() })

export type CrearMaterialInput = z.infer<typeof crearMaterialSchema>
export type ActualizarMaterialInput = z.infer<typeof actualizarMaterialSchema>
export type ListarMaterialesInput = z.infer<typeof listarMaterialesSchema>
export type MovimientoInventarioInput = z.infer<typeof movimientoInventarioSchema>
