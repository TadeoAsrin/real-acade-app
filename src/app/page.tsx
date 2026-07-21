import { redirect } from "next/navigation";

/**
 * Punto de entrada único que redirige al Dashboard oficial.
 */
export default function RootPage() {
  redirect("/dashboard");
}

export const dynamic = 'force-static';
