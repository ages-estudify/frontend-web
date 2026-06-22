import { createBrowserRouter } from 'react-router-dom';
import { LoginPage } from '../pages/LoginPage';
import { QuestionsPage } from '../pages/Questions';
import { NotFoundPage } from '../pages/NotFoundPage';
import Layout from '../layout';
import { ExamsPage } from '../pages/ExamsPage';
import { ImportCSVPage } from '../pages/ImportCSV';
import { UsersPage } from '../pages/UsersPage';
import { DashboardPage } from '../pages/DashboardPage';
import { TrailsPage } from '../pages/Trails';

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/',
    element: <Layout />,
    children: [
      {
        index: true,
        element: <QuestionsPage />,
      },
      {
        path: 'trilha',
        element: <TrailsPage />,
      },
      {
        path: 'simulados',
        element: <ExamsPage />,
      },
      {
        path: 'importarCSV',
        element: <ImportCSVPage />,
      },
      {
        path: 'usuarios',
        element: <UsersPage />,
      },
      {
        path: 'dashboard',
        element: <DashboardPage />,
      },
    ],
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
]);
