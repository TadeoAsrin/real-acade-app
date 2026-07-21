import { redirect } from "next/navigation";

/**
 * Punto de entrada único que redirige al Dashboard oficial.
 * Al estar en la raíz, no colisiona con (app) si (app)/page.tsx no existe.
 */
export default function RootPage() {
  redirect("/dashboard");
}

export const dynamic = 'force-static';
