import { describe, it, expect } from 'vitest'
import { 
  esTransicionValida, 
  sePuedeCancelar, 
  sePuedeEditar, 
  esEstadoTerminal,
  obtenerTransicionesPosibles,
  TRANSICIONES_PERMITIDAS,
  ESTADOS_CANCELABLES,
  ESTADOS_EDITABLES,
  ESTADOS_TERMINALES,
  type EstadoSolicitud 
} from './estados-solicitud.js'

describe('Estados de Solicitud - Máquina de Estados', () => {
  describe('TRANSICIONES_PERMITIDAS', () => {
    it('debe permitir RECIBIDA → EN_DIAGNOSTICO', () => {
      expect(TRANSICIONES_PERMITIDAS.RECIBIDA).toContain('EN_DIAGNOSTICO')
    })

    it('debe permitir RECIBIDA → CANCELADA', () => {
      expect(TRANSICIONES_PERMITIDAS.RECIBIDA).toContain('CANCELADA')
    })

    it('debe permitir EN_DIAGNOSTICO → COTIZADA', () => {
      expect(TRANSICIONES_PERMITIDAS.EN_DIAGNOSTICO).toContain('COTIZADA')
    })

    it('debe permitir EN_DIAGNOSTICO → CANCELADA', () => {
      expect(TRANSICIONES_PERMITIDAS.EN_DIAGNOSTICO).toContain('CANCELADA')
    })

    it('debe permitir COTIZADA → ASIGNADA', () => {
      expect(TRANSICIONES_PERMITIDAS.COTIZADA).toContain('ASIGNADA')
    })

    it('debe permitir COTIZADA → CANCELADA', () => {
      expect(TRANSICIONES_PERMITIDAS.COTIZADA).toContain('CANCELADA')
    })

    it('debe permitir ASIGNADA → EN_PROCESO', () => {
      expect(TRANSICIONES_PERMITIDAS.ASIGNADA).toContain('EN_PROCESO')
    })

    it('debe permitir ASIGNADA → CANCELADA', () => {
      expect(TRANSICIONES_PERMITIDAS.ASIGNADA).toContain('CANCELADA')
    })

    it('debe permitir EN_PROCESO → FINALIZADA', () => {
      expect(TRANSICIONES_PERMITIDAS.EN_PROCESO).toContain('FINALIZADA')
    })

    it('NO debe permitir transiciones desde FINALIZADA', () => {
      expect(TRANSICIONES_PERMITIDAS.FINALIZADA).toEqual([])
    })

    it('NO debe permitir transiciones desde CANCELADA', () => {
      expect(TRANSICIONES_PERMITIDAS.CANCELADA).toEqual([])
    })
  })

  describe('esTransicionValida()', () => {
    it('debe validar transiciones permitidas', () => {
      expect(esTransicionValida('RECIBIDA', 'EN_DIAGNOSTICO')).toBe(true)
      expect(esTransicionValida('EN_DIAGNOSTICO', 'COTIZADA')).toBe(true)
      expect(esTransicionValida('COTIZADA', 'ASIGNADA')).toBe(true)
      expect(esTransicionValida('ASIGNADA', 'EN_PROCESO')).toBe(true)
      expect(esTransicionValida('EN_PROCESO', 'FINALIZADA')).toBe(true)
    })

    it('debe rechazar transiciones no permitidas', () => {
      expect(esTransicionValida('RECIBIDA', 'FINALIZADA')).toBe(false)
      expect(esTransicionValida('EN_DIAGNOSTICO', 'ASIGNADA')).toBe(false)
      expect(esTransicionValida('COTIZADA', 'EN_PROCESO')).toBe(false)
      expect(esTransicionValida('ASIGNADA', 'FINALIZADA')).toBe(false)
    })

    it('debe rechazar transiciones desde estados terminales', () => {
      expect(esTransicionValida('FINALIZADA', 'CANCELADA')).toBe(false)
      expect(esTransicionValida('CANCELADA', 'RECIBIDA')).toBe(false)
    })

    it('debe rechazar transiciones inversas', () => {
      expect(esTransicionValida('EN_DIAGNOSTICO', 'RECIBIDA')).toBe(false)
      expect(esTransicionValida('COTIZADA', 'EN_DIAGNOSTICO')).toBe(false)
    })
  })

  describe('sePuedeCancelar()', () => {
    it('debe permitir cancelar desde RECIBIDA', () => {
      expect(sePuedeCancelar('RECIBIDA')).toBe(true)
    })

    it('debe permitir cancelar desde EN_DIAGNOSTICO', () => {
      expect(sePuedeCancelar('EN_DIAGNOSTICO')).toBe(true)
    })

    it('debe permitir cancelar desde COTIZADA', () => {
      expect(sePuedeCancelar('COTIZADA')).toBe(true)
    })

    it('debe permitir cancelar desde ASIGNADA', () => {
      expect(sePuedeCancelar('ASIGNADA')).toBe(true)
    })

    it('NO debe permitir cancelar desde EN_PROCESO', () => {
      expect(sePuedeCancelar('EN_PROCESO')).toBe(false)
    })

    it('NO debe permitir cancelar desde FINALIZADA', () => {
      expect(sePuedeCancelar('FINALIZADA')).toBe(false)
    })

    it('NO debe permitir cancelar desde CANCELADA', () => {
      expect(sePuedeCancelar('CANCELADA')).toBe(false)
    })
  })

  describe('sePuedeEditar()', () => {
    it('debe permitir editar solo en RECIBIDA', () => {
      expect(sePuedeEditar('RECIBIDA')).toBe(true)
    })

    it('NO debe permitir editar en otros estados', () => {
      expect(sePuedeEditar('EN_DIAGNOSTICO')).toBe(false)
      expect(sePuedeEditar('COTIZADA')).toBe(false)
      expect(sePuedeEditar('ASIGNADA')).toBe(false)
      expect(sePuedeEditar('EN_PROCESO')).toBe(false)
      expect(sePuedeEditar('FINALIZADA')).toBe(false)
      expect(sePuedeEditar('CANCELADA')).toBe(false)
    })
  })

  describe('esEstadoTerminal()', () => {
    it('debe identificar FINALIZADA como terminal', () => {
      expect(esEstadoTerminal('FINALIZADA')).toBe(true)
    })

    it('debe identificar CANCELADA como terminal', () => {
      expect(esEstadoTerminal('CANCELADA')).toBe(true)
    })

    it('NO debe identificar otros como terminales', () => {
      expect(esEstadoTerminal('RECIBIDA')).toBe(false)
      expect(esEstadoTerminal('EN_DIAGNOSTICO')).toBe(false)
      expect(esEstadoTerminal('COTIZADA')).toBe(false)
      expect(esEstadoTerminal('ASIGNADA')).toBe(false)
      expect(esEstadoTerminal('EN_PROCESO')).toBe(false)
    })
  })

  describe('obtenerTransicionesPosibles()', () => {
    it('debe retornar transiciones desde RECIBIDA', () => {
      expect(obtenerTransicionesPosibles('RECIBIDA')).toEqual(['EN_DIAGNOSTICO', 'CANCELADA'])
    })

    it('debe retornar transiciones desde EN_DIAGNOSTICO', () => {
      expect(obtenerTransicionesPosibles('EN_DIAGNOSTICO')).toEqual(['COTIZADA', 'CANCELADA'])
    })

    it('debe retornar array vacío para estados terminales', () => {
      expect(obtenerTransicionesPosibles('FINALIZADA')).toEqual([])
      expect(obtenerTransicionesPosibles('CANCELADA')).toEqual([])
    })
  })

  describe('Constantes de estados', () => {
    it('ESTADOS_CANCELABLES debe incluir estados correctos', () => {
      expect(ESTADOS_CANCELABLES).toEqual(['RECIBIDA', 'EN_DIAGNOSTICO', 'COTIZADA', 'ASIGNADA'])
    })

    it('ESTADOS_EDITABLES debe ser solo RECIBIDA', () => {
      expect(ESTADOS_EDITABLES).toEqual(['RECIBIDA'])
    })

    it('ESTADOS_TERMINALES debe ser FINALIZADA y CANCELADA', () => {
      expect(ESTADOS_TERMINALES).toEqual(['FINALIZADA', 'CANCELADA'])
    })
  })
})
