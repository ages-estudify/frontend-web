import { BookText, Home, Import, Route, SignalHigh, Users } from 'lucide-react';

export const navItems = [
  {
    title: 'Questões',
    url: '/',
    icon: Home,
  },
  {
    title: 'Trilha',
    url: '/trilha',
    icon: Route,
  },
  {
    title: 'Simulados',
    url: '/simulados',
    icon: BookText,
  },
  {
    title: 'Importar CSV',
    url: '/importarCSV',
    icon: Import,
  },
  {
    title: 'Usuários',
    url: '/usuarios',
    icon: Users,
  },
  {
    title: 'Dashboard',
    url: '/dashboard',
    icon: SignalHigh,
  },
];
