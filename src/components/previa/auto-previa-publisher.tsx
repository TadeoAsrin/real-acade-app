'use client';

import * as React from 'react';
import { collection, doc, getDoc, getDocs, orderBy, query } from 'firebase/firestore';
import { useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { useSeason } from '@/context/season-context';
import type { Match, Player } from '@/lib/definitions';
import { PREVIA_GENERATION_VERSION, type PreviaDraft } from '@/lib/previa/edition';
import { regenerateAndPublishPrevia } from '@/lib/previa/repository';

const sameIds = (a: string[], b: string[]) =>
  a.length === b.length && a.every((id, index) => id === b[index]);

/**
 * Background editorial worker for admins.
 *
 * Match data is the trigger: whenever the official match collection changes,
 * it checks which season became stale and rebuilds + publishes La Previa. The
 * component renders nothing and never blocks navigation or match saving.
 */
export function AutoPreviaPublisher() {
  const firestore = useFirestore();
  const { user } = useUser();
  const { seasons, loading: seasonsLoading } = useSeason();
  const [canPublish, setCanPublish] = React.useState(false);
  const runningRef = React.useRef(false);

  React.useEffect(() => {
    let active = true;

    async function checkAdmin() {
      if (!firestore || !user) {
        if (active) setCanPublish(false);
        return;
      }

      if (user.email === 'tadeoasrin@gmail.com') {
        if (active) setCanPublish(true);
        return;
      }

      try {
        const role = await getDoc(doc(firestore, 'roles_admin', user.uid));
        if (active) setCanPublish(role.exists() && role.data().isAdmin === true);
      } catch {
        if (active) setCanPublish(false);
      }
    }

    void checkAdmin();
    return () => { active = false; };
  }, [firestore, user]);

  const matchesRef = useMemoFirebase(() => {
    if (!firestore || !canPublish) return null;
    return query(collection(firestore, 'matches'), orderBy('date', 'asc'));
  }, [firestore, canPublish]);
  const { data: matches } = useCollection<Match>(matchesRef);

  React.useEffect(() => {
    if (!firestore || !canPublish || seasonsLoading || !matches || !seasons.length || runningRef.current) return;

    let active = true;
    runningRef.current = true;

    async function syncPrevia() {
      try {
        const playersSnapshot = await getDocs(collection(firestore, 'players'));
        const players = playersSnapshot.docs.map(player => ({ id: player.id, ...player.data() } as Player));

        for (const season of seasons) {
          if (!active) return;

          const sourceMatchIds = matches
            .filter(match => match.seasonId === season.id && (match.teamAScore > 0 || match.teamBScore > 0))
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime() || (a.matchNumber ?? 0) - (b.matchNumber ?? 0) || a.id.localeCompare(b.id))
            .map(match => match.id);

          if (!sourceMatchIds.length) continue;

          const draftSnapshot = await getDoc(doc(firestore, 'previa_drafts', season.id));
          const currentDraft = draftSnapshot.exists() ? draftSnapshot.data() as PreviaDraft : null;
          const currentIds = currentDraft?.sourceMatchIds ?? [];
          const isCurrentEngine = currentDraft?.generationVersion === PREVIA_GENERATION_VERSION;

          if (isCurrentEngine && sameIds(sourceMatchIds, currentIds)) continue;

          await regenerateAndPublishPrevia(firestore, players, matches, season);
        }
      } catch (error) {
        // La Previa is an enhancement: a publishing failure must never break
        // the rest of Real Acade or the match-loading flow.
        console.error('No se pudo actualizar La Previa automáticamente.', error);
      } finally {
        runningRef.current = false;
      }
    }

    void syncPrevia();
    return () => { active = false; };
  }, [firestore, canPublish, seasonsLoading, seasons, matches]);

  return null;
}
