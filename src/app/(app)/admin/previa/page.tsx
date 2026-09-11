'use client';

import * as React from 'react';
import { collection, doc, getDocFromServer, query, where } from 'firebase/firestore';
import { useFirestore, useUser, useDoc, useMemoFirebase, useCollection } from '@/firebase';
import { useSeason } from '@/context/season-context';
import type { Match, Player } from '@/lib/definitions';
import { type PreviaDraft } from '@/lib/previa/edition';
import { savePrevia } from '@/lib/previa/repository';
import { PreviaEditor } from '@/components/previa/previa-editor';
import { Button } from '@/components/ui/button';

function SeasonEditor({ seasonId, seasonName }: { seasonId: string; seasonName: string }) {
  const firestore = useFirestore();
  const [initialDraft, setInitialDraft] = React.useState<PreviaDraft | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(false);
  const [retry, setRetry] = React.useState(0);
  const playersRef = useMemoFirebase(() => collection(firestore, 'players'), [firestore]);
  const matchesRef = useMemoFirebase(() => query(collection(firestore, 'matches'), where('seasonId', '==', seasonId)), [firestore, seasonId]);
  const { data: players, error: playersError } = useCollection<Player>(playersRef);
  const { data: matches, error: matchesError } = useCollection<Match>(matchesRef);
  React.useEffect(() => {
    let active = true;
    setLoading(true); setError(false);
    getDocFromServer(doc(firestore, 'previa_drafts', seasonId)).then(snapshot => {
      if (active) { setInitialDraft(snapshot.exists() ? snapshot.data() as PreviaDraft : null); setLoading(false); }
    }).catch(() => { if (active) { setError(true); setLoading(false); } });
    return () => { active = false; };
  }, [firestore, seasonId, retry]);
  if (error || playersError || matchesError) return <div role="alert" className="space-y-3"><p>No se pudo cargar la redacción. Revisá la conexión y el acceso de administrador.</p><Button onClick={() => setRetry(r => r + 1)}>Reintentar</Button></div>;
  if (loading || !players || !matches) return <p role="status">Cargando datos de la temporada...</p>;
  return <PreviaEditor seasonId={seasonId} seasonName={seasonName} players={players} matches={matches} initialDraft={initialDraft} onSave={(draft, action) => savePrevia(firestore, draft, action)} />;
}
export default function AdminPreviaPage() {
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();
  const { selectedSeasonId, selectedSeason, loading } = useSeason();
  const roleRef = useMemoFirebase(() => user ? doc(firestore, 'roles_admin', user.uid) : null, [firestore, user]);
  const { data: role, isLoading: roleLoading } = useDoc<{ isAdmin: boolean }>(roleRef);
  const isAdmin = user?.email === 'tadeoasrin@gmail.com' || role?.isAdmin === true;
  return <div className="max-w-6xl mx-auto p-4 lg:p-8 pb-20">
    {isUserLoading || loading || roleLoading ? <p role="status">Verificando acceso...</p> : !isAdmin ? <p role="alert">Ingresá con una cuenta de administrador para editar La Previa.</p> : !selectedSeasonId || !selectedSeason ? <p>Seleccioná una temporada.</p> : <SeasonEditor key={`${user?.uid}:${selectedSeasonId}`} seasonId={selectedSeasonId} seasonName={selectedSeason.name} />}
  </div>;
}
