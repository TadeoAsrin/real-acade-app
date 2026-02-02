
"use client";

import { usePathname, useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
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
import { LogOut, User, Loader2 } from "lucide-react";
import { useUser, useFirestore, useMemoFirebase, useCollection, useAuth } from "@/firebase";
import { collection, query, orderBy } from "firebase/firestore";
import { signOut } from "firebase/auth";
import type { Player } from "@/lib/definitions";
import { useToast } from "@/hooks/use-toast";

const getPageTitle = (pathname: string) => {
  if (pathname.includes("/dashboard")) return "Panel de Control";
  if (pathname.includes("/matches/new")) return "Nuevo Partido";
  if (pathname.includes("/matches")) return "Historial de Partidos";
  if (pathname.includes("/players")) return "Jugadores";
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
      toast({
        title: "Sesión cerrada",
        description: "Vuelve pronto a Real Acade.",
      });
      router.push("/login");
    } catch (error) {
      console.error("Logout error", error);
    }
  };

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-sm md:px-6">
      <div className="md:hidden">
        <SidebarTrigger />
      </div>
      <div className="flex-1">
        <h1 className="text-lg font-semibold md:text-xl">
          {getPageTitle(pathname)}
        </h1>
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-10 w-10 rounded-full">
            {isUserLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
                <Avatar className="h-10 w-10">
                <AvatarImage src={currentUser?.avatar} alt={currentUser?.name || user?.email || ""} />
                <AvatarFallback>{(currentUser?.name || user?.email || "U").charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" forceMount>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">
                {currentUser?.name || user?.email || "Usuario"}
              </p>
              <p className="text-xs leading-none text-muted-foreground">
                Perfil de {currentUser?.role === 'admin' ? 'Administrador' : 'Jugador'}
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
    </header>
  );
}
