import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import api from '@/services/api';
import { createUser, deleteUser, getUsers, updateUser } from '@/services/user.service';
import type { CreateUserPayload, UpdateUserPayload, User } from '@/types/user.types';

const mockUser: User = {
  id: 'user-1',
  full_name: 'João Silva',
  email: 'joao@exemplo.com',
  phone_number: '51999999999',
  role: 'USER',
  plan_end_date: '2026-08-31T21:27:35.840Z',
  enable: true,
  streak: 5,
  coins: 100,
  createdAt: '2026-01-01T00:00:00.000Z',
  desired_course: 'Medicina',
  desired_university: 'USP',
  preferred_language: 'pt-BR',
  last_active: '2026-06-01T00:00:00.000Z',
  birth_date: '1999-09-08T00:00:00.000Z',
  onboarding_completed: true,
};

describe('user.service', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getUsers', () => {
    it('retorna array quando a resposta já é um array', async () => {
      vi.spyOn(api, 'get').mockResolvedValue([mockUser]);

      const result = await getUsers();

      expect(api.get).toHaveBeenCalledWith('/users');
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('user-1');
    });

    it('extrai content de resposta paginada', async () => {
      vi.spyOn(api, 'get').mockResolvedValue({
        content: [mockUser],
        totalElements: 1,
        page: 0,
        size: 20,
      });

      const result = await getUsers();

      expect(result).toHaveLength(1);
      expect(result[0].full_name).toBe('João Silva');
    });

    it('extrai data de resposta encapsulada', async () => {
      vi.spyOn(api, 'get').mockResolvedValue({ data: [mockUser] });

      const result = await getUsers();

      expect(result).toHaveLength(1);
      expect(result[0].email).toBe('joao@exemplo.com');
    });

    it('retorna array vazio para resposta desconhecida', async () => {
      vi.spyOn(api, 'get').mockResolvedValue({ unexpected: true });

      const result = await getUsers();

      expect(result).toEqual([]);
    });

    it('propaga erro quando a requisição falha', async () => {
      vi.spyOn(api, 'get').mockRejectedValue(new Error('falha de rede'));

      await expect(getUsers()).rejects.toThrow('falha de rede');
    });
  });

  describe('createUser', () => {
    it('chama POST /users com o payload correto', async () => {
      const postSpy = vi.spyOn(api, 'post').mockResolvedValue(undefined);

      const payload: CreateUserPayload = {
        fullName: 'João Silva',
        email: 'joao@exemplo.com',
        password: 'senha123',
        phone: '55119999999',
        birthDate: '1999-09-08',
      };

      await createUser(payload);

      expect(postSpy).toHaveBeenCalledWith('/users', payload);
    });

    it('propaga erro quando a requisição falha', async () => {
      vi.spyOn(api, 'post').mockRejectedValue(new Error('payload inválido'));

      const payload: CreateUserPayload = {
        fullName: 'João',
        email: 'joao@exemplo.com',
        password: 'senha123',
        phone: '55119999999',
        birthDate: '1999-09-08',
      };

      await expect(createUser(payload)).rejects.toThrow('payload inválido');
    });
  });

  describe('updateUser', () => {
    it('chama PUT /users/:id com o payload correto', async () => {
      const putSpy = vi.spyOn(api, 'put').mockResolvedValue(undefined);

      const payload: UpdateUserPayload = {
        fullName: 'João Atualizado',
        role: 'ADMIN',
      };

      await updateUser('user-1', payload);

      expect(putSpy).toHaveBeenCalledWith('/users/user-1', payload);
    });

    it('propaga erro quando a requisição falha', async () => {
      vi.spyOn(api, 'put').mockRejectedValue(new Error('não encontrado'));

      await expect(updateUser('user-1', { fullName: 'João' })).rejects.toThrow('não encontrado');
    });
  });

  describe('deleteUser', () => {
    it('chama DELETE /users/:id', async () => {
      const deleteSpy = vi.spyOn(api, 'delete').mockResolvedValue(undefined);

      await deleteUser('user-1');

      expect(deleteSpy).toHaveBeenCalledWith('/users/user-1');
    });

    it('propaga erro quando a requisição falha', async () => {
      vi.spyOn(api, 'delete').mockRejectedValue(new Error('proibido'));

      await expect(deleteUser('user-1')).rejects.toThrow('proibido');
    });
  });
});
