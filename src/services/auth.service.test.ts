import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { login, register } from '@/services/auth.service';
import api from '@/services/api';

describe('auth.service', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('deve retornar dados do usuário ao fazer login com sucesso', async () => {
    const planExpirationDate = new Date();
    vi.spyOn(api, 'post').mockResolvedValue({
      data: {
        token: 'jwt-token',
        role: 'ADM',
        planExpirationDate,
      },
    });

    const result = await login({ email: 'admin@test.com', password: '123456' });

    expect(result.token).toBe('jwt-token');
    expect(result.role).toBe('ADM');
    expect(result.planExpirationDate).toBe(planExpirationDate);
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

  it('deve registrar usuário e retornar dados da API', async () => {
    vi.spyOn(api, 'post').mockResolvedValue({
      data: {
        token: 'jwt-token',
        role: 'USER',
      },
    });

    const result = await register({
      fullName: 'Admin',
      email: 'admin@test.com',
      birthDate: '2000-01-01',
      phone: '11999999999',
      password: '123456',
    });

    expect(result.token).toBe('jwt-token');
    expect(result.role).toBe('USER');
  });
});
