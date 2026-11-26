import { describe, it, expect } from 'vitest'
import { z } from 'zod'

// Recreate the schemas exactly as in the routes file
const estadoGeneralSchema = z.enum(["BUENO", "REGULAR", "MALO", "CRITICO"])
const textoOpcional = z.string().trim().min(1).max(5000).nullable().optional()

const crearSchema = z.object({
  id_solicitud: z.uuid(),
  estado_general: estadoGeneralSchema,
  fallas_detectadas: z.string().trim().min(3).max(5000),
  observaciones: z.string().trim().max(5000).nullable().optional(),
  recomendaciones: z.string().trim().max(5000).nullable().optional(),
})

const actualizarSchema = z.object({
  estado_general: z.enum(["BUENO", "REGULAR", "MALO", "CRITICO"]).optional(),
  fallas_detectadas: z.string().trim().min(3).max(5000).optional(),
  observaciones: z.string().trim().max(5000).nullable().optional(),
  recomendaciones: z.string().trim().max(5000).nullable().optional(),
}).refine((datos) => Object.keys(datos).length > 0, { message: "Envía al menos un campo" })

const idSchema = z.object({ id: z.uuid() })

const UUID_VALIDO = '550e8400-e29b-41d4-a716-446655440000'

describe('Diagnósticos - Validaciones Zod', () => {
  describe('crearSchema', () => {
    it('debe validar un diagnóstico completo correcto', () => {
      const datos = {
        id_solicitud: UUID_VALIDO,
        estado_general: 'BUENO',
        fallas_detectadas: 'Motor hace ruido extraño',
        observaciones: 'Revisar rodamientos',
        recomendaciones: 'Cambiar rodamientos',
      }
      const resultado = crearSchema.safeParse(datos)
      expect(resultado.success).toBe(true)
    })

    it('debe requerir id_solicitud', () => {
      const datos = { estado_general: 'BUENO', fallas_detectadas: 'Test' }
      const resultado = crearSchema.safeParse(datos)
      expect(resultado.success).toBe(false)
      if (!resultado.success) {
        expect(resultado.error.issues.some(i => i.path.includes('id_solicitud'))).toBe(true)
      }
    })

    it('debe requerir estado_general', () => {
      const datos = { id_solicitud: UUID_VALIDO, fallas_detectadas: 'Test' }
      const resultado = crearSchema.safeParse(datos)
      expect(resultado.success).toBe(false)
      if (!resultado.success) {
        expect(resultado.error.issues.some(i => i.path.includes('estado_general'))).toBe(true)
      }
    })

    it('debe validar estado_general válido (BUENO, REGULAR, MALO, CRITICO)', () => {
      const validos = ['BUENO', 'REGULAR', 'MALO', 'CRITICO']
      for (const estado of validos) {
        const datos = { id_solicitud: UUID_VALIDO, estado_general: estado, fallas_detectadas: 'Test' }
        const resultado = crearSchema.safeParse(datos)
        expect(resultado.success).toBe(true)
      }
    })

    it('debe rechazar estado_general inválido', () => {
      const datos = { id_solicitud: UUID_VALIDO, estado_general: 'ROTO', fallas_detectadas: 'Test' }
      const resultado = crearSchema.safeParse(datos)
      expect(resultado.success).toBe(false)
    })

    it('debe requerir fallas_detectadas (mín 3 chars)', () => {
      const datos = { id_solicitud: UUID_VALIDO, estado_general: 'BUENO', fallas_detectadas: 'ab' }
      const resultado = crearSchema.safeParse(datos)
      expect(resultado.success).toBe(false)
    })

    it('debe rechazar fallas_detectadas muy largas', () => {
      const datos = { id_solicitud: UUID_VALIDO, estado_general: 'BUENO', fallas_detectadas: 'a'.repeat(5001) }
      const resultado = crearSchema.safeParse(datos)
      expect(resultado.success).toBe(false)
    })

    it('debe aceptar observaciones y recomendaciones opcionales', () => {
      const datos = { 
        id_solicitud: UUID_VALIDO, 
        estado_general: 'BUENO', 
        fallas_detectadas: 'Test',
        observaciones: 'Obs',
        recomendaciones: 'Rec'
      }
      const resultado = crearSchema.safeParse(datos)
      expect(resultado.success).toBe(true)
    })

    it('debe aceptar observaciones y recomendaciones nulas', () => {
      const datos = { 
        id_solicitud: UUID_VALIDO, 
        estado_general: 'BUENO', 
        fallas_detectadas: 'Test',
        observaciones: null,
        recomendaciones: null,
      }
      const resultado = crearSchema.safeParse(datos)
      expect(resultado.success).toBe(true)
    })
  })

  describe('actualizarSchema', () => {
    it('debe permitir actualización parcial', () => {
      const datos = { estado_general: 'REGULAR' }
      const resultado = actualizarSchema.safeParse(datos)
      expect(resultado.success).toBe(true)
    })

    it('debe permitir actualizar solo fallas_detectadas', () => {
      const datos = { fallas_detectadas: 'Nueva falla detectada' }
      const resultado = actualizarSchema.safeParse(datos)
      expect(resultado.success).toBe(true)
    })

    it('debe rechazar objeto vacío', () => {
      const resultado = actualizarSchema.safeParse({})
      expect(resultado.success).toBe(false)
    })

    it('debe validar estado_general si se envía', () => {
      const datos = { estado_general: 'INVALIDO' }
      const resultado = actualizarSchema.safeParse(datos)
      expect(resultado.success).toBe(false)
    })
  })

  describe('idSchema', () => {
    it('debe validar UUID válido', () => {
      const resultado = z.object({ id: z.uuid() }).safeParse({ id: UUID_VALIDO })
      expect(resultado.success).toBe(true)
    })

    it('debe rechazar UUID inválido', () => {
      const resultado = z.object({ id: z.uuid() }).safeParse({ id: 'no-es-uuid' })
      expect(resultado.success).toBe(false)
    })
  })

  describe('estados válidos', () => {
    it('debe aceptar BUENO, REGULAR, MALO, CRITICO', () => {
      const validos = ['BUENO', 'REGULAR', 'MALO', 'CRITICO']
      for (const estado of validos) {
        expect(() => z.enum(["BUENO", "REGULAR", "MALO", "CRITICO"]).parse(estado)).not.toThrow()
      }
    })

    it('debe rechazar estado inválido', () => {
      expect(() => z.enum(["BUENO", "REGULAR", "MALO", "CRITICO"]).parse('ROTO')).toThrow()
    })
  })
})
