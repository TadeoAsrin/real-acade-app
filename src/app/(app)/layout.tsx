'use client';

import * as React from 'react';
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { Header } from "@/components/layout/header";
import { SeasonProvider } from '@/context/season-context';

/**
 * AppLayout: Layout principal de Real Acade.
 * Diseñado para ser 100% público. No bloquea el renderizado ni redirige al login.
 * Los componentes internos (Header, Sidebar) se encargan de mostrar u ocultar
 * opciones administrativas según el estado de autenticación.
 */
export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
