import { describe, it, expect } from 'vitest'
import { crearClienteSchema, actualizarClienteSchema, listarClientesSchema, idSchema } from './clientes.validation.js'

describe('Clientes - Validación Zod', () => {
  describe('crearClienteSchema', () => {
    it('debe validar un cliente completo correcto', () => {
      const datos = {
        razon_social: 'Empresa SAC',
        ruc_dni: '20123456789',
        contacto: 'Juan Pérez',
        telefono: '987654321',
        email: 'contacto@empresa.com',
        direccion: 'Av. Principal 123',
      }
      const resultado = crearClienteSchema.safeParse(datos)
      expect(resultado.success).toBe(true)
    })

    it('debe requerir razon_social', () => {
      const datos = { ruc_dni: '20123456789' }
      const resultado = crearClienteSchema.safeParse(datos)
      expect(resultado.success).toBe(false)
      if (!resultado.success) {
        expect(resultado.error.issues.some(i => i.path.includes('razon_social'))).toBe(true)
      }
    })

    it('debe rechazar razon_social vacía', () => {
      const datos = { razon_social: '   ' }
      const resultado = crearClienteSchema.safeParse(datos)
      expect(resultado.success).toBe(false)
    })

    it('debe aceptar campos opcionales nulos', () => {
      const datos = { razon_social: 'Empresa SAC', ruc_dni: null, contacto: null, telefono: null, email: null, direccion: null }
      const resultado = crearClienteSchema.safeParse(datos)
      expect(resultado.success).toBe(true)
    })

    it('debe validar formato de email', () => {
      const datos = { razon_social: 'Empresa SAC', email: 'email-invalido' }
      const resultado = crearClienteSchema.safeParse(datos)
      expect(resultado.success).toBe(false)
    })

    it('debe respetar límites máximos', () => {
      const datos = { razon_social: 'a'.repeat(151) }
      const resultado = crearClienteSchema.safeParse(datos)
      expect(resultado.success).toBe(false)
    })
  })

  describe('actualizarClienteSchema', () => {
    it('debe permitir actualización parcial', () => {
      const datos = { telefono: '999888777' }
      const resultado = actualizarClienteSchema.safeParse(datos)
      expect(resultado.success).toBe(true)
    })

    it('debe permitir cambiar solo el estado activo', () => {
      const datos = { activo: false }
      const resultado = actualizarClienteSchema.safeParse(datos)
      expect(resultado.success).toBe(true)
    })

    it('debe rechazar objeto vacío', () => {
      const datos = {}
      const resultado = actualizarClienteSchema.safeParse(datos)
      expect(resultado.success).toBe(false)
    })

    it('debe validar campos si se envían', () => {
      const datos = { razon_social: 'a'.repeat(151) }
      const resultado = actualizarClienteSchema.safeParse(datos)
      expect(resultado.success).toBe(false)
    })
  })

  describe('listarClientesSchema', () => {
    it('debe aplicar valores por defecto', () => {
      const resultado = listarClientesSchema.safeParse({})
      expect(resultado.success).toBe(true)
      if (resultado.success) {
        expect(resultado.data.pagina).toBe(1)
        expect(resultado.data.limite).toBe(20)
      }
    })

    it('debe validar filtros opcionales', () => {
      const datos = { q: 'empresa', activo: 'true', pagina: 2, limite: 50 }
      const resultado = listarClientesSchema.safeParse(datos)
      expect(resultado.success).toBe(true)
    })

    it('debe rechazar página menor a 1', () => {
      const resultado = listarClientesSchema.safeParse({ pagina: 0 })
      expect(resultado.success).toBe(false)
    })

    it('debe rechazar límite mayor a 100', () => {
      const resultado = listarClientesSchema.safeParse({ limite: 101 })
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
