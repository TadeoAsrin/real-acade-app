
"use client";

import { usePathname, useRouter } from "next/navigation";
import {
  Sidebar,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarContent,
} from "../ui/sidebar";
import { Goal, BarChart3, Users, LogOut, Trophy, Dices, ArrowLeftRight, LogIn } from "lucide-react";
import { Fut7StatsLogo } from "@/components/icons";
import Link from "next/link";
import { useAuth, useUser, useFirestore, useMemoFirebase, useDoc } from "@/firebase";
import { signOut } from "firebase/auth";
import { useToast } from "@/hooks/use-toast";
import { doc } from "firebase/firestore";

const menuItems = [
  {
    href: "/dashboard",
    label: "Panel de Control",
    icon: BarChart3,
  },
  {
    href: "/standings",
    label: "Clasificación",
    icon: Trophy,
  },
  {
    href: "/matches",
    label: "Partidos",
    icon: Goal,
  },
  {
    href: "/players",
    label: "Jugadores",
    icon: Users,
  },
  {
    href: "/compare",
    label: "Comparador",
    icon: ArrowLeftRight,
  },
];

export function AppSidebar() {
  const pathname = usePathname();
  const auth = useAuth();
  const { user } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const adminRoleRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'roles_admin', user.uid);
  }, [firestore, user]);

  const { data: adminRole } = useDoc<{isAdmin: boolean}>(adminRoleRef);
  const isAdmin = adminRole?.isAdmin;

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast({
        title: "Sesión cerrada",
        description: "Has salido de Real Acade correctamente.",
      });
      router.push("/login");
    } catch (error) {
      console.error("Logout error", error);
    }
  };

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
      <SidebarContent>
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
            
            {isAdmin && (
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={pathname.startsWith("/generator")}
                  tooltip="Generador de Equipos"
                  className="py-6 text-orange-400 hover:text-orange-500"
                >
                  <Link href="/generator">
                      <Dices className={pathname.startsWith("/generator") ? "text-orange-400" : ""} />
                      <span className="font-medium">Generador Pro</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="p-4 border-t border-sidebar-border">
         {user ? (
           <SidebarMenuItem>
              <SidebarMenuButton 
                onClick={handleLogout}
                className="text-muted-foreground hover:text-destructive w-full justify-start"
              >
                <LogOut />
                <span>Cerrar Sesión</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
         ) : (
           <SidebarMenuItem>
              <SidebarMenuButton 
                asChild
                className="text-primary hover:bg-primary/10 w-full justify-start font-bold"
              >
                <Link href="/login">
                  <LogIn />
                  <span>Acceso Miembros</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
         )}
      </SidebarFooter>
    </Sidebar>
  );
}
