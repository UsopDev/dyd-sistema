import { describe, it, expect, vi } from 'vitest'
import jwt from 'jsonwebtoken'
import { firmarAccessToken, verificarAccessToken, type SesionUsuario, COOKIE_ACCESO } from './jwt.js'

// Mock env
vi.mock('../config/env.js', () => ({
  env: {
    JWT_ACCESS_SECRET: 'test-access-secret-key-minimum-32-chars-long',
    JWT_ACCESS_MINUTES: 15,
  },
}))

describe('JWT - Access Tokens', () => {
  const usuario: SesionUsuario = { id: '550e8400-e29b-41d4-a716-446655440000', rol: 'ADMINISTRADOR' }
  const tecnico: SesionUsuario = { id: '550e8400-e29b-41d4-a716-446655440001', rol: 'TECNICO' }

  describe('firmarAccessToken', () => {
    it('debe generar un token JWT válido con subject e id de usuario', () => {
      const token = firmarAccessToken(usuario)
      expect(typeof token).toBe('string')
      expect(token.split('.')).toHaveLength(3)
    })

    it('debe incluir el rol en el payload', () => {
      const token = firmarAccessToken(usuario)
      const decoded = jwt.decode(token) as { rol: string; sub: string }
      expect(decoded.rol).toBe('ADMINISTRADOR')
      expect(decoded.sub).toBe(usuario.id)
    })

    it('debe generar tokens diferentes para roles diferentes', () => {
      const tokenAdmin = firmarAccessToken(usuario)
      const tokenTecnico = firmarAccessToken(tecnico)
      expect(tokenAdmin).not.toBe(tokenTecnico)
    })
  })

  describe('verificarAccessToken', () => {
    it('debe verificar y decodificar un token válido', () => {
      const token = firmarAccessToken(usuario)
      const resultado = verificarAccessToken(token)
      expect(resultado).not.toBeNull()
      expect(resultado?.id).toBe(usuario.id)
      expect(resultado?.rol).toBe('ADMINISTRADOR')
    })

    it('debe rechazar token con firma inválida', () => {
      const tokenFalso = jwt.sign({ sub: usuario.id, rol: 'ADMINISTRADOR' }, 'otra-clave-secreta-diferente', {
        algorithm: 'HS256',
        expiresIn: '15m',
      })
      const resultado = verificarAccessToken(tokenFalso)
      expect(resultado).toBeNull()
    })

    it('debe rechazar token expirado', () => {
      const tokenExpirado = jwt.sign({ sub: usuario.id, rol: 'ADMINISTRADOR' }, 'test-access-secret-key-minimum-32-chars-long', {
        algorithm: 'HS256',
        expiresIn: '-1s',
      })
      const resultado = verificarAccessToken(tokenExpirado)
      expect(resultado).toBeNull()
    })

    it('debe rechazar token con rol inválido', () => {
      const tokenRolInvalido = jwt.sign({ sub: usuario.id, rol: 'SUPER_ADMIN' }, 'test-access-secret-key-minimum-32-chars-long', {
        algorithm: 'HS256',
        expiresIn: '15m',
      })
      const resultado = verificarAccessToken(tokenRolInvalido)
      expect(resultado).toBeNull()
    })

    it('debe rechazar token sin subject', () => {
      const tokenSinSub = jwt.sign({ rol: 'ADMINISTRADOR' }, 'test-access-secret-key-minimum-32-chars-long', {
        algorithm: 'HS256',
        expiresIn: '15m',
      })
      const resultado = verificarAccessToken(tokenSinSub)
      expect(resultado).toBeNull()
    })

    it('debe devolver null para token malformado', () => {
      const resultado = verificarAccessToken('token.invalido.malformado')
      expect(resultado).toBeNull()
    })

    it('debe devolver null para string vacío', () => {
      const resultado = verificarAccessToken('')
      expect(resultado).toBeNull()
    })
  })

  describe('COOKIE_ACCESO', () => {
    it('debe tener el nombre correcto', () => {
      expect(COOKIE_ACCESO).toBe('access_token')
    })
  })
})
