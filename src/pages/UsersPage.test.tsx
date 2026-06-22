import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import * as userService from '@/services/user.service';
import type { User } from '@/types/user.types';

import { UsersPage } from './UsersPage';

vi.mock('@/components/users/UserFormSheet', () => ({
  UserFormSheet: () => null,
  initialUserFormState: {
    full_name: '',
    email: '',
    password: '',
    phone_number: '',
    role: '',
    plan_end_date: '',
    preferred_language: '',
    desired_course: '',
    desired_university: '',
    birth_date: '',
    streak: '',
    coins: '',
  },
}));

vi.mock('@/services/user.service', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/services/user.service')>();
  return {
    ...actual,
    getUsers: vi.fn(),
    createUser: vi.fn(),
    updateUser: vi.fn(),
    deleteUser: vi.fn(),
  };
});

const mockUsers: User[] = [
  {
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
  },
  {
    id: 'user-2',
    full_name: 'Maria Santos',
    email: 'maria@exemplo.com',
    phone_number: null,
    role: 'ADMIN',
    plan_end_date: null,
    enable: false,
    streak: 0,
    coins: 0,
    createdAt: '2026-02-01T00:00:00.000Z',
    desired_course: null,
    desired_university: null,
    preferred_language: null,
    last_active: null,
    birth_date: null,
    onboarding_completed: false,
  },
];

describe('UsersPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(userService.getUsers).mockResolvedValue(mockUsers);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('deve renderizar o título e a descrição da página', () => {
    render(<UsersPage />);

    expect(screen.getByRole('heading', { name: 'Gestão de Usuários' })).toBeInTheDocument();
    expect(screen.getByText('Gerencie todos os usuários do Estudify')).toBeInTheDocument();
  });

  it('deve exibir o input de busca e o botão de novo usuário', () => {
    render(<UsersPage />);

    expect(screen.getByPlaceholderText('Buscar por nome ou e-mail...')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Novo Usuário/i })).toBeInTheDocument();
  });

  it('deve listar usuários após carregar os dados', async () => {
    render(<UsersPage />);

    await waitFor(() => {
      expect(screen.getByText('João Silva')).toBeInTheDocument();
      expect(screen.getByText('Maria Santos')).toBeInTheDocument();
    });

    expect(screen.getByText('joao@exemplo.com')).toBeInTheDocument();
    expect(screen.getByText('maria@exemplo.com')).toBeInTheDocument();
  });

  it('deve exibir mensagem quando não há usuários', async () => {
    vi.mocked(userService.getUsers).mockResolvedValue([]);

    render(<UsersPage />);

    await waitFor(() => {
      expect(screen.getByText('Nenhum usuário encontrado.')).toBeInTheDocument();
    });
  });

  it('deve filtrar usuários pelo campo de busca', async () => {
    render(<UsersPage />);

    await waitFor(() => {
      expect(screen.getByText('João Silva')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByPlaceholderText('Buscar por nome ou e-mail...'), {
      target: { value: 'maria' },
    });

    expect(screen.queryByText('João Silva')).not.toBeInTheDocument();
    expect(screen.getByText('Maria Santos')).toBeInTheDocument();
  });

  it('deve filtrar usuários pelo seletor de cargo', async () => {
    render(<UsersPage />);

    await waitFor(() => {
      expect(screen.getByText('João Silva')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'ADMIN' } });

    expect(screen.queryByText('João Silva')).not.toBeInTheDocument();
    expect(screen.getByText('Maria Santos')).toBeInTheDocument();
  });

  it('deve popular o seletor de cargo com os roles dos usuários', async () => {
    render(<UsersPage />);

    await waitFor(() => {
      expect(screen.getByRole('option', { name: 'USER' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'ADMIN' })).toBeInTheDocument();
    });
  });

  it('deve chamar deleteUser após confirmação e recarregar a lista', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    vi.mocked(userService.deleteUser).mockResolvedValue(undefined);

    render(<UsersPage />);

    await waitFor(() => {
      expect(screen.getByText('João Silva')).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByRole('button', { name: '' });
    fireEvent.click(deleteButtons[deleteButtons.length - 1]);

    await waitFor(() => {
      expect(userService.deleteUser).toHaveBeenCalledTimes(1);
      expect(userService.getUsers).toHaveBeenCalledTimes(2);
    });
  });

  it('não deve chamar deleteUser quando o usuário cancela a confirmação', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false);

    render(<UsersPage />);

    await waitFor(() => {
      expect(screen.getByText('João Silva')).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByRole('button', { name: '' });
    fireEvent.click(deleteButtons[deleteButtons.length - 1]);

    expect(userService.deleteUser).not.toHaveBeenCalled();
  });
});
