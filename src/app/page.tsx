
'use client';

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/firebase";
import { Loader2 } from "lucide-react";

/**
 * RootPage: Punto de entrada de la aplicación.
 * Redirige siempre al Dashboard para garantizar que el acceso sea público e inmediato.
 */
export default function RootPage() {
  const router = useRouter();
  const { isUserLoading } = useUser();

  useEffect(() => {
    // Una vez que sabemos el estado del usuario (logueado o no),
    // simplemente mandamos a todos al Dashboard.
    if (!isUserLoading) {
      router.replace("/dashboard");
    }
  }, [isUserLoading, router]);

  return (
    <div className="flex h-screen w-full items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="font-bebas text-xl tracking-widest text-muted-foreground uppercase">
          Real Acade • Cargando...
        </p>
      </div>
    </div>
  );
}
