
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
  if (pathname.includes("/dashboard")) return "Real Acade";
  if (pathname.includes("/matches/new")) return "Nuevo Partido";
  if (pathname.includes("/matches")) return "Partidos";
  if (pathname.includes("/players")) return "Jugadores";
  if (pathname.includes("/compare")) return "Versus";
  if (pathname.includes("/generator")) return "Equilibrador";
  if (pathname.includes("/standings")) return "Tabla";
  return "Real Acade";
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
    <header className="sticky top-0 z-20 flex h-14 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-sm md:h-16 md:px-6">
      <div className="flex items-center gap-2">
        <SidebarTrigger className="h-8 w-8" />
        <h1 className="text-base font-black uppercase italic tracking-tight md:text-xl text-white">
          {getPageTitle(pathname)}
        </h1>
      </div>

      <div className="flex-1" />

      {isUserLoading ? (
        <Loader2 className="h-4 w-4 animate-spin text-primary" />
      ) : user ? (
        <div className="flex items-center gap-3">
          <div className="hidden md:flex flex-col items-end mr-1">
             <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Logueado como:</span>
             <span className={cn(
               "text-xs font-bold leading-none mt-0.5",
               isAdmin ? "text-yellow-500" : "text-primary"
             )}>
               {currentUser?.name || user.email?.split('@')[0]}
             </span>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full md:h-10 md:w-10">
                <Avatar className={cn(
                  "h-8 w-8 border-2 md:h-10 md:w-10 transition-all",
                  isAdmin ? "border-yellow-500 shadow-lg shadow-yellow-500/20" : "border-primary/20"
                )}>
                  <AvatarFallback className="bg-muted text-primary font-black text-[10px] md:text-xs">
                    {getInitials(currentUser?.name || user?.email || "U")}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-bold leading-none text-white">
                    {currentUser?.name || user?.email || "Usuario"}
                  </p>
                  <div className="flex items-center gap-1.5 mt-1">
                    {isAdmin ? (
                      <span className="flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-yellow-500">
                        <ShieldCheck className="h-2.5 w-2.5" /> Administrador
                      </span>
                    ) : (
                      <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">
                        Jugador del Club
                      </span>
                    )}
                  </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                className="cursor-pointer"
                onClick={() => currentUser && router.push(`/players/${currentUser.id}`)}
              >
                <User className="mr-2 h-4 w-4" />
                <span>Ver Mi Perfil</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={handleLogout} 
                className="text-destructive focus:text-destructive cursor-pointer font-bold"
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Cerrar Sesión</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ) : (
        <Button asChild variant="default" size="sm" className="h-8 gap-2 font-black uppercase italic text-[10px] md:text-xs tracking-tighter">
          <Link href="/login">
            <LogIn className="h-3.5 w-3.5" />
            <span>Acceder</span>
          </Link>
        </Button>
      )}
    </header>
  );
}
