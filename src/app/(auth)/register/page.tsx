import { Fut7StatsLogo } from "@/components/icons";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ShieldAlert } from "lucide-react";

export default function RegisterPage() {
  return (
    <Card className="w-full max-w-sm glass-card border-orange-500/20">
      <CardHeader className="text-center">
         <div className="mb-4 flex justify-center">
            <ShieldAlert className="h-12 w-12 text-orange-500" />
        </div>
        <CardTitle className="text-2xl font-black italic uppercase tracking-tighter text-orange-500">Registro Cerrado</CardTitle>
        <CardDescription>
          La creación de nuevas cuentas está deshabilitada por el momento.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-center text-muted-foreground">
          Esta aplicación es de uso exclusivo para los miembros oficiales de <strong>Real Acade</strong>.
        </p>
        <Button asChild className="w-full" variant="outline">
          <Link href="/dashboard">Volver al Dashboard</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
