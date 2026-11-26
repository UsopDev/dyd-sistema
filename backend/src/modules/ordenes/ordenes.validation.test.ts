import { describe, it, expect } from 'vitest'
import { z } from 'zod'

// Recreate the schemas exactly as in the routes file
const MAXIMO = 99999999.99

const estadoSchema = z.enum(["PENDIENTE", "EN_PROCESO", "FINALIZADA", "CANCELADA"])

const crearSchema = z.object({
  id_solicitud: z.uuid(),
  id_tecnico: z.uuid(),
  monto: z.number().min(0).max(MAXIMO).optional(),
})

const materialSchema = z.object({
  id_material: z.uuid(),
  cantidad: z.number().positive().max(MAXIMO),
})

const finalizarSchema = z.object({
  trabajo_realizado: z.string().trim().min(5).max(5000),
  monto: z.number().min(0).max(MAXIMO).optional(),
})

const listarSchema = z
  .object({
    q: z.string().trim().max(50).optional(),
    estado: estadoSchema.optional(),
    id_tecnico: z.uuid().optional(),
    id_solicitud: z.uuid().optional(),
    monto_min: z.coerce.number().min(0).optional(),
    monto_max: z.coerce.number().min(0).optional(),
    pagina: z.coerce.number().int().min(1).default(1),
    limite: z.coerce.number().int().min(1).max(100).default(20),
  })
  .merge(
    z.object({
      creado_en_desde: z.string().optional(),
      creado_en_hasta: z.string().optional(),
      fecha_inicio_desde: z.string().optional(),
      fecha_inicio_hasta: z.string().optional(),
      fecha_fin_desde: z.string().optional(),
      fecha_fin_hasta: z.string().optional(),
      actualizado_en_desde: z.string().optional(),
      actualizado_en_hasta: z.string().optional(),
    })
  )

const idSchema = z.object({ id: z.uuid() })

const UUID_VALIDO = '550e8400-e29b-41d4-a716-446655440000'

describe('Órdenes - Validaciones Zod', () => {
  describe('crearSchema', () => {
    it('debe validar orden completa correcta', () => {
      const datos = {
        id_solicitud: '550e8400-e29b-41d4-a716-446655440000',
        id_tecnico: '550e8400-e29b-41d4-a716-446655440001',
        monto: 500.00,
      }
      const resultado = crearSchema.safeParse(datos)
      expect(resultado.success).toBe(true)
    })

    it('debe requerir id_solicitud', () => {
      const datos = { id_tecnico: '550e8400-e29b-41d4-a716-446655440001' }
      const resultado = crearSchema.safeParse(datos)
      expect(resultado.success).toBe(false)
      if (!resultado.success) {
        expect(resultado.error.issues.some(i => i.path.includes('id_solicitud'))).toBe(true)
      }
    })

    it('debe requerir id_tecnico', () => {
      const datos = { id_solicitud: '550e8400-e29b-41d4-a716-446655440000' }
      const resultado = crearSchema.safeParse(datos)
      expect(resultado.success).toBe(false)
      if (!resultado.success) {
        expect(resultado.error.issues.some(i => i.path.includes('id_tecnico'))).toBe(true)
      }
    })

    it('debe validar monto >= 0', () => {
      const datos = {
        id_solicitud: '550e8400-e29b-41d4-a716-446655440000',
        id_tecnico: '550e8400-e29b-41d4-a716-446655440001',
        monto: -100,
      }
      const resultado = crearSchema.safeParse(datos)
      expect(resultado.success).toBe(false)
    })

    it('debe validar monto <= MAXIMO', () => {
      const datos = {
        id_solicitud: '550e8400-e29b-41d4-a716-446655440000',
        id_tecnico: '550e8400-e29b-41d4-a716-446655440001',
        monto: 100000000000,
      }
      const resultado = crearSchema.safeParse(datos)
      expect(resultado.success).toBe(false)
    })

    it('debe aceptar monto opcional', () => {
      const datos = {
        id_solicitud: '550e8400-e29b-41d4-a716-446655440000',
        id_tecnico: '550e8400-e29b-41d4-a716-446655440001',
      }
      const resultado = crearSchema.safeParse(datos)
      expect(resultado.success).toBe(true)
    })

    it('debe validar UUIDs válidos', () => {
      const datos = {
        id_solicitud: 'no-es-uuid',
        id_tecnico: '550e8400-e29b-41d4-a716-446655440001',
      }
      const resultado = crearSchema.safeParse(datos)
      expect(resultado.success).toBe(false)
    })
  })

  describe('materialSchema', () => {
    it('debe validar material correcto', () => {
      const datos = {
        id_material: '550e8400-e29b-41d4-a716-446655440000',
        cantidad: 5,
      }
      const resultado = materialSchema.safeParse(datos)
      expect(resultado.success).toBe(true)
    })

    it('debe requerir id_material', () => {
      const datos = { cantidad: 5 }
      const resultado = materialSchema.safeParse(datos)
      expect(resultado.success).toBe(false)
      if (!resultado.success) {
        expect(resultado.error.issues.some(i => i.path.includes('id_material'))).toBe(true)
      }
    })

    it('debe requerir cantidad > 0', () => {
      const datos = { id_material: '550e8400-e29b-41d4-a716-446655440000', cantidad: 0 }
      const resultado = materialSchema.safeParse(datos)
      expect(resultado.success).toBe(false)
    })

    it('debe validar cantidad <= MAXIMO', () => {
      const datos = { id_material: '550e8400-e29b-41d4-a716-446655440000', cantidad: MAXIMO + 1 }
      const resultado = materialSchema.safeParse(datos)
      expect(resultado.success).toBe(false)
    })
  })

  describe('finalizarSchema', () => {
    it('debe validar finalización correcta', () => {
      const datos = {
        trabajo_realizado: 'Se reparó el motor y se cambiaron los rodamientos',
        monto: 250.50,
      }
      const resultado = finalizarSchema.safeParse(datos)
      expect(resultado.success).toBe(true)
    })

    it('debe requerir trabajo_realizado (mín 5 chars)', () => {
      const datos = { trabajo_realizado: 'Ok', monto: 100 }
      const resultado = finalizarSchema.safeParse(datos)
      expect(resultado.success).toBe(false)
    })

    it('debe rechazar trabajo_realizado muy largo (>5000)', () => {
      const datos = { trabajo_realizado: 'a'.repeat(5001), monto: 100 }
      const resultado = finalizarSchema.safeParse(datos)
      expect(resultado.success).toBe(false)
    })

    it('debe permitir monto opcional', () => {
      const datos = { trabajo_realizado: 'Se reparó el equipo correctamente' }
      const resultado = finalizarSchema.safeParse(datos)
      expect(resultado.success).toBe(true)
    })

    it('debe validar monto >= 0 si se envía', () => {
      const datos = { trabajo_realizado: 'Reparación completa', monto: -50 }
      const resultado = finalizarSchema.safeParse(datos)
      expect(resultado.success).toBe(false)
    })

    it('debe validar monto <= MAXIMO', () => {
      const datos = { trabajo_realizado: 'Reparación', monto: MAXIMO + 1 }
      const resultado = finalizarSchema.safeParse(datos)
      expect(resultado.success).toBe(false)
    })

    it('debe permitir monto 0', () => {
      const datos = { trabajo_realizado: 'Garantía sin cargo', monto: 0 }
      const resultado = finalizarSchema.safeParse(datos)
      expect(resultado.success).toBe(true)
    })
  })

  describe('estadoSchema', () => {
    it('debe aceptar estados válidos', () => {
      const validos = ['PENDIENTE', 'EN_PROCESO', 'FINALIZADA', 'CANCELADA']
      for (const estado of validos) {
        expect(estadoSchema.safeParse(estado).success).toBe(true)
      }
    })

    it('debe rechazar estado inválido', () => {
      const resultado = estadoSchema.safeParse('INVALIDO')
      expect(resultado.success).toBe(false)
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

    it('debe validar filtros de estado', () => {
      const resultado = listarSchema.safeParse({ estado: 'EN_PROCESO' })
      expect(resultado.success).toBe(true)
    })

    it('debe rechazar estado inválido', () => {
      const resultado = listarSchema.safeParse({ estado: 'INVALIDO' })
      expect(resultado.success).toBe(false)
    })

    it('debe validar filtros de monto', () => {
      const datos = { monto_min: 100, monto_max: 1000 }
      const resultado = listarSchema.safeParse(datos)
      expect(resultado.success).toBe(true)
    })

    it('debe rechazar monto_min negativo', () => {
      const resultado = listarSchema.safeParse({ monto_min: -1 })
      expect(resultado.success).toBe(false)
    })

    it('debe rechazar monto_max negativo', () => {
      const resultado = listarSchema.safeParse({ monto_max: -1 })
      expect(resultado.success).toBe(false)
    })

    it('debe validar paginación', () => {
      const datos = { pagina: 2, limite: 50 }
      const resultado = listarSchema.safeParse(datos)
      expect(resultado.success).toBe(true)
      if (resultado.success) {
        expect(resultado.data.pagina).toBe(2)
        expect(resultado.data.limite).toBe(50)
      }
    })

    it('debe rechazar página < 1', () => {
      const resultado = listarSchema.safeParse({ pagina: 0 })
      expect(resultado.success).toBe(false)
    })

    it('debe rechazar límite > 100', () => {
      const resultado = listarSchema.safeParse({ limite: 101 })
      expect(resultado.success).toBe(false)
    })

    it('debe validar rangos de fecha', () => {
      const datos = {
        creado_en_desde: '2024-01-01',
        creado_en_hasta: '2024-12-31',
        fecha_inicio_desde: '2024-01-01',
        fecha_fin_hasta: '2024-12-31',
      }
      const resultado = listarSchema.safeParse(datos)
      expect(resultado.success).toBe(true)
    })

    it('debe rechazar límite > 100', () => {
      const resultado = listarSchema.safeParse({ limite: 101 })
      expect(resultado.success).toBe(false)
    })

    it('debe rechazar página < 1', () => {
      const resultado = listarSchema.safeParse({ pagina: 0 })
      expect(resultado.success).toBe(false)
    })
  })

  describe('finalizarSchema', () => {
    it('debe validar finalización correcta con monto', () => {
      const datos = {
        trabajo_realizado: 'Se reparó el motor y se probaron las funciones',
        monto: 150.75,
      }
      const resultado = finalizarSchema.safeParse(datos)
      expect(resultado.success).toBe(true)
    })

    it('debe requerir trabajo_realizado (mín 5 chars)', () => {
      const datos = { trabajo_realizado: 'Ok' }
      const resultado = finalizarSchema.safeParse(datos)
      expect(resultado.success).toBe(false)
    })

    it('debe permitir monto opcional', () => {
      const datos = { trabajo_realizado: 'Reparación completa del sistema hidráulico' }
      const resultado = finalizarSchema.safeParse(datos)
      expect(resultado.success).toBe(true)
    })

    it('debe validar monto >= 0', () => {
      const datos = { trabajo_realizado: 'Reparación', monto: -10 }
      const resultado = finalizarSchema.safeParse(datos)
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
