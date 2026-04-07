import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { LoginForm } from '@/components/login/LoginForm'
import * as authService from '@/services/auth.service'
import * as storage from '@/utils/storage'

const renderLoginForm = () =>
  render(
    <MemoryRouter>
      <LoginForm />
    </MemoryRouter>,
  )

describe('LoginForm', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('deve renderizar o formulário corretamente', () => {
    renderLoginForm()
    expect(screen.getByPlaceholderText('john.doe@email.com')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Entrar' })).toBeInTheDocument()
    expect(screen.getByText('Esqueceu a senha?')).toBeInTheDocument()
  })

  it('deve exibir erros quando campos estiverem vazios', async () => {
    renderLoginForm()
    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }))
    expect(await screen.findByText('E-mail obrigatório')).toBeInTheDocument()
    expect(await screen.findByText('Senha obrigatória')).toBeInTheDocument()
  })

  it('deve exibir mensagem de acesso restrito para usuário não ADMIN', async () => {
    vi.spyOn(authService, 'login').mockResolvedValue({
      success: true,
      data: { token: 'token', role: 'USER', planActive: false },
    })

    renderLoginForm()
    fireEvent.change(screen.getByPlaceholderText('john.doe@email.com'), {
      target: { value: 'user@test.com' },
    })
    fireEvent.change(screen.getByPlaceholderText('••••••••••'), {
      target: { value: '123456' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }))

    expect(
      await screen.findByText('Acesso restrito ao painel administrativo.'),
    ).toBeInTheDocument()
  })

  it('deve salvar token e redirecionar para ADMIN', async () => {
    const setTokenSpy = vi.spyOn(storage.storage, 'setToken')
    const setRoleSpy = vi.spyOn(storage.storage, 'setRole')

    vi.spyOn(authService, 'login').mockResolvedValue({
      success: true,
      data: { token: 'jwt-token', role: 'ADMIN', planActive: false },
    })

    renderLoginForm()
    fireEvent.change(screen.getByPlaceholderText('john.doe@email.com'), {
      target: { value: 'admin@test.com' },
    })
    fireEvent.change(screen.getByPlaceholderText('••••••••••'), {
      target: { value: '123456' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }))

    await waitFor(() => {
      expect(setTokenSpy).toHaveBeenCalledWith('jwt-token')
      expect(setRoleSpy).toHaveBeenCalledWith('ADMIN')
    })
  })

  it('deve exibir mensagem de erro da API', async () => {
    vi.spyOn(authService, 'login').mockRejectedValue(new Error('Credenciais inválidas'))

    renderLoginForm()
    fireEvent.change(screen.getByPlaceholderText('john.doe@email.com'), {
      target: { value: 'admin@test.com' },
    })
    fireEvent.change(screen.getByPlaceholderText('••••••••••'), {
      target: { value: 'errado' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }))

    expect(await screen.findByText('Credenciais inválidas')).toBeInTheDocument()
  })
})