'use client';

import * as React from 'react';
import { useFirestore, useDoc, useCollection, useMemoFirebase } from '@/firebase';
import { doc, collection, query, orderBy } from 'firebase/firestore';
import { useParams } from 'next/navigation';
import type { Match, Player } from '@/lib/definitions';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { MatchAiSummary } from '@/components/matches/match-ai-summary';
import { BestGoalVote } from '@/components/matches/best-goal-vote';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { getInitials } from '@/lib/utils';
import { Calendar, MapPin, Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function MatchDetailPage() {
  const { id } = useParams<{ id: string }>();
  const firestore = useFirestore();

  const matchRef = useMemoFirebase(() => {
    if (!firestore || !id) return null;
    return doc(firestore, 'matches', id);
  }, [firestore, id]);

  const playersRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'players'), orderBy('name', 'asc'));
  }, [firestore]);

  const { data: match, isLoading: matchLoading } = useDoc<Match>(matchRef);
  const { data: players, isLoading: playersLoading } = useCollection<Player>(playersRef);

  if (matchLoading || playersLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="font-bebas text-xl tracking-widest text-muted-foreground uppercase">Abriendo crónica oficial...</p>
      </div>
    );
  }

  if (!match) return <div className="p-8 text-center text-muted-foreground uppercase font-black">Partido no encontrado</div>;

  const matchDataForAi = {
    date: match.date,
    teamAScore: match.teamAScore,
    teamBScore: match.teamBScore,
    teamAPlayers: match.teamAPlayers.map(p => ({
      name: players?.find(pl => pl.id === p.playerId)?.name || 'N/A',
      goals: p.goals
    })),
    teamBPlayers: match.teamBPlayers.map(p => ({
      name: players?.find(pl => pl.id === p.playerId)?.name || 'N/A',
      goals: p.goals
    })),
    mvpName: players?.find(pl => pl.id === match.teamAPlayers.find(s => s.isMvp)?.playerId || match.teamBPlayers.find(s => s.isMvp)?.playerId)?.name,
  };

  const goalScorers = [
    ...match.teamAPlayers.filter(p => p.goals > 0),
    ...match.teamBPlayers.filter(p => p.goals > 0)
  ].map(s => {
    const p = players?.find(pl => pl.id === s.playerId);
    return { ...p!, goals: s.goals };
  });

  return (
    <div className="space-y-8 p-4 lg:p-8 animate-in fade-in duration-700 max-w-6xl mx-auto">
      <Link href="/matches" className="flex items-center gap-2 text-[10px] font-black uppercase text-muted-foreground hover:text-primary transition-colors tracking-widest">
        <ArrowLeft className="h-3 w-3" /> VOLVER AL HISTORIAL
      </Link>

      <Card className="competition-card overflow-hidden bg-black/40 border-white/5 shadow-2xl">
        <div className="p-8 md:p-12 flex flex-col items-center justify-center gap-8 bg-gradient-to-b from-primary/10 via-transparent to-accent/10">
          <div className="flex items-center gap-2 text-[10px] font-black uppercase text-muted-foreground tracking-[0.4em] bg-white/5 px-4 py-1.5 rounded-full">
            <Calendar className="h-3 w-3 text-primary" />
            {format(parseISO(match.date), "eeee, dd MMMM yyyy", { locale: es })}
          </div>
          
          <div className="flex items-center justify-center gap-12 md:gap-24">
            <div className="flex flex-col items-center gap-4">
               <div className="w-24 h-24 md:w-32 md:h-32 rounded-3xl bg-primary/20 border-2 border-primary flex items-center justify-center shadow-[0_0_50px_rgba(59,130,246,0.2)]">
                  <span className="text-6xl md:text-8xl font-bebas text-white">{match.teamAScore}</span>
               </div>
               <span className="text-xs font-black uppercase tracking-widest text-primary">TEAM AZUL</span>
            </div>

            <div className="text-2xl font-light text-muted-foreground/20 italic select-none">VS</div>

            <div className="flex flex-col items-center gap-4">
               <div className="w-24 h-24 md:w-32 md:h-32 rounded-3xl bg-accent/20 border-2 border-accent flex items-center justify-center shadow-[0_0_50px_rgba(244,63,94,0.2)]">
                  <span className="text-6xl md:text-8xl font-bebas text-white">{match.teamBScore}</span>
               </div>
               <span className="text-xs font-black uppercase tracking-widest text-accent">TEAM ROJO</span>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
           <MatchAiSummary matchId={match.id} matchData={matchDataForAi} />
           
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <Card className="competition-card border-primary/10">
                 <CardHeader className="bg-primary/5">
                    <CardTitle className="text-sm font-black uppercase text-primary tracking-widest">Goleadores Azul</CardTitle>
                 </CardHeader>
                 <CardContent className="p-4 space-y-3">
                    {match.teamAPlayers.filter(p => p.goals > 0).map(p => (
                      <div key={p.playerId} className="flex items-center justify-between p-2 rounded-lg bg-white/5 border border-white/5">
                        <div className="flex items-center gap-3">
                           <Avatar className="h-8 w-8">
                              <AvatarFallback className="text-[10px] bg-zinc-900">{getInitials(players?.find(pl => pl.id === p.playerId)?.name || 'U')}</AvatarFallback>
                           </Avatar>
                           <span className="font-bold text-xs uppercase">{players?.find(pl => pl.id === p.playerId)?.name}</span>
                        </div>
                        <span className="font-bebas text-xl text-primary">x{p.goals}</span>
                      </div>
                    ))}
                 </CardContent>
              </Card>

              <Card className="competition-card border-accent/10">
                 <CardHeader className="bg-accent/5">
                    <CardTitle className="text-sm font-black uppercase text-accent tracking-widest">Goleadores Rojo</CardTitle>
                 </CardHeader>
                 <CardContent className="p-4 space-y-3">
                    {match.teamBPlayers.filter(p => p.goals > 0).map(p => (
                      <div key={p.playerId} className="flex items-center justify-between p-2 rounded-lg bg-white/5 border border-white/5">
                        <div className="flex items-center gap-3">
                           <Avatar className="h-8 w-8">
                              <AvatarFallback className="text-[10px] bg-zinc-900">{getInitials(players?.find(pl => pl.id === p.playerId)?.name || 'U')}</AvatarFallback>
                           </Avatar>
                           <span className="font-bold text-xs uppercase">{players?.find(pl => pl.id === p.playerId)?.name}</span>
                        </div>
                        <span className="font-bebas text-xl text-accent">x{p.goals}</span>
                      </div>
                    ))}
                 </CardContent>
              </Card>
           </div>
        </div>

        <div className="space-y-8">
           <BestGoalVote matchId={match.id} scorers={goalScorers} />
           
           <Card className="competition-card">
              <CardHeader>
                 <CardTitle className="text-lg font-bebas tracking-widest">DATOS DE CAMPO</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                 <div className="flex items-center justify-between py-2">
                    <span className="text-[10px] font-black uppercase text-muted-foreground">UBICACIÓN</span>
                    <span className="text-xs font-bold text-white flex items-center gap-1.5 uppercase">
                       <MapPin className="h-3 w-3 text-primary" /> El Pinar Arena
                    </span>
                 </div>
              </CardContent>
           </Card>
        </div>
      </div>
    </div>
  );
}
