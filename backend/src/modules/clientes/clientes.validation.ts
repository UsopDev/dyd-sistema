import { z } from "zod"

const texto = (max: number) => z.string().trim().min(1).max(max).nullable().optional()

export const crearClienteSchema = z.object({
  razon_social: z.string().trim().min(1).max(150),
  ruc_dni: z.string().trim().min(1).max(15).nullable().optional(),
  contacto: z.string().trim().max(100).nullable().optional(),
  telefono: z.string().trim().max(20).nullable().optional(),
  email: z.email().max(120).nullable().optional(),
  direccion: z.string().trim().max(200).nullable().optional(),
})

export const actualizarClienteSchema = crearClienteSchema
  .partial()
  .extend({ activo: z.boolean().optional() })
  .refine((datos) => Object.keys(datos).length > 0, { message: "Envía al menos un campo" })

export const listarClientesSchema = z.object({
  q: z.string().trim().max(100).optional(),
  activo: z.enum(["true", "false"]).optional(),
  pagina: z.coerce.number().int().min(1).default(1),
  limite: z.coerce.number().int().min(1).max(100).default(20),
})

export const idSchema = z.object({ id: z.uuid() })

export type CrearClienteInput = z.infer<typeof crearClienteSchema>
export type ActualizarClienteInput = z.infer<typeof actualizarClienteSchema>
export type ListarClientesInput = z.infer<typeof listarClientesSchema>
