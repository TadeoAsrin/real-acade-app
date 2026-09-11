'use client';

import { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import { useSeason } from '@/context/season-context';
import type { PublishedPrevia } from '@/lib/previa/edition';
import { EditionView } from './edition-view';

function SeasonEdition({ seasonId }: { seasonId: string }) {
  const firestore = useFirestore();
  const [edition, setEdition] = useState<PublishedPrevia | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadEdition() {
      try {
        const snapshot = await getDoc(doc(firestore, 'published_previas', seasonId));
        if (cancelled || !snapshot.exists()) return;

        const data = snapshot.data() as PublishedPrevia;
        if (data.seasonId === seasonId && data.status === 'published') {
          setEdition(data);
        }
      } catch (error) {
        console.error('No se pudo cargar La Previa publicada:', error);
      }
    }

    void loadEdition();
    return () => {
      cancelled = true;
    };
  }, [firestore, seasonId]);

  // No empty state: the dashboard only reserves space when there is a published edition.
  if (!edition) return null;
  return <EditionView edition={edition} />;
}

export function PublishedPrevia() {
  const { selectedSeasonId, loading } = useSeason();
  if (loading || !selectedSeasonId) return null;
  return <SeasonEdition key={selectedSeasonId} seasonId={selectedSeasonId} />;
}
