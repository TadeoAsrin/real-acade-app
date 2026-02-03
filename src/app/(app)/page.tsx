import { redirect } from "next/navigation";

/**
 * Este archivo gestiona la ruta raíz dentro del grupo (app).
 * Redirige al dashboard para mantener la coherencia con el acceso público.
 */
export default function AppHomePage() {
  redirect("/dashboard");
}

export const dynamic = 'force-static';
