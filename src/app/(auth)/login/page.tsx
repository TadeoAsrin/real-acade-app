import { UserAuthForm } from "@/components/auth/user-auth-form";
import { Fut7StatsLogo } from "@/components/icons";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function LoginPage() {
  return (
    <Card className="w-full max-w-sm glass-card border-white/10">
      <CardHeader className="text-center">
        <div className="mb-4 flex justify-center">
            <Fut7StatsLogo className="h-12 w-12 text-primary" />
        </div>
        <CardTitle className="text-2xl font-black italic uppercase tracking-tighter">Acceso Miembros</CardTitle>
        <CardDescription>
          Ingresa tus credenciales para gestionar el club.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <UserAuthForm mode="login" />
        <div className="mt-6 text-center">
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
            App en fase privada - Real Acade
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
