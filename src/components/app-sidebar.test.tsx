import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi, beforeEach } from 'vitest';

import { AppSidebar } from './app-sidebar';
import { navItems } from './sidebar-items';

const logoutMock = vi.fn();

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ logout: logoutMock }),
}));

vi.mock('../assets/SideBarLogo.png', () => ({
  default: 'sidebar-logo.png',
}));

vi.mock('./ui/button', () => ({
  Button: ({ children, className, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
    <button className={className} {...props}>
      {children}
    </button>
  ),
}));

function renderSidebar(initialPath = '/') {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <AppSidebar />
    </MemoryRouter>
  );
}

describe('AppSidebar', () => {
  beforeEach(() => {
    logoutMock.mockClear();
  });

  it('renderiza a logo, o título e todos os itens de navegação', () => {
    renderSidebar();

    expect(screen.getByAltText('Logo')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Estudify' })).toBeInTheDocument();

    navItems.forEach((item) => {
      expect(screen.getByRole('link', { name: item.title })).toBeInTheDocument();
    });
  });

  it('renderiza os links com as rotas corretas', () => {
    renderSidebar();

    navItems.forEach((item) => {
      const link = screen.getByRole('link', { name: item.title });
      expect(link).toHaveAttribute('href', item.url);
    });
  });

  it('marca apenas o item correspondente à rota atual como ativo', () => {
    renderSidebar('/usuarios');

    const usuariosLink = screen.getByRole('link', { name: 'Usuários' });
    const dashboardLink = screen.getByRole('link', { name: 'Dashboard' });

    expect(usuariosLink.className).toContain('bg-purple100');
    expect(usuariosLink.className).toContain('text-white');
    expect(dashboardLink.className).not.toContain('bg-purple100');
  });

  it('renderiza o botão de sair', () => {
    renderSidebar();

    const logoutButton = screen.getByRole('button', { name: /sair/i });

    expect(logoutButton).toBeInTheDocument();
    expect(logoutButton).toHaveAttribute('type', 'button');
  });

  it('chama logout ao clicar em Sair', () => {
    renderSidebar();

    fireEvent.click(screen.getByRole('button', { name: /sair/i }));

    expect(logoutMock).toHaveBeenCalledTimes(1);
  });
});
