'use client';

import * as React from 'react';
import { collection, doc, getDoc, query, where } from 'firebase/firestore';
import { useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { useSeason } from '@/context/season-context';
import type { Match, Player } from '@/lib/definitions';
import { auditColdForm } from '@/lib/previa/cold-form';

export function ColdFormAudit() {
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();
  const { selectedSeasonId, loading: seasonLoading } = useSeason();
  const [isAdmin, setIsAdmin] = React.useState(false);

  React.useEffect(() => {
    let active = true;
    async function checkAdmin() {
      if (!firestore || !user) {
        if (active) setIsAdmin(false);
        return;
      }
      if (user.email === 'tadeoasrin@gmail.com') {
        if (active) setIsAdmin(true);
        return;
      }
      try {
        const role = await getDoc(doc(firestore, 'roles_admin', user.uid));
        if (active) setIsAdmin(role.exists() && role.data().isAdmin === true);
      } catch {
        if (active) setIsAdmin(false);
      }
    }
    void checkAdmin();
    return () => { active = false; };
  }, [firestore, user]);

  const playersRef = useMemoFirebase(() => {
    if (!firestore || !isAdmin) return null;
    return query(collection(firestore, 'players'));
  }, [firestore, isAdmin]);

  const matchesRef = useMemoFirebase(() => {
    if (!firestore || !isAdmin || !selectedSeasonId) return null;
    return query(collection(firestore, 'matches'), where('seasonId', '==', selectedSeasonId));
  }, [firestore, isAdmin, selectedSeasonId]);

  const { data: players } = useCollection<Player>(playersRef);
  const { data: matches } = useCollection<Match>(matchesRef);

  const audit = React.useMemo(() => {
    if (!players || !matches || !selectedSeasonId) return [];
    return auditColdForm(players, matches, selectedSeasonId);
  }, [players, matches, selectedSeasonId]);

  const seasonMatches = React.useMemo(() => {
    if (!matches || !selectedSeasonId) return 0;
    return matches.filter(match => match.seasonId === selectedSeasonId && (match.teamAScore > 0 || match.teamBScore > 0)).length;
  }, [matches, selectedSeasonId]);

  if (isUserLoading || seasonLoading || !isAdmin || !selectedSeasonId || !players || !matches) return null;

  const minimumRequired = audit[0]?.minimumRequired ?? Math.max(3, Math.ceil(seasonMatches * 0.4));

  return (
    <section className="mt-4 overflow-hidden rounded-xl border border-sky-400/10 bg-sky-400/[0.025]">
      <div className="border-b border-white/[0.06] px-4 py-3">
        <p className="text-[9px] font-black uppercase tracking-[0.16em] text-sky-400">Auditoría temporal · Está fresco por acá</p>
        <p className="mt-1 text-xs text-slate-400">Solo administrador. Temporada completa: {seasonMatches} fechas disputadas · mínimo elegible {minimumRequired} PJ (40%, con piso de 3).</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] text-left text-xs">
          <thead className="bg-black/15 text-[9px] uppercase tracking-wider text-slate-500">
            <tr>
              <th className="px-4 py-2">Jugador</th>
              <th className="px-3 py-2 text-center">PJ</th>
              <th className="px-3 py-2 text-center">Mín.</th>
              <th className="px-3 py-2 text-center">V-E-D</th>
              <th className="px-3 py-2 text-center">PTS</th>
              <th className="px-3 py-2 text-center">PPG</th>
              <th className="px-3 py-2 text-center">% Derrotas</th>
              <th className="px-3 py-2 text-center">Racha P</th>
              <th className="px-3 py-2 text-center">ColdScore</th>
              <th className="px-4 py-2">Decisión</th>
            </tr>
          </thead>
          <tbody>
            {audit.map(entry => (
              <tr key={entry.playerId} className="border-t border-white/[0.05]">
                <td className="px-4 py-2.5 font-bold text-white">{entry.playerName}</td>
                <td className="px-3 py-2.5 text-center text-slate-300">{entry.appearances}</td>
                <td className="px-3 py-2.5 text-center text-slate-500">{entry.minimumRequired}</td>
                <td className="px-3 py-2.5 text-center text-slate-300">{entry.wins}-{entry.draws}-{entry.losses}</td>
                <td className="px-3 py-2.5 text-center font-bold text-slate-200">{entry.points}</td>
                <td className="px-3 py-2.5 text-center text-slate-300">{entry.pointsPerGame}</td>
                <td className="px-3 py-2.5 text-center text-slate-300">{entry.lossPercentage}%</td>
                <td className="px-3 py-2.5 text-center text-slate-300">{entry.losingStreak}</td>
                <td className="px-3 py-2.5 text-center font-bold text-sky-400">{entry.score}</td>
                <td className={`px-4 py-2.5 ${entry.eligible ? 'font-semibold text-sky-300' : 'text-slate-500'}`}>{entry.reason}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
