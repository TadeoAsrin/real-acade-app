
'use client';

import * as React from 'react';
import { Inter, Bebas_Neue, Oswald, Playfair_Display, Lora } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/toaster";
import { FirebaseClientProvider } from "@/firebase";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { Header } from "@/components/layout/header";
import { usePathname } from "next/navigation";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const bebasNeue = Bebas_Neue({ subsets: ["latin"], weight: "400", variable: "--font-bebas" });
const oswald = Oswald({ subsets: ["latin"], variable: "--font-oswald" });
const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-playfair" });
const lora = Lora({ subsets: ["latin"], variable: "--font-lora" });

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const isAuthPage = pathname === '/login' || pathname === '/register';

  return (
    <html lang="es" className="dark">
      <body className={cn(
        "min-h-screen font-sans antialiased selection:bg-primary/30 bg-background text-foreground",
        inter.variable,
        bebasNeue.variable,
        oswald.variable,
        playfair.variable,
        lora.variable
      )}>
        <FirebaseClientProvider>
          <TooltipProvider>
            {isAuthPage ? (
              <div className="relative flex min-h-screen flex-col items-center justify-center bg-background">
                {children}
                <Toaster />
              </div>
            ) : (
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
                <Toaster />
              </SidebarProvider>
            )}
          </TooltipProvider>
        </FirebaseClientProvider>
      </body>
    </html>
  );
}
