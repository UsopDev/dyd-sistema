import { describe, it, expect } from 'vitest'
import { calcularPrioridad, explicarPrioridad, type ContextoPrioridad } from './prioridad.js'

describe('Prioridad - Lógica de Negocio', () => {
  const baseContexto = {
    esPropia: false,
    estadoMaquina: 'OPERATIVA' as const,
    tipoServicio: 'PREVENTIVO' as const,
    proximoMantenimiento: null as Date | null,
    prioridadSugerida: null as const,
  }

  describe('calcularPrioridad() - Casos ALTA', () => {
    it('debe retornar ALTA si máquina está FUERA_DE_SERVICIO (regla 1)', () => {
      const ctx = { ...baseContexto, estadoMaquina: 'FUERA_DE_SERVICIO' as const }
      expect(calcularPrioridad(ctx)).toBe('ALTA')
    })

    it('debe retornar ALTA si máquina propia FUERA_DE_SERVICIO (regla 1+6)', () => {
      const ctx = { ...baseContexto, esPropia: true, estadoMaquina: 'FUERA_DE_SERVICIO' as const }
      expect(calcularPrioridad(ctx)).toBe('ALTA')
    })

    it('debe retornar ALTA aunque prioridad sugerida sea BAJA y máquina FUERA_DE_SERVICIO', () => {
      const ctx = { ...baseContexto, prioridadSugerida: 'BAJA' as const, estadoMaquina: 'FUERA_DE_SERVICIO' as const }
      expect(calcularPrioridad(ctx)).toBe('ALTA')
    })
  })

  describe('calcularPrioridad() - Subidas por EN_MANTENIMIENTO', () => {
    it('debe subir a ALTA si MEDIA + EN_MANTENIMIENTO', () => {
      const ctx = { ...baseContexto, estadoMaquina: 'EN_MANTENIMIENTO' as const }
      expect(calcularPrioridad(ctx)).toBe('ALTA')
    })

    it('debe subir a MEDIA si BAJA + EN_MANTENIMIENTO', () => {
      const ctx = { ...baseContexto, prioridadSugerida: 'BAJA' as const, estadoMaquina: 'EN_MANTENIMIENTO' as const }
      expect(calcularPrioridad(ctx)).toBe('MEDIA')
    })

    it('debe mantener ALTA si ya ALTA + EN_MANTENIMIENTO', () => {
      const ctx = { ...baseContexto, prioridadSugerida: 'ALTA' as const, estadoMaquina: 'EN_MANTENIMIENTO' as const }
      expect(calcularPrioridad(ctx)).toBe('ALTA')
    })
  })

  describe('calcularPrioridad() - Subidas por CORRECTIVO', () => {
    it('debe subir a ALTA si MEDIA + CORRECTIVO', () => {
      const ctx = { ...baseContexto, tipoServicio: 'CORRECTIVO' as const }
      expect(calcularPrioridad(ctx)).toBe('ALTA')
    })

    it('debe subir a MEDIA si BAJA + CORRECTIVO', () => {
      const ctx = { ...baseContexto, prioridadSugerida: 'BAJA' as const, tipoServicio: 'CORRECTIVO' as const }
      expect(calcularPrioridad(ctx)).toBe('MEDIA')
    })

    it('debe mantener ALTA si ya ALTA + CORRECTIVO', () => {
      const ctx = { ...baseContexto, prioridadSugerida: 'ALTA' as const, tipoServicio: 'CORRECTIVO' as const }
      expect(calcularPrioridad(ctx)).toBe('ALTA')
    })
  })

  describe('calcularPrioridad() - Subidas por Preventivo Vencido', () => {
    it('debe subir a ALTA si MEDIA + preventivo vencido', () => {
      const ayer = new Date()
      ayer.setDate(ayer.getDate() - 1)
      ayer.setHours(0, 0, 0, 0)
      const ctx = { ...baseContexto, proximoMantenimiento: ayer }
      expect(calcularPrioridad(ctx)).toBe('ALTA')
    })

    it('debe subir a MEDIA si BAJA + preventivo vencido', () => {
      const ayer = new Date()
      ayer.setDate(ayer.getDate() - 1)
      ayer.setHours(0, 0, 0, 0)
      const ctx = { ...baseContexto, prioridadSugerida: 'BAJA' as const, proximoMantenimiento: ayer }
      expect(calcularPrioridad(ctx)).toBe('MEDIA')
    })

    it('NO debe subir si preventivo NO vencido (fecha futura)', () => {
      const manana = new Date()
      manana.setDate(manana.getDate() + 1)
      manana.setHours(0, 0, 0, 0)
      const ctx = { ...baseContexto, prioridadSugerida: 'BAJA' as const, proximoMantenimiento: manana }
      expect(calcularPrioridad(ctx)).toBe('BAJA')
    })

    it('NO debe subir si preventivo es hoy', () => {
      const hoy = new Date()
      hoy.setHours(0, 0, 0, 0)
      const ctx = { ...baseContexto, prioridadSugerida: 'BAJA' as const, proximoMantenimiento: hoy }
      expect(calcularPrioridad(ctx)).toBe('BAJA')
    })
  })

  describe('calcularPrioridad() - Subidas por Máquina Propia (esPropia)', () => {
    it('debe subir a ALTA si MEDIA + esPropia', () => {
      const ctx = { ...baseContexto, esPropia: true }
      expect(calcularPrioridad(ctx)).toBe('ALTA')
    })

    it('debe subir a MEDIA si BAJA + esPropia', () => {
      const ctx = { ...baseContexto, prioridadSugerida: 'BAJA' as const, esPropia: true }
      expect(calcularPrioridad(ctx)).toBe('MEDIA')
    })

    it('debe mantener ALTA si ya ALTA + esPropia', () => {
      const ctx = { ...baseContexto, prioridadSugerida: 'ALTA' as const, esPropia: true }
      expect(calcularPrioridad(ctx)).toBe('ALTA')
    })
  })

  describe('calcularPrioridad() - Combinaciones Múltiples', () => {
    it('debe ser ALTA: CORRECTIVO + EN_MANTENIMIENTO (doble subida desde MEDIA)', () => {
      const ctx = { ...baseContexto, tipoServicio: 'CORRECTIVO' as const, estadoMaquina: 'EN_MANTENIMIENTO' as const }
      expect(calcularPrioridad(ctx)).toBe('ALTA')
    })

    it('debe ser ALTA: preventivo vencido + esPropia (doble subida desde BAJA)', () => {
      const ayer = new Date()
      ayer.setDate(ayer.getDate() - 1)
      ayer.setHours(0, 0, 0, 0)
      const ctx = { ...baseContexto, prioridadSugerida: 'BAJA' as const, esPropia: true, proximoMantenimiento: ayer }
      expect(calcularPrioridad(ctx)).toBe('ALTA')
    })

    it('debe ser ALTA: FUERA_DE_SERVICIO domina todo', () => {
      const ctx = { ...baseContexto, estadoMaquina: 'FUERA_DE_SERVICIO' as const, prioridadSugerida: 'BAJA' as const }
      expect(calcularPrioridad(ctx)).toBe('ALTA')
    })

    it('debe ser MEDIA: solo preventivo NO vencido', () => {
      const manana = new Date()
      manana.setDate(manana.getDate() + 1)
      manana.setHours(0, 0, 0, 0)
      const ctx = { ...baseContexto, proximoMantenimiento: manana }
      expect(calcularPrioridad(ctx)).toBe('MEDIA')
    })

    it('debe ser ALTA: CORRECTIVO + esPropia (doble subida)', () => {
      const ctx = { ...baseContexto, tipoServicio: 'CORRECTIVO' as const, esPropia: true }
      expect(calcularPrioridad(ctx)).toBe('ALTA')
    })

    it('debe ser ALTA: EN_MANTENIMIENTO + preventivo vencido', () => {
      const ayer = new Date()
      ayer.setDate(ayer.getDate() - 1)
      ayer.setHours(0, 0, 0, 0)
      const ctx = { ...baseContexto, estadoMaquina: 'EN_MANTENIMIENTO' as const, proximoMantenimiento: ayer }
      expect(calcularPrioridad(ctx)).toBe('ALTA')
    })
  })

  describe('explicarPrioridad()', () => {
    it('debe explicar FUERA_DE_SERVICIO', () => {
      const ctx = { ...baseContexto, estadoMaquina: 'FUERA_DE_SERVICIO' as const }
      const motivos = explicarPrioridad(ctx)
      expect(motivos).toContain('La máquina está fuera de servicio.')
    })

    it('debe explicar EN_MANTENIMIENTO', () => {
      const ctx = { ...baseContexto, estadoMaquina: 'EN_MANTENIMIENTO' as const }
      const motivos = explicarPrioridad(ctx)
      expect(motivos).toContain('La máquina está en mantenimiento.')
    })

    it('debe explicar CORRECTIVO', () => {
      const ctx = { ...baseContexto, tipoServicio: 'CORRECTIVO' as const }
      const motivos = explicarPrioridad(ctx)
      expect(motivos).toContain('Es un servicio correctivo: hay una falla activa.')
    })

    it('debe explicar preventivo vencido', () => {
      const ayer = new Date()
      ayer.setDate(ayer.getDate() - 1)
      ayer.setHours(0, 0, 0, 0)
      const ctx = { ...baseContexto, proximoMantenimiento: ayer }
      const motivos = explicarPrioridad(ctx)
      expect(motivos).toContain('El mantenimiento preventivo está vencido.')
    })

    it('debe explicar máquina propia', () => {
      const ctx = { ...baseContexto, esPropia: true }
      const motivos = explicarPrioridad(ctx)
      expect(motivos).toContain('La máquina es propia de DYD.')
    })

    it('debe combinar múltiples motivos', () => {
      const ayer = new Date()
      ayer.setDate(ayer.getDate() - 1)
      ayer.setHours(0, 0, 0, 0)
      const ctx = { ...baseContexto, esPropia: true, tipoServicio: 'CORRECTIVO' as const, proximoMantenimiento: ayer }
      const motivos = explicarPrioridad(ctx)
      expect(motivos.length).toBeGreaterThanOrEqual(3)
    })

    it('debe retornar array vacío si no hay motivos', () => {
      const ctx = { ...baseContexto, prioridadSugerida: 'MEDIA' as const }
      const motivos = explicarPrioridad(ctx)
      expect(motivos).toEqual([])
    })
  })

  describe('Prioridad sugerida como piso (no techo)', () => {
    it('debe ignorar prioridad sugerida BAJA si reglas exigen ALTA', () => {
      const ctx = { ...baseContexto, prioridadSugerida: 'BAJA' as const, estadoMaquina: 'FUERA_DE_SERVICIO' as const }
      expect(calcularPrioridad(ctx)).toBe('ALTA')
    })

    it('debe respetar prioridad sugerida ALTA si no hay reglas que suban', () => {
      const ctx = { ...baseContexto, prioridadSugerida: 'ALTA' as const }
      expect(calcularPrioridad(ctx)).toBe('ALTA')
    })

    it('debe usar MEDIA como default si no hay sugerida ni reglas', () => {
      expect(calcularPrioridad({ ...baseContexto })).toBe('MEDIA')
    })

    it('debe usar prioridad sugerida MEDIA como piso', () => {
      const ctx = { ...baseContexto, prioridadSugerida: 'MEDIA' as const }
      expect(calcularPrioridad(ctx)).toBe('MEDIA')
    })
  })
})
