import { redirect } from 'next/navigation';

/**
 * Este archivo causaba una colisión de rutas con src/app/(app)/admin/migration/page.tsx.
 * Se redirige a la ubicación oficial dentro del layout de la app.
 */
export default function RedirectToOfficialMigration() {
  redirect('/admin/migration');
}
