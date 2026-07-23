
'use client';

import * as React from 'react';
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { Header } from "@/components/layout/header";
import { useUser } from "@/firebase";
import { Loader2 } from "lucide-react";
import { SeasonProvider } from '@/context/season-context';

/**
 * AppLayout: Layout principal de Real Acade.
 * Permite el acceso público a todos los hijos (Dashboard, Standings, etc.).
 * Solo gestiona el estado de carga inicial de Firebase Auth.
 */
export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isUserLoading } = useUser();
  const [showLoading, setShowLoading] = React.useState(true);

  React.useEffect(() => {
    // Cuando isUserLoading es false, Firebase ha determinado si el usuario es null o un objeto User.
    // En ese momento, liberamos la vista para cualquier visitante.
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
            Accediendo a la Academia...
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
