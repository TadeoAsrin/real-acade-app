'use client';

import * as React from 'react';
import { useFirestore, useDoc, useCollection, useMemoFirebase } from '@/firebase';
import { doc, collection, query, orderBy, where } from 'firebase/firestore';
import { useParams } from 'next/navigation';
import { calculateAggregatedStats } from '@/lib/data';
import type { Player, Match } from '@/lib/definitions';
import { PlayerPerformanceChart } from '@/components/players/player-performance-chart';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { getInitials, cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';
import { useSeason } from '@/context/season-context';
import { SeasonSelector } from '@/components/layout/season-selector';

export default function PlayerProfilePage() {
  const { id } = useParams<{ id: string }>();
  const firestore = useFirestore();
  const { selectedSeasonId, loading: seasonLoading } = useSeason();

  const playerRef = useMemoFirebase(() => {
    if (!firestore || !id) return null;
    return doc(firestore, 'players', id);
  }, [firestore, id]);

  const matchesRef = useMemoFirebase(() => {
    if (!firestore || !selectedSeasonId) return null;
    return query(
      collection(firestore, 'matches'), 
      where('seasonId', '==', selectedSeasonId),
      orderBy('date', 'desc')
    );
  }, [firestore, selectedSeasonId]);

  const { data: player, isLoading: playerLoading } = useDoc<Player>(playerRef);
  const { data: matches, isLoading: matchesLoading } = useCollection<Match>(matchesRef);

  const stats = React.useMemo(() => {
    if (!player || !matches) return null;
    return calculateAggregatedStats([player], matches)[0];
  }, [player, matches]);

  const matchHistory = React.useMemo(() => {
    if (!player || !matches) return [];
    return matches
      .filter(m => [...m.teamAPlayers, ...m.teamBPlayers].some(s => s.playerId === player.id))
      .map(m => {
        const myStat = [...m.teamAPlayers, ...m.teamBPlayers].find(s => s.playerId === player.id);
        return { ...myStat!, matchId: m.id, date: m.date };
      });
  }, [player, matches]);

  if (playerLoading || matchesLoading || seasonLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="font-bebas text-xl tracking-widest text-muted-foreground uppercase">Escaneando métricas de élite...</p>
      </div>
    );
  }

  if (!player || !stats) return <div className="p-8 text-center text-muted-foreground">Jugador no encontrado</div>;

  return (
    <div className="space-y-8 p-4 lg:p-8 animate-in fade-in duration-700 max-w-7xl mx-auto">
      <div className="flex flex-col lg:flex-row gap-8 items-start">
        <div className="w-full lg:w-80 space-y-6">
           <Card className="competition-card border-white/5 bg-black/40 overflow-hidden text-center p-8">
              <div className="relative mx-auto w-32 h-32 mb-6">
                <Avatar className="h-full w-full border-4 border-primary shadow-[0_0_30px_rgba(59,130,246,0.2)]">
                  <AvatarImage src={player.avatar} alt={player.name} />
                  <AvatarFallback className="text-4xl font-bebas bg-surface-900">{getInitials(player.name)}</AvatarFallback>
                </Avatar>
              </div>
              <h2 className="text-2xl font-black uppercase tracking-tighter italic">{player.name}</h2>
              <p className="text-[10px] font-black uppercase tracking-widest text-primary mt-1">{player.position || 'COMODÍN'}</p>
              <div className="flex flex-wrap gap-2 justify-center mt-6">
                 {stats.totalMvp > 0 && <Badge className="bg-yellow-500 font-bold">{stats.totalMvp} MVP</Badge>}
                 {stats.wins > 5 && <Badge className="bg-primary font-bold">VETERANO</Badge>}
              </div>
           </Card>

           <div className="grid grid-cols-2 gap-4">
              <StatCard label="PJ" value={stats.matchesPlayed} sub="PARTIDOS" />
              <StatCard label="GOLES" value={stats.totalGoals} sub="TOTALES" />
              <StatCard label="WIN %" value={`${stats.winPercentage}%`} sub="EFECTIVIDAD" />
              <StatCard label="PROM" value={stats.goalsPerMatch} sub="POR PARTIDO" />
           </div>
        </div>

        <div className="flex-1 space-y-8">
           <div className="flex justify-end">
              <SeasonSelector className="w-full md:w-64" />
           </div>
           <PlayerPerformanceChart matchHistory={matchHistory} />
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, sub }: { label: string, value: any, sub: string }) {
  return (
    <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex flex-col items-center justify-center text-center">
       <span className="text-[8px] font-black uppercase text-muted-foreground tracking-widest">{label}</span>
       <span className="text-3xl font-bebas text-white mt-1 leading-none">{value}</span>
       <span className="text-[7px] font-bold text-primary/40 uppercase mt-1">{sub}</span>
    </div>
  );
}
