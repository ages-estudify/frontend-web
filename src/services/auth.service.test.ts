import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { login } from '@/services/auth.service';
import api from '@/services/api';

describe('auth.service', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('deve retornar dados do usuário ao fazer login com sucesso', async () => {
    const mockResponse = {
      data: {
        success: true,
        data: {
          token: 'jwt-token',
          role: 'ADMIN',
          planActive: false,
        },
      },
    };

    vi.spyOn(api, 'post').mockResolvedValue(mockResponse);

    const result = await login({ email: 'admin@test.com', password: '123456' });

    expect(result.data.token).toBe('jwt-token');
    expect(result.data.role).toBe('ADMIN');
  });

  it('deve lançar erro quando a API retornar falha', async () => {
    vi.spyOn(api, 'post').mockRejectedValue(new Error('Credenciais inválidas'));

    await expect(login({ email: 'admin@test.com', password: 'errado' })).rejects.toThrow(
      'Credenciais inválidas'
    );
  });

  it('deve lançar erro genérico quando API não retornar mensagem', async () => {
    vi.spyOn(api, 'post').mockRejectedValue(
      new Error('Não foi possível realizar login. Tente novamente.')
    );

    await expect(login({ email: 'admin@test.com', password: 'errado' })).rejects.toThrow(
      'Não foi possível realizar login. Tente novamente.'
    );
  });
});
