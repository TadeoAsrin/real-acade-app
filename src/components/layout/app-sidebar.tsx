
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
import { Goal, BarChart3, Users, LogOut, Trophy, Dices, ArrowLeftRight, LogIn, User as UserIcon, ShieldCheck } from "lucide-react";
import { Fut7StatsLogo } from "@/components/icons";
import Link from "next/link";
import { useAuth, useUser, useFirestore, useMemoFirebase, useDoc, useCollection } from "@/firebase";
import { signOut } from "firebase/auth";
import { useToast } from "@/hooks/use-toast";
import { doc, collection, query, orderBy } from "firebase/firestore";
import { Avatar, AvatarFallback } from "../ui/avatar";
import { getInitials } from "@/lib/utils";
import { cn } from "@/lib/utils";

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
    label: "Versus",
    icon: ArrowLeftRight,
  },
];

export function AppSidebar() {
  const pathname = usePathname();
  const auth = useAuth();
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const playersRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'players'), orderBy('name', 'asc'));
  }, [firestore]);

  const { data: players } = useCollection(playersRef);
  const currentUserData = players?.find(p => p.id === user?.uid);

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
            <h2 className="text-xl font-bold tracking-tight text-white leading-none">Real Acade</h2>
            <p className="text-[10px] uppercase tracking-widest text-primary font-black mt-1">Club de Élite</p>
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
                className="py-6 transition-all duration-200"
                >
                <Link href={item.href}>
                    <item.icon className={cn("transition-colors", pathname.startsWith(item.href) ? "text-primary" : "text-muted-foreground")} />
                    <span className="font-semibold">{item.label}</span>
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
                  className="py-6 text-orange-400 hover:text-orange-500 hover:bg-orange-500/10"
                >
                  <Link href="/generator">
                      <Dices className={cn(pathname.startsWith("/generator") ? "text-orange-400" : "text-orange-400/70")} />
                      <span className="font-bold">Equilibrador Pro</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-white/5 bg-black/20">
         {!isUserLoading && user ? (
           <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3 px-2 py-1">
                <Avatar className={cn("h-10 w-10 border-2", isAdmin ? "border-yellow-500 shadow-lg shadow-yellow-500/20" : "border-primary/20")}>
                  <AvatarFallback className="bg-muted text-xs font-black">
                    {getInitials(currentUserData?.name || user.email || "U")}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col min-w-0">
                  <span className="text-sm font-bold text-white truncate">
                    {currentUserData?.name || user.email?.split('@')[0]}
                  </span>
                  <div className="flex items-center gap-1">
                    {isAdmin ? (
                      <span className="flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-yellow-500">
                        <ShieldCheck className="h-2.5 w-2.5" /> Admin
                      </span>
                    ) : (
                      <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">
                        Jugador
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton 
                    onClick={handleLogout}
                    className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                    <span className="font-semibold">Cerrar Sesión</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
           </div>
         ) : isUserLoading ? (
           <div className="flex items-center gap-3 px-2 py-4">
             <div className="h-8 w-8 animate-pulse bg-white/5 rounded-full" />
             <div className="h-4 w-24 animate-pulse bg-white/5 rounded" />
           </div>
         ) : null}
      </SidebarFooter>
    </Sidebar>
  );
}
