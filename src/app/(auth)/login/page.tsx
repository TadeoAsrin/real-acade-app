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
    <div className="flex flex-col items-center gap-6">
      <Card className="w-full max-w-sm glass-card border-white/10">
        <CardHeader className="text-center">
          <div className="mb-4 flex justify-center">
            <Link href="/dashboard" className="transition-transform hover:scale-110 active:scale-95">
              <Fut7StatsLogo className="h-12 w-12 text-primary" />
            </Link>
          </div>
          <CardTitle className="text-2xl font-black italic uppercase tracking-tighter">Acceso Miembros</CardTitle>
          <CardDescription>
            Ingresa tus credenciales para gestionar el club.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <UserAuthForm mode="login" />
          <div className="mt-6 flex flex-col gap-4 text-center">
            <Button variant="link" asChild className="text-muted-foreground hover:text-primary text-xs">
              <Link href="/dashboard" className="flex items-center gap-2">
                <ArrowLeft className="h-3 w-3" />
                Volver al Dashboard público
              </Link>
            </Button>
            <p className="text-[10px] text-muted-foreground/50 uppercase tracking-widest font-bold">
              App en fase privada - Real Acade
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
