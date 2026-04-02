import { BookText, Home, Import, Route, SignalHigh, Users } from "lucide-react"
import { Link, useLocation } from "react-router-dom"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "./ui/sidebar"
import SideBarLogo from "../assets/SideBarLogo.png"

export const navItems = [
  {
    title: "Questões",
    url: "/",
    icon: Home,
  },
  {
    title: "Trilha",
    url: "/trilha",
    icon: Route,
  },
  {
    title: "Simulados",
    url: "/simulados",
    icon: BookText,
  },
  {
    title: "Importar CSV",
    url: "/importarCSV",
    icon: Import,
  },
  {
    title: "Usuários",
    url: "/usuarios",
    icon: Users,
  },
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: SignalHigh,
  },
]

export function AppSidebar() {
  const location = useLocation()

  return (
    <Sidebar className="!w-[200px]">
      <SidebarContent>
        <SidebarGroup>
          <div className="flex gap-3 py-10 px-2">
            <img
              src={SideBarLogo}
              alt="Logo"
              className="h-8 w-auto object-contain"
            />
            <h1 className="poppins font-bold text-2xl">Estudify</h1>
          </div>
          
          <SidebarGroupContent>
            <SidebarMenu className="gap-5 pl-2">
              {navItems.map((item) => {
                const Icon = item.icon
                const isActive = location.pathname === item.url

                return (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton asChild isActive={isActive} className="gap-3">
                      <Link to={item.url}>
                        <Icon />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}