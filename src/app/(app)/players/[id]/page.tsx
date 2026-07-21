
'use client';

import * as React from 'react';
import { useFirestore, useDoc, useCollection, useMemoFirebase } from '@/firebase';
import { doc, collection, query, where, orderBy } from 'firebase/firestore';
import { useParams } from 'next/navigation';
import { calculateAggregatedStats } from '@/lib/data';
import type { Player, Match, AggregatedPlayerStats } from '@/lib/definitions';
import { PlayerPerformanceChart } from '@/components/players/player-performance-chart';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { getInitials, cn } from '@/lib/utils';
import { Trophy, Goal, Target, Star, Shield, TrendingUp, Loader2, Calendar } from 'lucide-react';

export default function PlayerProfilePage() {
  const { id } = useParams<{ id: string }>();
  const firestore = useFirestore();

  const playerRef = useMemoFirebase(() => {
    if (!firestore || !id) return null;
    return doc(firestore, 'players', id);
  }, [firestore, id]);

  const matchesRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'matches'), orderBy('date', 'desc'));
  }, [firestore]);

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

  if (playerLoading || matchesLoading) {
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
                <div className="absolute -bottom-2 -right-2 bg-orange-500 text-white font-bebas text-xl w-12 h-12 rounded-2xl flex items-center justify-center border-4 border-black/40">
                   {stats.powerPoints}
                </div>
              </div>
              <h2 className="text-2xl font-black uppercase tracking-tighter italic">{player.name}</h2>
              <p className="text-[10px] font-black uppercase tracking-widest text-primary mt-1">{player.position || 'COMODÍN'}</p>
              <div className="flex flex-wrap gap-2 justify-center mt-6">
                 {stats.totalMvp > 0 && <Badge className="bg-yellow-500 font-bold">{stats.totalMvp} MVP</Badge>}
                 {stats.wins > 5 && <Badge className="bg-primary font-bold">VETERANO</Badge>}
                 {stats.goalsPerMatch > 1 && <Badge className="bg-accent font-bold">GOLEADOR</Badge>}
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
           <PlayerPerformanceChart matchHistory={matchHistory} />

           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <Card className="competition-card">
                 <CardHeader>
                    <CardTitle className="text-lg font-bebas tracking-widest">RACHA RECIENTE</CardTitle>
                 </CardHeader>
                 <CardContent>
                    <div className="flex gap-2">
                       {stats.form.map((res, i) => (
                         <div key={i} className={cn(
                           "w-10 h-14 rounded-lg flex items-center justify-center font-bebas text-2xl border shadow-lg",
                           res === 'W' ? "bg-emerald-500/20 text-emerald-500 border-emerald-500/20" : 
                           res === 'D' ? "bg-zinc-500/20 text-zinc-500 border-zinc-500/20" : 
                           "bg-accent/20 text-accent border-accent/20"
                         )}>
                           {res}
                         </div>
                       ))}
                    </div>
                 </CardContent>
              </Card>

              <Card className="competition-card border-orange-500/20 bg-orange-500/5">
                 <CardHeader>
                    <CardTitle className="text-lg font-bebas tracking-widest text-orange-500">POWER RANKING INFO</CardTitle>
                 </CardHeader>
                 <CardContent>
                    <p className="text-xs text-muted-foreground leading-relaxed italic">
                      Actualmente ocupas el puesto de élite en el club con {stats.powerPoints} puntos de poder acumulados. Sigue participando para mejorar tu índice de influencia.
                    </p>
                 </CardContent>
              </Card>
           </div>
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
