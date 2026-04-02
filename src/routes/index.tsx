import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { LoginPage } from '../pages/LoginPage';
import { QuestionsPage } from '../pages/QuestionsPage';
import { NotFoundPage } from '../pages/NotFoundPage';
import Layout from '../layout';
import { TrackPage } from '../pages/TestPage';
import { ExamsPage } from '../pages/ExamsPage';
import { ImportCSVPage } from '../pages/ImportCSVPage';
import { UsersPage } from '../pages/UsersPage';
import { DashboardPage } from '../pages/DashboardPage';

const router = createBrowserRouter([
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
        element: <TrackPage />,
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
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/admin/dashboard',
    element: <DashboardPage />,
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
]);

export function Routes() {
  return <RouterProvider router={router} />;
}
