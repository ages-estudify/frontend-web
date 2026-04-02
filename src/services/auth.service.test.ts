import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { login } from '@/services/auth.service'

describe('auth.service', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('deve retornar dados do usuário ao fazer login com sucesso', async () => {
    const mockResponse = {
      success: true,
      data: {
        token: 'jwt-token',
        role: 'ADMIN',
        planActive: false,
      },
    }

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    })

    const result = await login({ email: 'admin@test.com', password: '123456' })

    expect(result.success).toBe(true)
    expect(result.data.token).toBe('jwt-token')
    expect(result.data.role).toBe('ADMIN')
  })

  it('deve lançar erro quando a API retornar falha', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ message: 'Credenciais inválidas' }),
    })

    await expect(login({ email: 'admin@test.com', password: 'errado' })).rejects.toThrow(
      'Credenciais inválidas',
    )
  })

  it('deve lançar erro genérico quando API não retornar mensagem', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({}),
    })

    await expect(login({ email: 'admin@test.com', password: 'errado' })).rejects.toThrow(
      'Não foi possível realizar login. Tente novamente.',
    )
  })
})