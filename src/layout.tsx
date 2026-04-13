import { Outlet } from 'react-router-dom';
import { AppSidebar } from './components/app-sidebar';

export default function Layout() {
  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed left-0 top-0 h-screen w-[200px] border-r bg-white">
        <AppSidebar />
      </aside>

      <main className="ml-[200px] min-h-screen p-6">
        <Outlet />
      </main>
    </div>
  );
}
