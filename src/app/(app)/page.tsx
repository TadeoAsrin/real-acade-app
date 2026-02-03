import { redirect } from "next/navigation";

/**
 * Este archivo ha sido desactivado permanentemente para resolver la colisión de rutas
 * en la raíz (/) con src/app/page.tsx, que es la causa principal del error 51 en build.
 */
export default function RedirectToDashboard() {
  redirect("/dashboard");
}
