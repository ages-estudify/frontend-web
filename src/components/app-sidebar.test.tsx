import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

import { AppSidebar } from './app-sidebar';
import { navItems } from './sidebar-items';

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

vi.mock('./ui/sidebar', () => ({
  SidebarProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="sidebar-provider">{children}</div>
  ),
  Sidebar: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <aside data-testid="sidebar" className={className}>
      {children}
    </aside>
  ),
  SidebarContent: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div className={className}>{children}</div>
  ),
  SidebarGroup: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div className={className}>{children}</div>
  ),
  SidebarGroupContent: ({
    children,
    className,
  }: {
    children: React.ReactNode;
    className?: string;
  }) => <div className={className}>{children}</div>,
  SidebarMenu: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <ul className={className}>{children}</ul>
  ),
  SidebarMenuItem: ({ children }: { children: React.ReactNode }) => <li>{children}</li>,
  SidebarMenuButton: ({
    children,
    isActive,
    className,
  }: {
    children: React.ReactNode;
    isActive?: boolean;
    className?: string;
  }) => (
    <div
      data-testid="sidebar-menu-button"
      data-active={isActive ? 'true' : 'false'}
      className={className}
    >
      {children}
    </div>
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

    expect(usuariosLink.parentElement).toHaveAttribute('data-active', 'true');
    expect(dashboardLink.parentElement).toHaveAttribute('data-active', 'false');
  });

  it('renderiza o botão de sair', () => {
    renderSidebar();

    const logoutButton = screen.getByRole('button', { name: /sair/i });

    expect(logoutButton).toBeInTheDocument();
    expect(logoutButton).toHaveAttribute('type', 'button');
  });
});
