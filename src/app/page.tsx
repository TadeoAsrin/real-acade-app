import { redirect } from "next/navigation";

/**
 * Componente principal de la ruta raíz.
 * Realiza una redirección limpia al dashboard para asegurar que
 * la aplicación siempre tenga un punto de entrada válido.
 */
export default function RootPage() {
  redirect("/dashboard");
}

export const dynamic = 'force-static';
