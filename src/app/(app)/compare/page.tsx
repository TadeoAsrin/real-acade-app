'use client';

import * as React from 'react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, where } from 'firebase/firestore';
import { calculateAggregatedStats } from '@/lib/data';
import type { Player, Match } from '@/lib/definitions';
import { Card, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowLeftRight, Loader2, Swords } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getInitials, cn } from '@/lib/utils';
import { useSeason } from '@/context/season-context';
import { SeasonSelector } from '@/components/layout/season-selector';

export default function ComparePage() {
  const firestore = useFirestore();
  const { selectedSeasonId, loading: seasonLoading } = useSeason();
  const [player1Id, setPlayer1Id] = React.useState<string>("");
  const [player2Id, setPlayer2Id] = React.useState<string>("");

  const playersRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'players'), orderBy('name', 'asc'));
  }, [firestore]);

  const matchesRef = useMemoFirebase(() => {
    if (!firestore || !selectedSeasonId) return null;
    return query(
      collection(firestore, 'matches'), 
      where('seasonId', '==', selectedSeasonId),
      orderBy('date', 'desc')
    );
  }, [firestore, selectedSeasonId]);

  const { data: players, isLoading: playersLoading } = useCollection<Player>(playersRef);
  const { data: matches, isLoading: matchesLoading } = useCollection<Match>(matchesRef);

  const stats = React.useMemo(() => {
    if (!players || !matches) return [];
    return calculateAggregatedStats(players, matches);
  }, [players, matches]);

  const p1 = stats.find(s => s.playerId === player1Id);
  const p2 = stats.find(s => s.playerId === player2Id);

  if (playersLoading || matchesLoading || seasonLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="font-bebas text-xl tracking-widest text-muted-foreground uppercase">Cargando modo duelo...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-4 lg:p-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <h2 className="text-4xl lg:text-7xl font-black uppercase tracking-tighter italic text-white flex items-center gap-4">
            <Swords className="h-8 w-8 lg:h-14 lg:w-14 text-primary shrink-0" />
            VERSUS MODE
          </h2>
          <p className="text-[10px] lg:text-xs font-black uppercase tracking-[0.4em] text-primary/60 ml-1">
            COMPARATIVA TÁCTICA DE ÉLITE
          </p>
        </div>
        <SeasonSelector className="w-full md:w-64" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
         <Card className="competition-card border-primary/20 bg-primary/5 p-4">
            <CardDescription className="text-[8px] font-black uppercase tracking-widest text-primary mb-2">JUGADOR A</CardDescription>
            <Select value={player1Id} onValueChange={setPlayer1Id}>
               <SelectTrigger className="h-14 font-bebas text-2xl tracking-widest bg-black/40">
                  <SelectValue placeholder="SELECCIONAR..." />
               </SelectTrigger>
               <SelectContent className="bg-surface-900 font-bebas tracking-widest">
                  {players?.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.name.toUpperCase()}</SelectItem>
                  ))}
               </SelectContent>
            </Select>
         </Card>
         <Card className="competition-card border-accent/20 bg-accent/5 p-4">
            <CardDescription className="text-[8px] font-black uppercase tracking-widest text-accent mb-2">JUGADOR B</CardDescription>
            <Select value={player2Id} onValueChange={setPlayer2Id}>
               <SelectTrigger className="h-14 font-bebas text-2xl tracking-widest bg-black/40">
                  <SelectValue placeholder="SELECCIONAR..." />
               </SelectTrigger>
               <SelectContent className="bg-surface-900 font-bebas tracking-widest">
                  {players?.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.name.toUpperCase()}</SelectItem>
                  ))}
               </SelectContent>
            </Select>
         </Card>
      </div>

      {p1 && p2 ? (
        <Card className="competition-card border-white/5 bg-black/20 shadow-2xl p-6 lg:p-12 space-y-12">
           <div className="flex items-center justify-between">
              <PlayerHead stats={p1} side="left" />
              <div className="flex flex-col items-center gap-2">
                 <div className="text-3xl font-light text-white/10 italic">VS</div>
                 <div className="h-12 w-[2px] bg-gradient-to-b from-primary via-white/10 to-accent" />
              </div>
              <PlayerHead stats={p2} side="right" />
           </div>
           <div className="space-y-10 max-w-3xl mx-auto">
              <ComparisonRow label="Goles Totales" val1={p1.totalGoals} val2={p2.totalGoals} />
              <ComparisonRow label="Partidos Jugados" val1={p1.matchesPlayed} val2={p2.matchesPlayed} />
              <ComparisonRow label="Win %" val1={p1.winPercentage} val2={p2.winPercentage} suffix="%" />
              <ComparisonRow label="Efectividad (Pts)" val1={p1.efficiency} val2={p2.efficiency} suffix="%" highlight />
           </div>
        </Card>
      ) : (
        <div className="py-20 text-center opacity-20 flex flex-col items-center gap-4">
           <ArrowLeftRight className="h-16 w-16" />
           <p className="font-bebas text-2xl tracking-widest uppercase">Selecciona dos leyendas para comparar sus métricas</p>
        </div>
      )}
    </div>
  );
}

function PlayerHead({ stats, side }: { stats: any, side: 'left' | 'right' }) {
  return (
    <div className={cn("flex items-center gap-6", side === 'right' && "flex-row-reverse")}>
       <Avatar className={cn("h-20 w-20 md:h-32 md:w-32 border-4", side === 'left' ? "border-primary" : "border-accent")}>
          <AvatarImage src={stats.avatar} alt={stats.name} />
          <AvatarFallback className="text-3xl font-bebas bg-surface-900">{getInitials(stats.name)}</AvatarFallback>
       </Avatar>
       <div className={cn("flex flex-col", side === 'right' && "items-end")}>
          <h3 className="text-xl md:text-3xl font-black uppercase tracking-tighter italic text-white">{stats.name.split(' ')[0]}</h3>
          <span className={cn("text-[10px] font-black uppercase tracking-widest mt-1", side === 'left' ? "text-primary" : "text-accent")}>{stats.position || 'COMODÍN'}</span>
       </div>
    </div>
  );
}

function ComparisonRow({ label, val1, val2, suffix = "", highlight = false }: { label: string, val1: number, val2: number, suffix?: string, highlight?: boolean }) {
  return (
    <div className="space-y-4">
       <div className="flex items-center justify-between">
          <span className={cn("text-2xl font-bebas leading-none", val1 >= val2 ? "text-primary scale-110" : "text-muted-foreground/40")}>{val1}{suffix}</span>
          <span className={cn("text-[9px] font-black uppercase tracking-[0.3em] font-oswald", highlight ? "text-orange-500" : "text-muted-foreground/40")}>{label}</span>
          <span className={cn("text-2xl font-bebas leading-none", val2 >= val1 ? "text-accent scale-110" : "text-muted-foreground/40")}>{val2}{suffix}</span>
       </div>
    </div>
  );
}
