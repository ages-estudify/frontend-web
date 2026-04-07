import { Outlet } from 'react-router-dom';
import { AppSidebar } from './components/app-sidebar';
import { SidebarInset, SidebarProvider, SidebarTrigger } from './components/ui/sidebar';

export default function Layout() {
  return (
    <SidebarProvider>
      <AppSidebar />

      <SidebarInset>
        <main className="min-h-screen">
          <div className="p-4">
            <SidebarTrigger />
          </div>

          <div className="p-4">
            <Outlet />
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
