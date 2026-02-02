
import { redirect } from "next/navigation";

/**
 * Página de entrada de la aplicación.
 * Redirige automáticamente al login para asegurar que los usuarios se identifiquen
 * antes de ver las estadísticas del club.
 */
export default function Home() {
  redirect("/login");
}
