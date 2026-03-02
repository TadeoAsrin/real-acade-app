
import { redirect } from "next/navigation";

/**
 * Este archivo ha sido modificado para evitar conflictos con el archivo raíz src/app/page.tsx.
 * Ambos resuelven a la misma ruta (/), lo que causa errores de compilación en Next.js 15.
 * Redirigimos al dashboard para mantener la consistencia.
 */
export default function AppPageRedirect() {
  redirect("/dashboard");
}

export const dynamic = 'force-static';
