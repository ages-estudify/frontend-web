import { RouterProvider } from 'react-router-dom';
import { router } from './router';

export function Routes() {
  return <RouterProvider router={router} />;
}
