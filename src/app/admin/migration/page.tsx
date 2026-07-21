import { redirect } from "next/navigation";

/**
 * Redirección para resolver el conflicto de rutas paralelas.
 * Este archivo debe ser eliminado manualmente si el error persiste.
 */
export default function RedirectToOfficialMigration() {
  redirect("/admin/migration");
}
