// This file is deprecated to avoid parallel route conflicts with root src/app/page.tsx.
import { redirect } from 'next/navigation';
export default function RedirectPage() {
  redirect('/dashboard');
}
