"use client";

import { usePathname } from "next/navigation";
import {
  Sidebar,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
} from "../ui/sidebar";
import { Goal, BarChart3, Users, LogOut } from "lucide-react";
import { Fut7StatsLogo } from "@/components/icons";
import Link from "next/link";

const menuItems = [
  {
    href: "/dashboard",
    label: "Panel de Control",
    icon: BarChart3,
  },
  {
    href: "/matches",
    label: "Historial de Partidos",
    icon: Goal,
  },
  {
    href: "/players",
    label: "Jugadores",
    icon: Users,
  },
];

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-3">
          <div className="bg-primary p-2 rounded-lg shadow-lg shadow-primary/20">
            <Fut7StatsLogo className="h-6 w-6 text-primary-foreground" />
          </div>
          <div className="flex flex-col">
            <h2 className="text-xl font-bold tracking-tight text-white">Real Acade</h2>
            <p className="text-[10px] uppercase tracking-wider text-primary font-bold">Club Social</p>
          </div>
        </div>
      </SidebarHeader>
      <SidebarMenu className="px-2 pt-4">
        {menuItems.map((item) => (
          <SidebarMenuItem key={item.href}>
            <SidebarMenuButton
              asChild
              isActive={pathname.startsWith(item.href)}
              tooltip={item.label}
              className="py-6"
            >
              <Link href={item.href}>
                <item.icon className={pathname.startsWith(item.href) ? "text-primary" : ""} />
                <span className="font-medium">{item.label}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
      <SidebarFooter className="p-4 border-t border-sidebar-border">
         <SidebarMenuItem>
            <SidebarMenuButton asChild className="text-muted-foreground hover:text-destructive">
              <Link href="/login">
                <LogOut />
                <span>Cerrar Sesión</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
      </SidebarFooter>
    </Sidebar>
  );
}
