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

export default function RegisterPage() {
  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="text-center">
         <div className="mb-4 flex justify-center">
            <Fut7StatsLogo className="h-12 w-12 text-primary" />
        </div>
        <CardTitle>Crear una cuenta</CardTitle>
        <CardDescription>
          Ingresa tu email para crear tu cuenta
        </CardDescription>
      </CardHeader>
      <CardContent>
        <UserAuthForm mode="register" />
        <p className="px-8 text-center text-sm text-muted-foreground">
          <Link
            href="/login"
            className="hover:text-brand underline underline-offset-4"
          >
            ¿Ya tienes una cuenta? Inicia sesión
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
