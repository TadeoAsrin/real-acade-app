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

export default function LoginPage() {
  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="text-center">
        <div className="mb-4 flex justify-center">
            <Fut7StatsLogo className="h-12 w-12 text-primary" />
        </div>
        <CardTitle>Bienvenido de vuelta</CardTitle>
        <CardDescription>
          Ingresa tus credenciales para acceder a tu cuenta
        </CardDescription>
      </CardHeader>
      <CardContent>
        <UserAuthForm mode="login" />
        <p className="px-8 text-center text-sm text-muted-foreground">
          <Link
            href="/register"
            className="hover:text-brand underline underline-offset-4"
          >
            ¿No tienes una cuenta? Regístrate
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
