'use client';

import * as React from 'react';
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { Header } from "@/components/layout/header";
import { useUser } from "@/firebase";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  const [showLoading, setShowLoading] = React.useState(true);

  React.useEffect(() => {
    if (!isUserLoading) {
      if (!user) {
        router.replace('/login');
      } else {
        setShowLoading(false);
      }
      return;
    }

    const timer = setTimeout(() => {
      console.warn(
        "Firebase Auth tardó demasiado. Continuando con precaución."
      );
      if (!user && !isUserLoading) {
        router.replace('/login');
      } else {
        setShowLoading(false);
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, [isUserLoading, user, router]);

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

  // Si no hay usuario y ya no está cargando, no renderizamos nada mientras redirige
  if (!user && !isUserLoading) {
    return null;
  }

  return (
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
  );
}
