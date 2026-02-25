"use client";

import { usePathname, useRouter } from "next/navigation";
import { Avatar, AvatarFallback } from "../ui/avatar";
import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { SidebarTrigger } from "../ui/sidebar";
import { LogOut, User, Loader2, LogIn, ShieldCheck } from "lucide-react";
import { useUser, useFirestore, useMemoFirebase, useCollection, useAuth, useDoc } from "@/firebase";
import { collection, query, orderBy, doc } from "firebase/firestore";
import { signOut } from "firebase/auth";
import type { Player } from "@/lib/definitions";
import { useToast } from "@/hooks/use-toast";
import { getInitials } from "@/lib/utils";
import Link from "next/link";
import { cn } from "@/lib/utils";

const getPageTitle = (pathname: string) => {
  if (pathname.includes("/dashboard")) return "PANEL DE CONTROL";
  if (pathname.includes("/matches/new")) return "REGISTRO DE BATALLA";
  if (pathname.includes("/matches")) return "HISTORIAL OFICIAL";
  if (pathname.includes("/players")) return "PLANTILLA ÉLITE";
  if (pathname.includes("/compare")) return "VERSUS MODE";
  if (pathname.includes("/generator")) return "EQUILIBRADOR PRO";
  if (pathname.includes("/standings")) return "TABLA DE POSICIONES";
  return "REAL ACADE";
};

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const auth = useAuth();
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();
  const { toast } = useToast();

  const playersRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'players'), orderBy('name', 'asc'));
  }, [firestore]);

  const { data: players } = useCollection<Player>(playersRef);
  const currentUser = players?.find(p => p.id === user?.uid);

  const adminRoleRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'roles_admin', user.uid);
  }, [firestore, user]);

  const { data: adminRole } = useDoc<{isAdmin: boolean}>(adminRoleRef);
  const isAdmin = adminRole?.isAdmin;

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast({ title: "Sesión cerrada", description: "Vuelve pronto a Real Acade." });
      router.push("/login");
    } catch (error) {
      console.error("Logout error", error);
    }
  };

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center gap-4 border-b border-border bg-background px-4 md:h-16 md:px-6 shadow-xl">
      <div className="flex items-center gap-4">
        <SidebarTrigger className="h-9 w-9 text-primary hover:bg-white/5" />
        <h1 className="text-xl md:text-3xl font-bebas uppercase tracking-wider text-white">
          {getPageTitle(pathname)}
        </h1>
      </div>

      <div className="flex-1" />

      {isUserLoading ? (
        <Loader2 className="h-4 w-4 animate-spin text-primary" />
      ) : user ? (
        <div className="flex items-center gap-4">
          <div className="hidden md:flex flex-col items-end mr-1">
             <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 font-oswald">USUARIO ACTIVO</span>
             <span className={cn(
               "text-sm font-black leading-none mt-0.5 font-bebas tracking-wide",
               isAdmin ? "text-primary" : "text-white"
             )}>
               {currentUser?.name || user.email?.split('@')[0]}
             </span>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-9 w-9 rounded-none border border-white/10 p-0 overflow-hidden">
                <Avatar className="h-full w-full rounded-none">
                  <AvatarFallback className="bg-surface-800 text-primary font-bebas text-lg">
                    {getInitials(currentUser?.name || user?.email || "U")}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 rounded-none bg-surface-900 border-border" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-black font-bebas tracking-wider text-white">
                    {currentUser?.name || user?.email || "Usuario"}
                  </p>
                  <div className="flex items-center gap-1.5 mt-1">
                    {isAdmin ? (
                      <span className="flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-primary font-oswald">
                        <ShieldCheck className="h-2.5 w-2.5" /> ADMINISTRADOR
                      </span>
                    ) : (
                      <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground font-oswald">
                        JUGADOR OFICIAL
                      </span>
                    )}
                  </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-white/5" />
              <DropdownMenuItem 
                className="cursor-pointer hover:bg-white/5 focus:bg-white/5 rounded-none"
                onClick={() => currentUser && router.push(`/players/${currentUser.id}`)}
              >
                <User className="mr-2 h-4 w-4" />
                <span className="font-oswald uppercase text-xs">Mi Perfil</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-white/5" />
              <DropdownMenuItem 
                onClick={handleLogout} 
                className="text-destructive focus:text-destructive focus:bg-destructive/5 cursor-pointer font-black rounded-none"
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span className="font-oswald uppercase text-xs">Cerrar Sesión</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ) : (
        <Button asChild variant="default" size="sm" className="h-9 px-6 rounded-none font-bebas text-base tracking-widest transition-transform active:scale-95 shadow-lg shadow-primary/20">
          <Link href="/login">
            <LogIn className="h-4 w-4 mr-2" />
            <span>ACCEDER</span>
          </Link>
        </Button>
      )}
    </header>
  );
}
