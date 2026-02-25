import { UserAuthForm } from "@/components/auth/user-auth-form";
import { Fut7StatsLogo } from "@/components/icons";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  return (
    <div className="flex flex-col items-center gap-8 w-full px-4">
      <Card className="w-full max-w-sm bg-surface-800 border-none rounded-none shadow-[0_30px_60px_rgba(0,0,0,0.5)] overflow-hidden">
        <div className="h-2 bg-primary w-full" />
        <CardHeader className="text-center pt-10">
          <div className="mb-6 flex justify-center">
            <Link href="/dashboard" className="transition-transform hover:scale-105 active:scale-95 bg-primary p-4 rounded-none shadow-xl shadow-primary/20">
              <Fut7StatsLogo className="h-16 w-16 text-primary-foreground" />
            </Link>
          </div>
          <CardTitle className="text-4xl font-bebas tracking-widest text-white">ACCESO MIEMBROS</CardTitle>
          <CardDescription className="font-oswald uppercase text-[10px] tracking-widest text-muted-foreground/60 mt-2">
            GESTIÓN OFICIAL DEL CLUB REAL ACADE
          </CardDescription>
        </CardHeader>
        <CardContent className="pb-10">
          <UserAuthForm mode="login" />
          <div className="mt-8 flex flex-col gap-4 text-center">
            <Button variant="link" asChild className="text-muted-foreground hover:text-primary text-[10px] font-oswald uppercase tracking-widest">
              <Link href="/dashboard" className="flex items-center justify-center gap-2">
                <ArrowLeft className="h-3 w-3" />
                Volver al Dashboard público
              </Link>
            </Button>
            <div className="pt-6 border-t border-white/5">
              <p className="text-[9px] text-muted-foreground/30 uppercase tracking-[0.4em] font-black">
                SISTEMA OFICIAL EST. 2010
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
