'use client';

import * as React from 'react';
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { Header } from "@/components/layout/header";
import { useUser } from "@/firebase";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { SeasonProvider } from '@/context/season-context';

/**
 * Layout Principal: Ahora permite el acceso a usuarios no autenticados (visitantes).
 * No redirige al login a menos que se intente acceder a una ruta protegida (manejado en las páginas).
 */
export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isUserLoading } = useUser();
  const [showLoading, setShowLoading] = React.useState(true);

  React.useEffect(() => {
    // Una vez que Firebase Auth determina el estado (logueado o no), dejamos de mostrar el cargador
    if (!isUserLoading) {
      setShowLoading(false);
    }
  }, [isUserLoading]);

  if (showLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="font-bebas text-xl tracking-widest text-muted-foreground uppercase">
            Preparando vestuario...
          </p>
        </div>
      </div>
    );
  }

  return (
    <SeasonProvider>
      <SidebarProvider>
        <div className="flex h-screen w-full overflow-hidden bg-background">
          <AppSidebar />

          <SidebarInset className="flex flex-col flex-1 overflow-hidden">
            <Header />

            <main className="flex-1 overflow-y-auto bg-dot-pattern">
              <div className="container mx-auto max-w-7xl">
                {children}
              </div>
            </main>

          </SidebarInset>
        </div>
      </SidebarProvider>
    </SeasonProvider>
  );
}
