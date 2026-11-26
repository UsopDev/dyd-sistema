import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('./redis.js', () => ({
  redis: {
    set: vi.fn().mockResolvedValue('OK'),
    getdel: vi.fn().mockResolvedValue(null),
    del: vi.fn().mockResolvedValue(1),
    keys: vi.fn().mockResolvedValue([]),
  },
}))

import { crearRefreshToken, consumirRefreshToken, revocarRefreshToken, revocarTodosRefreshTokens } from './refresh-tokens.js'

const { redis } = await import('./redis.js')

describe('Refresh Tokens', () => {
  const idUsuario = '550e8400-e29b-41d4-a716-446655440000'

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('crearRefreshToken', () => {
    it('debe crear un token con formato idUsuario.randomBytes', async () => {
      const token = await crearRefreshToken(idUsuario)
      expect(token).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.[0-9a-f]+$/i)
      expect(token.startsWith(`${idUsuario}.`)).toBe(true)
    })

    it('debe llamar a redis.set con TTL correcto (7 días)', async () => {
      await crearRefreshToken(idUsuario)
      expect(redis.set).toHaveBeenCalledWith(
        expect.stringMatching(/^refresh:/),
        '1',
        'EX',
        7 * 24 * 60 * 60, // 7 días en segundos
      )
    })

    it('debe generar tokens únicos en llamadas consecutivas', async () => {
      const token1 = await crearRefreshToken(idUsuario)
      const token2 = await crearRefreshToken(idUsuario)
      expect(token1).not.toBe(token2)
    })
  })

  describe('consumirRefreshToken', () => {
    it('debe devolver idUsuario si el token existe y es válido', async () => {
      redis.getdel.mockResolvedValueOnce('1')
      const token = `${idUsuario}.${'a'.repeat(96)}` // 48 bytes = 96 hex chars

      const resultado = await consumirRefreshToken(token)

      expect(resultado).toBe(idUsuario)
      expect(redis.getdel).toHaveBeenCalledWith(expect.stringMatching(/^refresh:/))
    })

    it('debe devolver null si el token no existe (getdel returns null)', async () => {
      redis.getdel.mockResolvedValueOnce(null)
      const token = `${idUsuario}.${'a'.repeat(96)}`

      const resultado = await consumirRefreshToken(token)

      expect(resultado).toBeNull()
    })

    it('debe devolver null para token con formato inválido (sin punto)', async () => {
      const resultado = await consumirRefreshToken('token-sin-punto')
      expect(resultado).toBeNull()
      expect(redis.getdel).not.toHaveBeenCalled()
    })

    it('debe devolver null para token con UUID inválido', async () => {
      const resultado = await consumirRefreshToken('no-es-uuid.tokenvalido')
      expect(resultado).toBeNull()
      expect(redis.getdel).not.toHaveBeenCalled()
    })

    it('debe devolver null para token vacío', async () => {
      const resultado = await consumirRefreshToken('')
      expect(resultado).toBeNull()
    })
  })

  describe('revocarRefreshToken', () => {
    it('debe llamar a redis.del con la key correcta', async () => {
      const token = `${idUsuario}.${'a'.repeat(96)}`
      await revocarRefreshToken(token)
      expect(redis.del).toHaveBeenCalledWith(expect.stringMatching(/^refresh:/))
    })

    it('no debe fallar para token con formato inválido', async () => {
      await expect(revocarRefreshToken('invalido')).resolves.toBeUndefined()
      expect(redis.del).not.toHaveBeenCalled()
    })

    it('no debe fallar para string vacío', async () => {
      await expect(revocarRefreshToken('')).resolves.toBeUndefined()
    })
  })

  describe('revocarTodosRefreshTokens', () => {
    it('debe buscar y eliminar todas las keys del usuario', async () => {
      const keys = ['refresh:user1:hash1', 'refresh:user1:hash2']
      redis.keys.mockResolvedValueOnce(keys)
      redis.del.mockResolvedValueOnce(2)

      const resultado = await revocarTodosRefreshTokens(idUsuario)

      expect(redis.keys).toHaveBeenCalledWith(`refresh:${idUsuario}:*`)
      expect(redis.del).toHaveBeenCalledWith(...keys)
      expect(resultado).toBe(2)
    })

    it('debe devolver 0 si no hay keys', async () => {
      redis.keys.mockResolvedValueOnce([])
      const resultado = await revocarTodosRefreshTokens(idUsuario)
      expect(resultado).toBe(0)
      expect(redis.del).not.toHaveBeenCalled()
    })
  })
})