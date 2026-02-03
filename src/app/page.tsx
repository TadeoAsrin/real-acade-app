
import { redirect } from "next/navigation";

/**
 * Página de entrada de la aplicación.
 * Redirige al dashboard para permitir el acceso público a las estadísticas.
 */
export default function Home() {
  redirect("/dashboard");
}
