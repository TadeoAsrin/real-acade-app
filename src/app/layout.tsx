import type { Metadata, Viewport } from "next";
import { Inter, Bebas_Neue, Oswald, Playfair_Display, Lora } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/toaster";
import { FirebaseClientProvider } from "@/firebase";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const bebasNeue = Bebas_Neue({ subsets: ["latin"], weight: "400", variable: "--font-bebas" });
const oswald = Oswald({ subsets: ["latin"], variable: "--font-oswald" });
const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-playfair" });
const lora = Lora({ subsets: ["latin"], variable: "--font-lora" });

export const metadata: Metadata = {
  title: "Real Acade | Liga Oficial de Fútbol 7",
  description: "Plataforma oficial de estadísticas y crónicas de la competición Real Acade.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0A1428",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="dark">
      <body className={cn(
        "min-h-screen font-sans antialiased selection:bg-primary/30",
        inter.variable,
        bebasNeue.variable,
        oswald.variable,
        playfair.variable,
        lora.variable
      )}>
        <FirebaseClientProvider>
          {children}
          <Toaster />
        </FirebaseClientProvider>
      </body>
    </html>
  );
}
