'use client';

import { doc } from 'firebase/firestore';
import { useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { useSeason } from '@/context/season-context';
import type { PublishedPrevia } from '@/lib/previa/edition';
import { EditionView } from './edition-view';

function SeasonEdition({ seasonId }: { seasonId: string }) {
  const firestore = useFirestore();
  const ref = useMemoFirebase(() => firestore ? doc(firestore, 'published_previas', seasonId) : null, [firestore, seasonId]);
  const { data, isLoading, error } = useDoc<PublishedPrevia>(ref);
  if (error) return <p role="alert" className="p-6 text-destructive">No se pudo cargar La Previa. Intentá recargar la página.</p>;
  if (isLoading) return <p role="status" className="p-6 text-muted-foreground">Cargando La Previa...</p>;
  if (!data || data.seasonId !== seasonId || data.status !== 'published') return (
    <section className="relative z-10 bg-[#111827] border border-dashed border-white/10 rounded-2xl p-8 space-y-2">
      <h2 className="text-3xl font-extrabold uppercase tracking-tight">La Previa</h2>
      <p className="text-muted-foreground">Todavía no hay una edición publicada para esta temporada.</p>
    </section>
  );
  return <EditionView edition={data} />;
}
export function PublishedPrevia() {
  const { selectedSeasonId, loading } = useSeason();
  if (loading) return <p role="status">Cargando temporada...</p>;
  if (!selectedSeasonId) return <p className="p-6 text-muted-foreground">Seleccioná una temporada para ver La Previa.</p>;
  return <SeasonEdition key={selectedSeasonId} seasonId={selectedSeasonId} />;
}
