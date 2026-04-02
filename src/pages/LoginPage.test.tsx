import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { LoginPage } from '@/pages/LoginPage'

describe('LoginPage', () => {
  const renderLoginPage = () =>
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>,
    )

  it('deve renderizar o título Estudify', () => {
    renderLoginPage()
    expect(screen.getByText('Estudify')).toBeInTheDocument()
  })

  it('deve renderizar o card de login', () => {
    renderLoginPage()
    expect(screen.getByText('Login')).toBeInTheDocument()
  })

  it('deve renderizar o texto descritivo', () => {
    renderLoginPage()
    expect(screen.getByText(/Se o Duolingo ensina idiomas/i)).toBeInTheDocument()
  })

  it('deve renderizar a logo', () => {
    renderLoginPage()
    expect(screen.getByAltText('Estudify')).toBeInTheDocument()
  })

  it('deve renderizar o formulário de login', () => {
    renderLoginPage()
    expect(screen.getByPlaceholderText('john.doe@email.com')).toBeInTheDocument()
  })
})