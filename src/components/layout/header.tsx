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
import { LogOut, User, Loader2, LogIn } from "lucide-react";
import { useUser, useFirestore, useMemoFirebase, useCollection, useAuth } from "@/firebase";
import { collection, query, orderBy } from "firebase/firestore";
import { signOut } from "firebase/auth";
import type { Player } from "@/lib/definitions";
import { useToast } from "@/hooks/use-toast";
import { getInitials } from "@/lib/utils";
import Link from "next/link";

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
        <h1 className="text-base font-black uppercase italic tracking-tight md:text-xl">
          {getPageTitle(pathname)}
        </h1>
      </div>

      <div className="flex-1" />

      {isUserLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : user ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-8 w-8 rounded-full md:h-10 md:w-10">
              <Avatar className="h-8 w-8 border-2 border-primary/20 md:h-10 md:w-10">
                <AvatarFallback className="bg-primary/10 text-primary font-black text-[10px] md:text-xs">
                  {getInitials(currentUser?.name || user?.email || "U")}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">
                  {currentUser?.name || user?.email || "Usuario"}
                </p>
                <p className="text-[10px] leading-none text-muted-foreground uppercase tracking-widest font-bold mt-1">
                  {currentUser?.role === 'admin' ? 'Administrador' : 'Jugador'}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => currentUser && router.push(`/players/${currentUser.id}`)}>
              <User className="mr-2 h-4 w-4" />
              <span>Mi Perfil</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Cerrar Sesión</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        <Button asChild variant="outline" size="sm" className="h-8 gap-2 border-primary/20 hover:bg-primary/10 text-[10px] md:text-xs">
          <Link href="/login">
            <LogIn className="h-3 w-3" />
            <span>Acceder</span>
          </Link>
        </Button>
      )}
    </header>
  );
}
