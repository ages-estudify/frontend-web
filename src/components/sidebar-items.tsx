import { BookText, FileQuestion, Import, Route, SignalHigh, Users } from 'lucide-react';

export const navItems = [
  {
    title: 'Questões',
    url: '/',
    icon: FileQuestion,
  },
  {
    title: 'Trilhas',
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
