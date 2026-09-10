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
import { Goal, BarChart3, Users, LogOut, Trophy, Dices, ArrowLeftRight, Swords, Image as ImageIcon, ShieldCheck, LogIn } from "lucide-react";
import Link from "next/link";
import { useAuth, useUser, useFirestore, useMemoFirebase, useDoc, useCollection } from "@/firebase";
import { signOut } from "firebase/auth";
import { useToast } from "@/hooks/use-toast";
import { doc, collection, query, orderBy } from "firebase/firestore";
import { Avatar, AvatarFallback } from "../ui/avatar";
import { Button } from "../ui/button";
import { getInitials, cn } from "@/lib/utils";
import { Fut7StatsLogo } from "@/components/icons";
import { SeasonSelector } from "@/components/layout/season-selector";

const menuItems = [
  { href: "/dashboard", label: "PANEL DE CONTROL", icon: BarChart3 },
  { href: "/standings", label: "CLASIFICACIÓN", icon: Trophy },
  { href: "/matches", label: "PARTIDOS", icon: Goal },
  { href: "/players", label: "JUGADORES", icon: Users },
  { href: "/gallery", label: "GALERÍA", icon: ImageIcon },
  { href: "/compare", label: "VERSUS MODE", icon: ArrowLeftRight },
];

const tacticalItems = [
  { href: "/hierarchy", label: "ORDEN DE MANDO", icon: ShieldCheck },
  { href: "/admin/management", label: "GESTIÓN DE CLUB", icon: ShieldCheck },
  { href: "/drafts/new", label: "PAN Y QUESO", icon: Swords },
  { href: "/generator", label: "EQUILIBRADOR PRO", icon: Dices },
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
  const isAdmin = adminRole?.isAdmin || user?.email === 'tadeoasrin@gmail.com';

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast({ title: "Sesión cerrada", description: "Has salido de Real Acade correctamente." });
      if (isMobile) setOpenMobile(false);
      router.push("/dashboard");
    } catch (error) {
      console.error("Logout error", error);
    }
  };

  const handleNavClick = () => {
    if (isMobile) setOpenMobile(false);
  };

  const navClasses = (active: boolean) => cn(
    "py-5 px-4 rounded-xl transition-all duration-200",
    active
      ? "bg-primary/12 text-primary"
      : "text-muted-foreground hover:text-white hover:bg-white/[0.045]"
  );

  return (
    <Sidebar className="border-r border-white/[0.06] bg-[#0b1220]">
      <SidebarHeader className="p-6 pb-2">
        <div className="flex items-center gap-4 mb-6">
          <div className="h-12 w-12 rounded-xl bg-white/[0.04] flex items-center justify-center border border-white/10 overflow-hidden shadow-lg">
            <Fut7StatsLogo width={48} height={48} className="shrink-0" />
          </div>
          <div className="flex flex-col">
            <h2 className="text-xl font-extrabold tracking-tight text-white leading-none">REAL ACADE</h2>
            <p className="text-[8px] uppercase tracking-[0.18em] text-primary font-semibold mt-1.5">CLUB DE FULBO</p>
          </div>
        </div>
        <div className="px-1">
          <SeasonSelector className="w-full" />
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarMenu className="px-3 pt-6 gap-1">
          {menuItems.map((item) => {
            const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
            return (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton asChild isActive={active} tooltip={item.label} className={navClasses(active)}>
                  <Link href={item.href} onClick={handleNavClick}>
                    <item.icon className="h-4 w-4" />
                    <span className="font-semibold text-[10px] tracking-[0.12em] uppercase">{item.label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}

          {isAdmin && (
            <>
              <div className="px-4 pt-7 pb-3 mt-3">
                <p className="text-[8px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/35">ZONA TÁCTICA</p>
              </div>
              {tacticalItems.map((item) => {
                const active = pathname.startsWith(item.href);
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton asChild isActive={active} className={navClasses(active)}>
                      <Link href={item.href} onClick={handleNavClick}>
                        <item.icon className="h-4 w-4" />
                        <span className="font-semibold text-[10px] tracking-[0.12em] uppercase">{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </>
          )}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter className="p-6 border-t border-white/[0.06]">
        {user ? (
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <Avatar className="h-9 w-9 border border-white/10">
                <AvatarFallback className="bg-surface-900 text-[10px] font-semibold text-primary">
                  {getInitials(currentUserData?.name || user.email || "U")}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-semibold text-white truncate">
                  {currentUserData?.name || user.email?.split('@')[0]}
                </span>
                {isAdmin && <span className="text-[7px] font-semibold text-primary uppercase tracking-[0.1em]">ADMINISTRADOR</span>}
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="w-full justify-start text-muted-foreground hover:text-destructive hover:bg-destructive/10 text-[9px] font-semibold h-8"
            >
              <LogOut className="h-3 w-3 mr-2" />
              CERRAR SESIÓN
            </Button>
          </div>
        ) : (
          <Button asChild variant="outline" size="sm" className="w-full h-10 text-sm font-semibold tracking-wide border-primary/20 hover:bg-primary/10 text-primary">
            <Link href="/login" onClick={handleNavClick}>
              <LogIn className="h-4 w-4 mr-2" />
              ACCESO ADMIN
            </Link>
          </Button>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
