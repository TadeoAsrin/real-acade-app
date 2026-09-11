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

  // La Previa is a dashboard feature, not an empty-state destination. Until the
  // admin publishes one, it should take up zero space in the public dashboard.
  if (isLoading || error || !data || data.seasonId !== seasonId || data.status !== 'published') return null;
  return <EditionView edition={data} />;
}

export function PublishedPrevia() {
  const { selectedSeasonId, loading } = useSeason();
  if (loading || !selectedSeasonId) return null;
  return <SeasonEdition key={selectedSeasonId} seasonId={selectedSeasonId} />;
}
