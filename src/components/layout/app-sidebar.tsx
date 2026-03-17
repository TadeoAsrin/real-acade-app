
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
import { Goal, BarChart3, Users, LogOut, Trophy, Dices, ArrowLeftRight, Swords } from "lucide-react";
import Link from "next/link";
import { useAuth, useUser, useFirestore, useMemoFirebase, useDoc, useCollection } from "@/firebase";
import { signOut } from "firebase/auth";
import { useToast } from "@/hooks/use-toast";
import { doc, collection, query, orderBy } from "firebase/firestore";
import { Avatar, AvatarFallback } from "../ui/avatar";
import { Button } from "../ui/button";
import { getInitials, cn } from "@/lib/utils";
import { Fut7StatsLogo } from "@/components/icons";

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
  const { user } = useUser();
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
    <Sidebar className="border-r border-white/5 bg-[#0b1220]">
      <SidebarHeader className="p-6">
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20 overflow-hidden">
            <Fut7StatsLogo width={28} height={28} className="shrink-0" />
          </div>
          <div className="flex flex-col">
            <h2 className="text-lg font-bold tracking-tight text-white leading-none">REAL ACADE</h2>
            <p className="text-[8px] uppercase tracking-[0.2em] text-primary font-bold mt-1">CLUB DE FULBO</p>
          </div>
        </div>
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarMenu className="px-3 pt-6 gap-1">
            {menuItems.map((item) => (
            <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                asChild
                isActive={pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))}
                tooltip={item.label}
                className={cn(
                  "py-5 px-4 transition-all duration-200 rounded-lg",
                  (pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))) 
                    ? "bg-primary/10 text-primary" 
                    : "text-muted-foreground hover:bg-white/5"
                )}
                >
                <Link href={item.href} onClick={handleNavClick}>
                    <item.icon className="h-4 w-4" />
                    <span className="font-bold text-[10px] tracking-widest uppercase">{item.label}</span>
                </Link>
                </SidebarMenuButton>
            </SidebarMenuItem>
            ))}
            
            {isAdmin && (
              <>
                <div className="px-4 py-4 mt-4">
                  <p className="text-[8px] font-black uppercase tracking-[0.3em] text-muted-foreground/30">ZONA TÁCTICA</p>
                </div>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname.startsWith("/drafts/new")}
                    className="py-5 px-4 text-emerald-500/70 hover:text-emerald-400 hover:bg-emerald-500/5 rounded-lg"
                  >
                    <Link href="/drafts/new" onClick={handleNavClick}>
                        <Swords className="h-4 w-4" />
                        <span className="font-bold text-[10px] tracking-widest uppercase">PAN Y QUESO</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname.startsWith("/generator")}
                    className="py-5 px-4 text-orange-500/70 hover:text-orange-400 hover:bg-orange-500/5 rounded-lg"
                  >
                    <Link href="/generator" onClick={handleNavClick}>
                        <Dices className="h-4 w-4" />
                        <span className="font-bold text-[10px] tracking-widest uppercase">EQUILIBRADOR PRO</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </>
            )}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter className="p-6 border-t border-white/5">
         {user && (
           <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <Avatar className="h-9 w-9 border border-white/10">
                  <AvatarFallback className="bg-surface-900 text-[10px] font-bold text-primary">
                    {getInitials(currentUserData?.name || user.email || "U")}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-bold text-white truncate">
                    {currentUserData?.name || user.email?.split('@')[0]}
                  </span>
                  {isAdmin && (
                    <span className="text-[7px] font-bold text-primary uppercase">ADMINISTRADOR</span>
                  )}
                </div>
              </div>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={handleLogout}
                className="w-full justify-start text-muted-foreground hover:text-destructive hover:bg-destructive/10 text-[9px] font-bold h-8"
              >
                <LogOut className="h-3 w-3 mr-2" />
                CERRAR SESIÓN
              </Button>
           </div>
         )}
      </SidebarFooter>
    </Sidebar>
  );
}
