import { describe, expect, it } from 'vitest';

import { navItems } from './sidebar-items';

describe('navItems', () => {
  it('expõe todos os itens de navegação esperados, em ordem', () => {
    expect(navItems.map((item) => item.title)).toEqual([
      'Questões',
      'Trilhas',
      'Simulados',
      'Importar CSV',
      'Usuários',
      'Dashboard',
    ]);
  });

  it('associa cada item à sua rota correta', () => {
    expect(navItems.map((item) => item.url)).toEqual([
      '/',
      '/trilha',
      '/simulados',
      '/importarCSV',
      '/usuarios',
      '/dashboard',
    ]);
  });

  it('garante que todo item tem título, rota e ícone válidos', () => {
    navItems.forEach((item) => {
      expect(item.title).toBeTruthy();
      expect(item.url.startsWith('/')).toBe(true);
      expect(item.icon).toBeDefined();
    });
  });

  it('não possui rotas duplicadas', () => {
    const urls = navItems.map((item) => item.url);
    expect(new Set(urls).size).toBe(urls.length);
  });
});
