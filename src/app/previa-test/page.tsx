'use client';
// Local emulator harness only. Copy into src/app/previa-test/page.tsx for browser QA; never ship that route.
import * as React from 'react';
import { initializeApp, getApps } from 'firebase/app';
import { getAuth, connectAuthEmulator, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { FirebaseProvider } from '@/firebase/provider';
import { SeasonProvider } from '@/context/season-context';
import { SeasonSelector } from '@/components/layout/season-selector';
import AdminPreviaPage from '@/app/(app)/admin/previa/page';
import { PublishedPrevia } from '@/components/previa/published-previa';
import { Button } from '@/components/ui/button';

function sdk() {
  const existing = getApps().find(a => a.name === 'previa-qa');
  const app = existing ?? initializeApp({ apiKey: 'emulator-only', projectId: 'demo-real-acade-previa', authDomain: 'localhost' }, 'previa-qa');
  const auth = getAuth(app); const firestore = getFirestore(app);
  if (!existing) { connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true }); connectFirestoreEmulator(firestore, '127.0.0.1', 8088); }
  return { firebaseApp: app, auth, firestore };
}
export default function BrowserHarness() {
  const [services, setServices] = React.useState<ReturnType<typeof sdk> | null>(null);
  const [mode, setMode] = React.useState<'admin' | 'public'>('public');
  React.useEffect(() => { setServices(sdk()); }, []);
  if (!services) return <p>Cargando prueba local...</p>;
  return <FirebaseProvider {...services}><SeasonProvider>
    <div className="max-w-7xl mx-auto p-4 space-y-4">
      <p>Prueba local · Datos ficticios · Emuladores Firebase</p>
      <div className="flex flex-wrap gap-3">
        <Button onClick={async () => { await signInWithEmailAndPassword(services.auth, 'editor@example.test', 'test-only-password'); setMode('admin'); }}>Ingresar editor de prueba</Button>
        <Button onClick={async () => { await signOut(services.auth); setMode('public'); }}>Ver como visitante</Button>
        <Button onClick={() => setMode('admin')}>Abrir editor</Button>
        <Button onClick={() => setMode('public')}>Ver publicación</Button>
        <SeasonSelector />
      </div>
      {mode === 'admin' ? <AdminPreviaPage /> : <PublishedPrevia />}
    </div>
  </SeasonProvider></FirebaseProvider>;
}
