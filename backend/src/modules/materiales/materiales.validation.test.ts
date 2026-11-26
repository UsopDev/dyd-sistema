import { describe, it, expect } from 'vitest'
import { 
  crearMaterialSchema, 
  actualizarMaterialSchema, 
  listarMaterialesSchema, 
  movimientoInventarioSchema, 
  idSchema 
} from './materiales.validation.js'

describe('Materiales - Validación Zod', () => {
  describe('crearMaterialSchema', () => {
    it('debe validar material completo correcto', () => {
      const datos = {
        nombre: 'Electrodo E6013',
        unidad: 'kg',
        stock_minimo: 50,
        precio_unitario: 12.50,
      }
      const resultado = crearMaterialSchema.safeParse(datos)
      expect(resultado.success).toBe(true)
    })

    it('debe generar código automáticamente si no se envía', () => {
      const datos = { nombre: 'Alambre MIG', unidad: 'kg' }
      const resultado = crearMaterialSchema.safeParse(datos)
      expect(resultado.success).toBe(true)
    })

    it('debe requerir nombre y unidad', () => {
      const datos = { stock_minimo: 10 }
      const resultado = crearMaterialSchema.safeParse(datos)
      expect(resultado.success).toBe(false)
      if (!resultado.success) {
        expect(resultado.error.issues.some(i => i.path.includes('nombre'))).toBe(true)
        expect(resultado.error.issues.some(i => i.path.includes('unidad'))).toBe(true)
      }
    })

    it('debe validar stock_minimo >= 0', () => {
      const datos = { nombre: 'Test', unidad: 'u', stock_minimo: -5 }
      const resultado = crearMaterialSchema.safeParse(datos)
      expect(resultado.success).toBe(false)
    })

    it('debe validar precio_unitario >= 0', () => {
      const datos = { nombre: 'Test', unidad: 'u', precio_unitario: -10 }
      const resultado = crearMaterialSchema.safeParse(datos)
      expect(resultado.success).toBe(false)
    })
  })

  describe('actualizarMaterialSchema', () => {
    it('debe permitir actualización parcial', () => {
      const datos = { stock_minimo: 100 }
      const resultado = actualizarMaterialSchema.safeParse(datos)
      expect(resultado.success).toBe(true)
    })

    it('debe permitir cambiar estado activo', () => {
      const datos = { activo: false }
      const resultado = actualizarMaterialSchema.safeParse(datos)
      expect(resultado.success).toBe(true)
    })

    it('debe rechazar objeto vacío', () => {
      const resultado = actualizarMaterialSchema.safeParse({})
      expect(resultado.success).toBe(false)
    })

    it('debe validar campos si se envían', () => {
      const datos = { precio_unitario: -1 }
      const resultado = actualizarMaterialSchema.safeParse(datos)
      expect(resultado.success).toBe(false)
    })
  })

  describe('listarMaterialesSchema', () => {
    it('debe aplicar valores por defecto', () => {
      const resultado = listarMaterialesSchema.safeParse({})
      expect(resultado.success).toBe(true)
      if (resultado.success) {
        expect(resultado.data.pagina).toBe(1)
        expect(resultado.data.limite).toBe(20)
      }
    })

    it('debe validar filtros opcionales', () => {
      const datos = { q: 'electrodo', activo: 'true', pagina: 2, limite: 50 }
      const resultado = listarMaterialesSchema.safeParse(datos)
      expect(resultado.success).toBe(true)
    })

    it('debe rechazar página menor a 1', () => {
      const resultado = listarMaterialesSchema.safeParse({ pagina: 0 })
      expect(resultado.success).toBe(false)
    })

    it('debe rechazar límite mayor a 100', () => {
      const resultado = listarMaterialesSchema.safeParse({ limite: 101 })
      expect(resultado.success).toBe(false)
    })
  })

  describe('movimientoInventarioSchema', () => {
    it('debe validar entrada correcta', () => {
      const datos = { tipo: 'ENTRADA', cantidad: 100, motivo: 'Compra proveedor' }
      const resultado = movimientoInventarioSchema.safeParse(datos)
      expect(resultado.success).toBe(true)
    })

    it('debe validar salida correcta', () => {
      const datos = { tipo: 'SALIDA', cantidad: 50 }
      const resultado = movimientoInventarioSchema.safeParse(datos)
      expect(resultado.success).toBe(true)
    })

    it('debe requerir tipo y cantidad', () => {
      const datos = { motivo: 'Test' }
      const resultado = movimientoInventarioSchema.safeParse(datos)
      expect(resultado.success).toBe(false)
    })

    it('debe rechazar cantidad <= 0', () => {
      const datos = { tipo: 'ENTRADA', cantidad: 0 }
      const resultado = movimientoInventarioSchema.safeParse(datos)
      expect(resultado.success).toBe(false)
    })

    it('debe validar tipo válido', () => {
      const datos = { tipo: 'TRANSFERENCIA', cantidad: 10 }
      const resultado = movimientoInventarioSchema.safeParse(datos)
      expect(resultado.success).toBe(false)
    })
  })

  describe('idSchema', () => {
    it('debe validar UUID válido', () => {
      const resultado = idSchema.safeParse({ id: '550e8400-e29b-41d4-a716-446655440000' })
      expect(resultado.success).toBe(true)
    })

    it('debe rechazar UUID inválido', () => {
      const resultado = idSchema.safeParse({ id: 'no-es-uuid' })
      expect(resultado.success).toBe(false)
    })
  })
})
