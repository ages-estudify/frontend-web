import { LogOut } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

import SideBarLogo from '../assets/SideBarLogo.png';
import { navItems } from './sidebar-items';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';

export function AppSidebar() {
  const location = useLocation();

  return (
    <div className="flex h-full w-[200px] flex-col bg-white">
      <div className="flex gap-3 px-4 py-10">
        <img src={SideBarLogo} alt="Logo" className="h-8 w-auto object-contain" />
        <h1 className="poppins text-2xl font-bold">Estudify</h1>
      </div>

      <nav className="flex-1 px-2">
        <ul className="flex flex-col gap-5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.url;

            return (
              <li key={item.url}>
                <Link
                  to={item.url}
                  className={cn(
                    'flex items-center gap-3 rounded-md pl-2 text-sm transition-colors h-8',
                    isActive ? 'bg-purple100 text-white' : 'text-foreground hover:bg-sidebar-accent'
                  )}
                >
                  <Icon size={18} />
                  <span>{item.title}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="pb-10 px-2">
        <Button type="button" onClick={() => {}} className="bg-transparent active:scale-95">
          <LogOut size={18} className="text-purple100" />
          <span className="text-purple100">Sair</span>
        </Button>
      </div>
    </div>
  );
}
