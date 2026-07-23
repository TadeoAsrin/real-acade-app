import * as React from 'react';
import { Inter, Bebas_Neue, Oswald, Playfair_Display, Lora } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/toaster";
import { FirebaseClientProvider } from "@/firebase";
import { TooltipProvider } from "@/components/ui/tooltip";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const bebasNeue = Bebas_Neue({ subsets: ["latin"], weight: "400", variable: "--font-bebas" });
const oswald = Oswald({ subsets: ["latin"], variable: "--font-oswald" });
const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-playfair" });
const lora = Lora({ subsets: ["latin"], variable: "--font-lora" });

/**
 * Root Layout global. Ahora es un Server Component por defecto.
 * Los proveedores (Client Components) se inyectan como hijos.
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
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
            {children}
            <Toaster />
          </TooltipProvider>
        </FirebaseClientProvider>
      </body>
    </html>
  );
}
