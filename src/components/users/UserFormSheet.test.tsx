import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useState } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { UserFormSheet } from '@/components/users/UserFormSheet';
import { initialUserFormState } from '@/components/users/user-form.constants';
import type { UserFormData } from '@/types/user.types';

vi.mock('@/components/ui/sheet', () => ({
  Sheet: ({ open, children }: { open: boolean; children: React.ReactNode }) =>
    open ? <div data-testid="sheet">{children}</div> : null,
  SheetContent: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="sheet-content">{children}</div>
  ),
}));

function UserFormSheetHarness({
  mode = 'create',
  initialFormData = initialUserFormState,
  onOpenChange = vi.fn(),
  onSubmit = vi.fn().mockResolvedValue(undefined),
}: {
  mode?: 'create' | 'edit';
  initialFormData?: UserFormData;
  onOpenChange?: (open: boolean) => void;
  onSubmit?: (formData: UserFormData) => Promise<void> | void;
}) {
  const [formData, setFormData] = useState(initialFormData);
  return (
    <UserFormSheet
      open
      onOpenChange={onOpenChange}
      mode={mode}
      formData={formData}
      setFormData={setFormData}
      onSubmit={onSubmit}
    />
  );
}

describe('UserFormSheet', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deve exibir o título conforme o modo (criar ou editar)', () => {
    const { rerender } = render(<UserFormSheetHarness mode="create" />);
    expect(screen.getByRole('heading', { name: 'Novo Usuário' })).toBeInTheDocument();

    rerender(<UserFormSheetHarness mode="edit" />);
    expect(screen.getByRole('heading', { name: 'Editar Usuário' })).toBeInTheDocument();
  });

  it('deve exibir campo Senha apenas no modo criar', () => {
    const { rerender } = render(<UserFormSheetHarness mode="create" />);
    expect(screen.getByPlaceholderText('Mínimo 8 caracteres')).toBeInTheDocument();

    rerender(<UserFormSheetHarness mode="edit" />);
    expect(screen.queryByPlaceholderText('Mínimo 8 caracteres')).not.toBeInTheDocument();
  });

  it('deve exibir campo Cargo apenas no modo editar', () => {
    const { rerender } = render(<UserFormSheetHarness mode="edit" />);
    expect(screen.getByText('Cargo *')).toBeInTheDocument();

    rerender(<UserFormSheetHarness mode="create" />);
    expect(screen.queryByText('Cargo *')).not.toBeInTheDocument();
  });

  it('deve exibir erros de validação ao enviar formulário vazio no modo criar', async () => {
    const onSubmitMock = vi.fn();
    render(<UserFormSheetHarness onSubmit={onSubmitMock} />);

    fireEvent.click(screen.getByRole('button', { name: 'Criar Usuário' }));

    await waitFor(() => {
      expect(screen.getByText('Informe o nome completo.')).toBeInTheDocument();
      expect(screen.getByText('Informe o e-mail.')).toBeInTheDocument();
      expect(screen.getByText('Informe a senha.')).toBeInTheDocument();
      expect(screen.getByText('Informe o telefone.')).toBeInTheDocument();
      expect(screen.getByText('Informe a data de nascimento.')).toBeInTheDocument();
    });

    expect(onSubmitMock).not.toHaveBeenCalled();
  });

  it('deve exibir erro de e-mail inválido no blur', async () => {
    render(<UserFormSheetHarness />);

    const emailInput = screen.getByPlaceholderText('joao@exemplo.com');
    fireEvent.change(emailInput, { target: { value: 'nao-e-um-email' } });
    fireEvent.blur(emailInput);

    await waitFor(() => {
      expect(screen.getByText('E-mail inválido.')).toBeInTheDocument();
    });
  });

  it('deve exibir erro de senha curta no blur', async () => {
    render(<UserFormSheetHarness mode="create" />);

    const passwordInput = screen.getByPlaceholderText('Mínimo 8 caracteres');
    fireEvent.change(passwordInput, { target: { value: 'curta' } });
    fireEvent.blur(passwordInput);

    await waitFor(() => {
      expect(screen.getByText('A senha deve ter no mínimo 8 caracteres.')).toBeInTheDocument();
    });
  });

  it('deve exibir erro quando telefone contém caracteres não numéricos no blur', async () => {
    render(<UserFormSheetHarness mode="create" />);

    const phoneInput = screen.getByPlaceholderText('5551999999999');
    fireEvent.change(phoneInput, { target: { value: 'abc123' } });
    fireEvent.blur(phoneInput);

    await waitFor(() => {
      expect(screen.getByText('Telefone deve conter apenas dígitos.')).toBeInTheDocument();
    });
  });

  it('deve exibir erro quando telefone tem comprimento inválido no blur', async () => {
    render(<UserFormSheetHarness mode="create" />);

    const phoneInput = screen.getByPlaceholderText('5551999999999');
    fireEvent.change(phoneInput, { target: { value: '123456789' } });
    fireEvent.blur(phoneInput);

    await waitFor(() => {
      expect(screen.getByText('Informe um número válido (10 a 13 dígitos).')).toBeInTheDocument();
    });
  });

  it('deve exibir erro de telefone no modo editar ao sair do campo com valor inválido', async () => {
    render(<UserFormSheetHarness mode="edit" />);

    const phoneInput = screen.getByPlaceholderText('5551999999999');
    fireEvent.change(phoneInput, { target: { value: 'invalido' } });
    fireEvent.blur(phoneInput);

    await waitFor(() => {
      expect(screen.getByText('Telefone deve conter apenas dígitos.')).toBeInTheDocument();
    });
  });

  it('deve limpar o erro ao começar a digitar no campo', async () => {
    render(<UserFormSheetHarness />);

    const emailInput = screen.getByPlaceholderText('joao@exemplo.com');
    fireEvent.change(emailInput, { target: { value: 'invalido' } });
    fireEvent.blur(emailInput);

    await waitFor(() => {
      expect(screen.getByText('E-mail inválido.')).toBeInTheDocument();
    });

    fireEvent.change(emailInput, { target: { value: 'i' } });

    expect(screen.queryByText('E-mail inválido.')).not.toBeInTheDocument();
  });

  it('deve chamar onSubmit com formData quando o formulário está válido no modo criar', async () => {
    const onSubmitMock = vi.fn().mockResolvedValue(undefined);
    render(
      <UserFormSheetHarness
        mode="create"
        onSubmit={onSubmitMock}
        initialFormData={{
          ...initialUserFormState,
          full_name: 'João Silva',
          email: 'joao@exemplo.com',
          password: 'senha123',
          phone_number: '55119999999',
          birth_date: '1999-09-08',
        }}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Criar Usuário' }));

    await waitFor(() => {
      expect(onSubmitMock).toHaveBeenCalledTimes(1);
    });

    expect(onSubmitMock).toHaveBeenCalledWith(
      expect.objectContaining({
        full_name: 'João Silva',
        email: 'joao@exemplo.com',
        password: 'senha123',
        phone_number: '55119999999',
        birth_date: '1999-09-08',
      })
    );
  });

  it('deve exibir "Salvar Alterações" e não chamar onSubmit sem cargo no modo editar', async () => {
    const onSubmitMock = vi.fn();
    render(<UserFormSheetHarness mode="edit" onSubmit={onSubmitMock} />);

    expect(screen.getByRole('button', { name: 'Salvar Alterações' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Salvar Alterações' }));

    await waitFor(() => {
      expect(screen.getByText('Selecione um cargo.')).toBeInTheDocument();
    });

    expect(onSubmitMock).not.toHaveBeenCalled();
  });

  it('deve chamar onOpenChange(false) ao clicar em Cancelar', () => {
    const onOpenChange = vi.fn();
    render(<UserFormSheetHarness onOpenChange={onOpenChange} />);

    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
