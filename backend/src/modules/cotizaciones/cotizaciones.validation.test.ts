import { describe, it, expect } from 'vitest'
import { z } from 'zod'

// Recreate the schemas exactly as in the routes file
const MAXIMO = 99999999.99

const lineaSchema = z
  .object({
    tipo: z.enum(["SERVICIO", "MATERIAL"]),
    descripcion: z.string().trim().min(1).max(200).optional(),
    id_material: z.uuid().optional(),
    cantidad: z.number().positive().max(MAXIMO),
    precio_unitario: z.number().min(0).max(MAXIMO).optional(),
  })
  .superRefine((linea, ctx) => {
    if (linea.tipo === "SERVICIO") {
      if (linea.id_material) {
        ctx.addIssue({ code: "custom", message: "Un servicio no lleva material", path: ["id_material"] })
      }
      if (!linea.descripcion) {
        ctx.addIssue({ code: "custom", message: "La descripción es obligatoria", path: ["descripcion"] })
      }
      if (linea.precio_unitario === undefined) {
        ctx.addIssue({ code: "custom", message: "El precio es obligatorio", path: ["precio_unitario"] })
      }
    } else if (!linea.id_material) {
      ctx.addIssue({ code: "custom", message: "Indica el material", path: ["id_material"] })
    }
  })

const crearSchema = z.object({
  id_solicitud: z.uuid(),
  observaciones: z.string().trim().min(1).max(2000).nullable().optional(),
  detalles: z.array(lineaSchema).min(1).max(50),
})

const actualizarSchema = z
  .object({
    observaciones: z.string().trim().min(1).max(2000).nullable().optional(),
    detalles: z.array(lineaSchema).min(1).max(50).optional(),
  })
  .refine((datos) => Object.keys(datos).length > 0, { message: "Envía al menos un campo" })

const listarSchema = z.object({
  id_solicitud: z.uuid().optional(),
  q: z.string().trim().max(50).optional(),
  total_min: z.coerce.number().min(0).optional(),
  total_max: z.coerce.number().min(0).optional(),
  pagina: z.coerce.number().int().min(1).default(1),
  limite: z.coerce.number().int().min(1).max(100).default(20),
})

const idSchema = z.object({ id: z.uuid() })

const UUID_VALIDO = '550e8400-e29b-41d4-a716-446655440000'

describe('Cotizaciones - Validaciones Zod', () => {
  describe('lineaSchema', () => {
    describe('SERVICIO', () => {
      it('debe validar un servicio completo correcto', () => {
        const datos = {
          tipo: 'SERVICIO' as const,
          descripcion: 'Reparación de motor',
          cantidad: 1,
          precio_unitario: 150.50,
        }
        const resultado = lineaSchema.safeParse(datos)
        expect(resultado.success).toBe(true)
      })

      it('debe requerir descripcion en SERVICIO', () => {
        const datos = { tipo: 'SERVICIO' as const, cantidad: 1, precio_unitario: 100 }
        const resultado = lineaSchema.safeParse(datos)
        expect(resultado.success).toBe(false)
        if (!resultado.success) {
          expect(resultado.error.issues.some(i => i.path.includes('descripcion'))).toBe(true)
        }
      })

      it('debe requerir precio_unitario en SERVICIO', () => {
        const datos = { tipo: 'SERVICIO' as const, descripcion: 'Reparación', cantidad: 1 }
        const resultado = lineaSchema.safeParse(datos)
        expect(resultado.success).toBe(false)
        if (!resultado.success) {
          expect(resultado.error.issues.some(i => i.path.includes('precio_unitario'))).toBe(true)
        }
      })

      it('debe rechazar id_material en SERVICIO', () => {
        const datos = { 
          tipo: 'SERVICIO' as const, 
          descripcion: 'Reparación', 
          cantidad: 1, 
          precio_unitario: 100,
          id_material: '550e8400-e29b-41d4-a716-446655440000'
        }
        const resultado = lineaSchema.safeParse(datos)
        expect(resultado.success).toBe(false)
        if (!resultado.success) {
          expect(resultado.error.issues.some(i => i.path.includes('id_material'))).toBe(true)
        }
      })

      it('debe validar cantidad > 0', () => {
        const datos = { 
          tipo: 'SERVICIO' as const, 
          descripcion: 'Test', 
          cantidad: 0, 
          precio_unitario: 100 
        }
        const resultado = lineaSchema.safeParse(datos)
        expect(resultado.success).toBe(false)
      })

      it('debe validar precio_unitario >= 0', () => {
        const datos = { 
          tipo: 'SERVICIO' as const, 
          descripcion: 'Test', 
          cantidad: 1, 
          precio_unitario: -10 
        }
        const resultado = lineaSchema.safeParse(datos)
        expect(resultado.success).toBe(false)
      })
    })

    describe('MATERIAL', () => {
      it('debe validar un material correcto', () => {
        const datos = {
          tipo: 'MATERIAL' as const,
          id_material: '550e8400-e29b-41d4-a716-446655440000',
          cantidad: 5,
          precio_unitario: 50.00,
        }
        const resultado = lineaSchema.safeParse(datos)
        expect(resultado.success).toBe(true)
      })

      it('debe requerir id_material en MATERIAL', () => {
        const datos = { tipo: 'MATERIAL' as const, cantidad: 5, precio_unitario: 50 }
        const resultado = lineaSchema.safeParse(datos)
        expect(resultado.success).toBe(false)
        if (!resultado.success) {
          expect(resultado.error.issues.some(i => i.path.includes('id_material'))).toBe(true)
        }
      })

      it('debe aceptar MATERIAL sin precio_unitario (usa precio del material)', () => {
        const datos = { 
          tipo: 'MATERIAL' as const, 
          id_material: '550e8400-e29b-41d4-a716-446655440000',
          cantidad: 5 
        }
        const resultado = lineaSchema.safeParse(datos)
        expect(resultado.success).toBe(true)
      })

      it('debe validar cantidad > 0 en MATERIAL', () => {
        const datos = { 
          tipo: 'MATERIAL' as const, 
          id_material: '550e8400-e29b-41d4-a716-446655440000',
          cantidad: 0 
        }
        const resultado = lineaSchema.safeParse(datos)
        expect(resultado.success).toBe(false)
      })

      it('debe validar precio_unitario >= 0 si se envía', () => {
        const datos = { 
          tipo: 'MATERIAL' as const, 
          id_material: '550e8400-e29b-41d4-a716-446655440000',
          cantidad: 5,
          precio_unitario: -10
        }
        const resultado = lineaSchema.safeParse(datos)
        expect(resultado.success).toBe(false)
      })
    })
  })

  describe('crearSchema', () => {
    it('debe validar cotización completa correcta', () => {
      const datos = {
        id_solicitud: '550e8400-e29b-41d4-a716-446655440000',
        observaciones: 'Cotización para reparación',
        detalles: [
          { tipo: 'SERVICIO' as const, descripcion: 'Reparación motor', cantidad: 1, precio_unitario: 200 },
          { tipo: 'MATERIAL' as const, id_material: '550e8400-e29b-41d4-a716-446655440000', cantidad: 5, precio_unitario: 50 }
        ]
      }
      const resultado = crearSchema.safeParse(datos)
      expect(resultado.success).toBe(true)
    })

    it('debe requerir id_solicitud', () => {
      const datos = { detalles: [{ tipo: 'SERVICIO' as const, descripcion: 'Test', cantidad: 1, precio_unitario: 100 }] }
      const resultado = crearSchema.safeParse(datos)
      expect(resultado.success).toBe(false)
      if (!resultado.success) {
        expect(resultado.error.issues.some(i => i.path.includes('id_solicitud'))).toBe(true)
      }
    })

    it('debe requerir al menos un detalle', () => {
      const datos = { id_solicitud: '550e8400-e29b-41d4-a716-446655440000', detalles: [] }
      const resultado = crearSchema.safeParse(datos)
      expect(resultado.success).toBe(false)
    })

    it('debe rechazar más de 50 detalles', () => {
      const detalles = Array(51).fill({ tipo: 'SERVICIO' as const, descripcion: 'Test', cantidad: 1, precio_unitario: 100 })
      const datos = { id_solicitud: '550e8400-e29b-41d4-a716-446655440000', detalles }
      const resultado = crearSchema.safeParse(datos)
      expect(resultado.success).toBe(false)
    })

    it('debe validar observaciones opcionales', () => {
      const datos = {
        id_solicitud: '550e8400-e29b-41d4-a716-446655440000',
        observaciones: 'Nota importante',
        detalles: [{ tipo: 'SERVICIO' as const, descripcion: 'Test', cantidad: 1, precio_unitario: 100 }]
      }
      const resultado = crearSchema.safeParse(datos)
      expect(resultado.success).toBe(true)
    })

    it('debe aceptar observaciones nulas', () => {
      const datos = {
        id_solicitud: '550e8400-e29b-41d4-a716-446655440000',
        observaciones: null,
        detalles: [{ tipo: 'SERVICIO' as const, descripcion: 'Test', cantidad: 1, precio_unitario: 100 }]
      }
      const resultado = crearSchema.safeParse(datos)
      expect(resultado.success).toBe(true)
    })
  })

  describe('actualizarSchema', () => {
    it('debe permitir actualización parcial solo observaciones', () => {
      const datos = { observaciones: 'Nueva observación' }
      const resultado = actualizarSchema.safeParse(datos)
      expect(resultado.success).toBe(true)
    })

    it('debe permitir actualización parcial solo detalles', () => {
      const datos = { detalles: [{ tipo: 'SERVICIO' as const, descripcion: 'Nueva', cantidad: 1, precio_unitario: 100 }] }
      const resultado = actualizarSchema.safeParse(datos)
      expect(resultado.success).toBe(true)
    })

    it('debe rechazar objeto vacío', () => {
      const resultado = actualizarSchema.safeParse({})
      expect(resultado.success).toBe(false)
    })

    it('debe validar detalles si se envían', () => {
      const datos = { detalles: [{ tipo: 'SERVICIO' as const, cantidad: 1 }] } // falta descripcion y precio
      const resultado = actualizarSchema.safeParse(datos)
      expect(resultado.success).toBe(false)
    })

    it('debe permitir observaciones nulas', () => {
      const datos = { observaciones: null }
      const resultado = actualizarSchema.safeParse(datos)
      expect(resultado.success).toBe(true)
    })
  })

  describe('listarSchema', () => {
    it('debe aplicar valores por defecto', () => {
      const resultado = listarSchema.safeParse({})
      expect(resultado.success).toBe(true)
      if (resultado.success) {
        expect(resultado.data.pagina).toBe(1)
        expect(resultado.data.limite).toBe(20)
      }
    })

    it('debe validar filtros opcionales', () => {
      const datos = { q: 'cotización', total_min: 100, total_max: 1000, pagina: 2, limite: 50 }
      const resultado = listarSchema.safeParse(datos)
      expect(resultado.success).toBe(true)
    })

    it('debe rechazar página < 1', () => {
      const resultado = listarSchema.safeParse({ pagina: 0 })
      expect(resultado.success).toBe(false)
    })

    it('debe rechazar límite > 100', () => {
      const resultado = listarSchema.safeParse({ limite: 101 })
      expect(resultado.success).toBe(false)
    })

    it('debe rechazar total_min negativo', () => {
      const resultado = listarSchema.safeParse({ total_min: -1 })
      expect(resultado.success).toBe(false)
    })
  })

  describe('idSchema', () => {
    it('debe validar UUID válido', () => {
      const resultado = z.object({ id: z.uuid() }).safeParse({ id: '550e8400-e29b-41d4-a716-446655440000' })
      expect(resultado.success).toBe(true)
    })

    it('debe rechazar UUID inválido', () => {
      const resultado = z.object({ id: z.uuid() }).safeParse({ id: 'no-es-uuid' })
      expect(resultado.success).toBe(false)
    })
  })
})
