
/**
 * Este archivo ha sido desactivado para resolver el conflicto de rutas duplicadas
 * con src/app/page.tsx. Next.js no permite múltiples archivos para la misma ruta (/).
 * La redirección principal se gestiona ahora únicamente desde el root.
 */
import { redirect } from "next/navigation";

export default function ConflictedPage() {
  redirect("/dashboard");
}
