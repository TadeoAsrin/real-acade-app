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
  useSidebar,
} from "../ui/sidebar";
import { Goal, BarChart3, Users, LogOut, Trophy, Dices, ArrowLeftRight, ShieldCheck, Swords } from "lucide-react";
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
    label: "PANEL DE CONTROL",
    icon: BarChart3,
  },
  {
    href: "/standings",
    label: "CLASIFICACIÓN",
    icon: Trophy,
  },
  {
    href: "/matches",
    label: "PARTIDOS",
    icon: Goal,
  },
  {
    href: "/players",
    label: "JUGADORES",
    icon: Users,
  },
  {
    href: "/compare",
    label: "VERSUS MODE",
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
  const { setOpenMobile, isMobile } = useSidebar();

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
      if (isMobile) setOpenMobile(false);
      router.push("/login");
    } catch (error) {
      console.error("Logout error", error);
    }
  };

  const handleNavClick = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  return (
    <Sidebar className="border-r border-border bg-background">
      <SidebarHeader className="p-6">
        <div className="flex items-center gap-4">
          <div className="bg-primary p-2.5 rounded-none shadow-lg shadow-primary/20">
            <Fut7StatsLogo className="h-8 w-8 text-primary-foreground" />
          </div>
          <div className="flex flex-col">
            <h2 className="text-2xl font-bebas tracking-wider text-white leading-none">REAL ACADE</h2>
            <p className="text-[10px] uppercase tracking-[0.3em] text-primary font-black mt-1 font-oswald">CLUB DE ÉLITE</p>
          </div>
        </div>
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarMenu className="px-3 pt-6 gap-2">
            {menuItems.map((item) => (
            <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                asChild
                isActive={pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))}
                tooltip={item.label}
                className={cn(
                  "py-7 px-4 transition-all duration-200 rounded-none border-l-4 border-transparent hover:bg-white/5",
                  (pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))) && "border-l-primary bg-primary/5 text-primary"
                )}
                >
                <Link href={item.href} onClick={handleNavClick}>
                    <item.icon className={cn("h-5 w-5", (pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))) ? "text-primary" : "text-muted-foreground")} />
                    <span className="font-bebas text-lg tracking-widest">{item.label}</span>
                </Link>
                </SidebarMenuButton>
            </SidebarMenuItem>
            ))}
            
            {isAdmin && (
              <>
                <div className="px-4 py-4 mt-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground/40 font-oswald">ZONA TÁCTICA</p>
                </div>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname.startsWith("/drafts/new")}
                    tooltip="Nuevo Pan y Queso"
                    className="py-7 px-4 text-emerald-500 hover:text-emerald-400 hover:bg-emerald-500/5 rounded-none"
                  >
                    <Link href="/drafts/new" onClick={handleNavClick}>
                        <Swords className="h-5 w-5" />
                        <span className="font-bebas text-lg tracking-widest uppercase">PAN Y QUESO</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname.startsWith("/generator")}
                    tooltip="Equilibrador Pro"
                    className="py-7 px-4 text-orange-500 hover:text-orange-400 hover:bg-orange-500/5 rounded-none"
                  >
                    <Link href="/generator" onClick={handleNavClick}>
                        <Dices className="h-5 w-5" />
                        <span className="font-bebas text-lg tracking-widest uppercase">EQUILIBRADOR PRO</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </>
            )}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter className="p-6 border-t border-white/5 bg-surface-900/50">
         {!isUserLoading && user ? (
           <div className="flex flex-col gap-6">
              <div className="flex items-center gap-4 px-1 py-1">
                <Avatar className={cn("h-12 w-12 rounded-none border-2 transition-all", isAdmin ? "border-primary shadow-lg shadow-primary/20" : "border-white/10")}>
                  <AvatarFallback className="bg-surface-800 text-sm font-bebas text-primary">
                    {getInitials(currentUserData?.name || user.email || "U")}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col min-w-0">
                  <span className="text-base font-bebas tracking-wide text-white truncate">
                    {currentUserData?.name || user.email?.split('@')[0]}
                  </span>
                  <div className="flex items-center gap-1">
                    {isAdmin ? (
                      <span className="flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-primary font-oswald">
                        <ShieldCheck className="h-3 w-3" /> ADMINISTRADOR
                      </span>
                    ) : (
                      <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground font-oswald">
                        JUGADOR OFICIAL
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton 
                    onClick={handleLogout}
                    className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors font-oswald uppercase text-xs tracking-widest py-6"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>CERRAR SESIÓN</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
           </div>
         ) : null}
      </SidebarFooter>
    </Sidebar>
  );
}
