import { describe, it, expect } from 'vitest'
import { crearMaquinaSchema, actualizarMaquinaSchema, listarMaquinasSchema, idSchema, estadoMaquinaSchema } from './maquinas.validation.js'

describe('Máquinas - Validación Zod', () => {
  describe('estadoMaquinaSchema', () => {
    it('debe aceptar estados válidos', () => {
      expect(estadoMaquinaSchema.safeParse('OPERATIVA').success).toBe(true)
      expect(estadoMaquinaSchema.safeParse('EN_MANTENIMIENTO').success).toBe(true)
      expect(estadoMaquinaSchema.safeParse('FUERA_DE_SERVICIO').success).toBe(true)
    })

    it('debe rechazar estado inválido', () => {
      const resultado = estadoMaquinaSchema.safeParse('ROTA')
      expect(resultado.success).toBe(false)
    })
  })

  describe('crearMaquinaSchema', () => {
    it('debe validar máquina propia correcta', () => {
      const datos = {
        nombre: 'Torno CNC',
        tipo: 'Torno',
        marca: 'Haas',
        modelo: 'ST-20',
        nro_serie: 'SN123456',
        es_propia: true,
        horas_uso: 1500,
        estado: 'OPERATIVA',
      }
      const resultado = crearMaquinaSchema.safeParse(datos)
      expect(resultado.success).toBe(true)
    })

    it('debe validar máquina de cliente correcta', () => {
      const datos = {
        id_cliente: '550e8400-e29b-41d4-a716-446655440000',
        nombre: 'Soldadora MIG',
        tipo: 'Soldadora',
        marca: 'Lincoln',
        modelo: 'Power MIG 210',
        nro_serie: 'SN789012',
        es_propia: false,
        horas_uso: 500,
        estado: 'OPERATIVA',
      }
      const resultado = crearMaquinaSchema.safeParse(datos)
      expect(resultado.success).toBe(true)
    })

    it('debe requerir nombre', () => {
      const datos = { tipo: 'Torno' }
      const resultado = crearMaquinaSchema.safeParse(datos)
      expect(resultado.success).toBe(false)
      if (!resultado.success) {
        expect(resultado.error.issues.some(i => i.path.includes('nombre'))).toBe(true)
      }
    })

    it('debe validar horas_uso >= 0', () => {
      const datos = { nombre: 'Test', horas_uso: -10 }
      const resultado = crearMaquinaSchema.safeParse(datos)
      expect(resultado.success).toBe(false)
    })

    it('debe validar estado', () => {
      const datos = { nombre: 'Test', estado: 'INVALIDO' }
      const resultado = crearMaquinaSchema.safeParse(datos)
      expect(resultado.success).toBe(false)
    })
  })

  describe('actualizarMaquinaSchema', () => {
    it('debe permitir actualización parcial', () => {
      const datos = { horas_uso: 2000 }
      const resultado = actualizarMaquinaSchema.safeParse(datos)
      expect(resultado.success).toBe(true)
    })

    it('debe rechazar objeto vacío', () => {
      const resultado = actualizarMaquinaSchema.safeParse({})
      expect(resultado.success).toBe(false)
    })

    it('debe validar estado si se envía', () => {
      const datos = { estado: 'ROTA' }
      const resultado = actualizarMaquinaSchema.safeParse(datos)
      expect(resultado.success).toBe(false)
    })
  })

  describe('listarMaquinasSchema', () => {
    it('debe aplicar valores por defecto', () => {
      const resultado = listarMaquinasSchema.safeParse({})
      expect(resultado.success).toBe(true)
      if (resultado.success) {
        expect(resultado.data.pagina).toBe(1)
        expect(resultado.data.limite).toBe(20)
      }
    })

    it('debe validar filtros de estado y propiedad', () => {
      const datos = { estado: 'OPERATIVA', es_propia: 'true', horas_min: 100, horas_max: 5000 }
      const resultado = listarMaquinasSchema.safeParse(datos)
      expect(resultado.success).toBe(true)
    })

    it('debe rechazar página menor a 1', () => {
      const resultado = listarMaquinasSchema.safeParse({ pagina: 0 })
      expect(resultado.success).toBe(false)
    })

    it('debe rechazar límite mayor a 100', () => {
      const resultado = listarMaquinasSchema.safeParse({ limite: 101 })
      expect(resultado.success).toBe(false)
    })
  })

  describe('estadoMaquinaSchema', () => {
    it('debe aceptar los tres estados válidos', () => {
      expect(estadoMaquinaSchema.safeParse('OPERATIVA').success).toBe(true)
      expect(estadoMaquinaSchema.safeParse('EN_MANTENIMIENTO').success).toBe(true)
      expect(estadoMaquinaSchema.safeParse('FUERA_DE_SERVICIO').success).toBe(true)
    })

    it('debe rechazar estado inválido', () => {
      expect(estadoMaquinaSchema.safeParse('ROTA').success).toBe(false)
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
