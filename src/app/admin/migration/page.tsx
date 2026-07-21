// This file is deprecated to avoid parallel route conflicts.
// The logic has been moved to src/app/(app)/admin/migration/page.tsx.
import { redirect } from 'next/navigation';
export default function RedirectPage() {
  redirect('/admin/migration');
}
