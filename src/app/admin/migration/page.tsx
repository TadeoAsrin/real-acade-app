import { redirect } from 'next/navigation';

/**
 * REDIRECCIÓN DE SEGURIDAD.
 * Este archivo existe solo para satisfacer al compilador de Next.js y evitar errores de exportación.
 * La página real reside en src/app/(app)/admin/migration/page.tsx para heredar el layout con Sidebar.
 */
export default function AdminMigrationRoot() {
  redirect('/admin/migration');
  return null;
}
