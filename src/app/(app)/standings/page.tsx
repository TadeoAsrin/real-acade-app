
'use client';

import * as React from 'react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { calculateAggregatedStats } from '@/lib/data';
import type { Player, Match, AggregatedPlayerStats } from '@/lib/definitions';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getInitials, cn } from '@/lib/utils';
import { 
  Trophy, 
  Medal, 
  Loader2, 
  Info, 
  ArrowUpDown, 
  TrendingUp, 
  TrendingDown, 
  Minus,
  Crown,
  ChevronRight
} from 'lucide-react';
import Link from 'next/link';
import { useSeason } from '@/context/season-context';
import { Button } from '@/components/ui/button';

type SortConfig = {
  key: keyof AggregatedPlayerStats | 'points';
  direction: 'asc' | 'desc';
};

export default function StandingsPage() {
  const firestore = useFirestore();
  const { selectedSeasonId, loading: seasonLoading } = useSeason();
  
  const [sortConfig, setSortConfig] = React.useState<SortConfig>({
    key: 'points',
    direction: 'desc'
  });

  const playersRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'players'));
  }, [firestore]);

  const matchesRef = useMemoFirebase(() => {
    if (!firestore || !selectedSeasonId) return null;
    return query(
      collection(firestore, 'matches'), 
      where('seasonId', '==', selectedSeasonId)
    );
  }, [firestore, selectedSeasonId]);

  const { data: players, isLoading: playersLoading } = useCollection<Player>(playersRef);
  const { data: matches, isLoading: matchesLoading } = useCollection<Match>(matchesRef);

  const stats = React.useMemo(() => {
    if (!players || !matches) return [];
    
    let processed = calculateAggregatedStats(players, matches);

    // Sorting Logic
    return processed.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      if (sortConfig.key === 'points') {
        aValue = (a.wins * 3) + a.draws;
        bValue = (b.wins * 3) + b.draws;
      } else {
        aValue = a[sortConfig.key as keyof AggregatedPlayerStats];
        bValue = b[sortConfig.key as keyof AggregatedPlayerStats];
      }

      // Tie-breaker logic (always points -> efficiency -> GD)
      if (aValue === bValue) {
        const aPts = (a.wins * 3) + a.draws;
        const bPts = (b.wins * 3) + b.draws;
        if (aPts !== bPts) return bPts - aPts;
        return b.efficiency - a.efficiency || b.goalDifference - a.goalDifference;
      }

      return sortConfig.direction === 'desc' ? bValue - aValue : aValue - bValue;
    });
  }, [players, matches, sortConfig]);

  const handleSort = (key: SortConfig['key']) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc'
    }));
  };

  const isLoading = seasonLoading || playersLoading || matchesLoading;

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="font-bebas text-xl tracking-widest text-muted-foreground uppercase">Procesando Clasificación...</p>
      </div>
    );
  }

  if (!selectedSeasonId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6">
        <Info className="h-12 w-12 text-muted-foreground/20 mb-4" />
        <h2 className="text-2xl font-bebas tracking-widest text-white mb-2">Temporada No Inicializada</h2>
        <p className="text-muted-foreground text-sm max-w-md">
          Selecciona una temporada para ver la clasificación oficial.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-4 lg:p-8 animate-in fade-in duration-700 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <h2 className="text-4xl lg:text-7xl font-black uppercase tracking-tighter italic text-white flex items-center gap-4">
            <Trophy className="h-8 w-8 lg:h-14 lg:w-14 text-yellow-500 shrink-0" />
            CLASIFICACIÓN
          </h2>
          <p className="text-[10px] lg:text-xs font-black uppercase tracking-[0.4em] text-primary/60 ml-1">
            MÉTRICAS DE ÉLITE • REAL ACADE
          </p>
        </div>
      </div>

      <Card className="competition-card border-white/5 bg-black/20 shadow-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-white/5">
              <TableRow className="hover:bg-transparent border-white/10">
                <TableHead className="w-16 text-center font-black text-[10px] uppercase">Pos</TableHead>
                <TableHead className="min-w-[200px] font-black text-[10px] uppercase">Leyenda del Club</TableHead>
                <TableHead className="w-24 text-center">
                  <SortButton label="PJ" active={sortConfig.key === 'matchesPlayed'} onClick={() => handleSort('matchesPlayed')} />
                </TableHead>
                <TableHead className="w-32 text-center">
                  <SortButton label="V - E - D" active={sortConfig.key === 'wins'} onClick={() => handleSort('wins')} />
                </TableHead>
                <TableHead className="w-24 text-center">
                  <SortButton label="GOLES" active={sortConfig.key === 'totalGoals'} onClick={() => handleSort('totalGoals')} />
                </TableHead>
                <TableHead className="w-24 text-center">
                  <SortButton label="EFIC %" active={sortConfig.key === 'efficiency'} onClick={() => handleSort('efficiency')} />
                </TableHead>
                <TableHead className="w-24 text-center font-black text-[10px] uppercase">Trend</TableHead>
                <TableHead className="w-32 text-right">
                  <SortButton label="PTS" active={sortConfig.key === 'points'} onClick={() => handleSort('points')} align="right" />
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stats.map((player, index) => {
                const isLeader = index === 0;
                const isPodium = index < 3;
                const leaguePoints = (player.wins * 3) + player.draws;
                
                return (
                  <TableRow key={player.playerId} className={cn(
                    "official-table-row group h-20",
                    isLeader && "bg-yellow-500/5 hover:bg-yellow-500/10 border-l-4 border-l-yellow-500",
                    index === 1 && "border-l-4 border-l-slate-400",
                    index === 2 && "border-l-4 border-l-orange-700"
                  )}>
                    <TableCell className="text-center">
                      <span className={cn(
                        "font-bebas text-2xl",
                        isPodium ? "text-white" : "text-muted-foreground/40"
                      )}>
                        #{index + 1}
                      </span>
                    </TableCell>
                    
                    <TableCell>
                      <Link href={`/players/${player.playerId}`} className="flex items-center gap-4 group/player">
                        <div className="relative">
                          <Avatar className={cn(
                            "h-12 w-12 border-2 transition-transform group-hover/player:scale-110",
                            isLeader ? "border-yellow-500" : "border-white/10"
                          )}>
                            <AvatarImage src={player.avatar} />
                            <AvatarFallback className="bg-zinc-900 font-bebas text-lg text-primary">
                              {getInitials(player.name)}
                            </AvatarFallback>
                          </Avatar>
                          {isLeader && (
                            <div className="absolute -top-2 -right-2 bg-yellow-500 text-black p-1 rounded-full shadow-lg">
                              <Crown className="h-3 w-3 fill-current" />
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="font-black text-sm uppercase tracking-tight text-white group-hover/player:text-primary transition-colors truncate">
                            {player.name}
                          </span>
                          <span className="text-[8px] font-black uppercase text-muted-foreground/40 tracking-widest">
                            {player.position || 'COMODÍN'}
                          </span>
                        </div>
                      </Link>
                    </TableCell>

                    <TableCell className="text-center font-bebas text-2xl text-white/60">
                      {player.matchesPlayed}
                    </TableCell>

                    <TableCell className="text-center">
                       <div className="flex items-center justify-center gap-1.5 font-bold text-xs">
                          <span className="text-emerald-500">{player.wins}</span>
                          <span className="text-white/20">/</span>
                          <span className="text-zinc-500">{player.draws}</span>
                          <span className="text-white/20">/</span>
                          <span className="text-accent">{player.losses}</span>
                       </div>
                    </TableCell>

                    <TableCell className="text-center">
                       <div className="flex flex-col items-center">
                          <span className="font-bebas text-2xl text-yellow-500">{player.totalGoals}</span>
                          {player.totalGoals > 0 && player.matchesPlayed > 0 && (
                            <span className="text-[8px] font-black text-white/20">{player.goalsPerMatch} G/PJ</span>
                          )}
                       </div>
                    </TableCell>

                    <TableCell className="text-center">
                      <span className="font-bebas text-2xl text-primary/80">
                        {player.efficiency}%
                      </span>
                    </TableCell>

                    <TableCell className="text-center">
                       <div className="flex items-center justify-center gap-1">
                          {player.form.slice(0, 5).map((res, i) => (
                            <FormDot key={i} result={res} />
                          ))}
                       </div>
                    </TableCell>

                    <TableCell className="text-right">
                       <div className="flex flex-col items-end pr-2">
                          <span className="font-bebas text-4xl text-primary italic leading-none">
                            {leaguePoints}
                          </span>
                          <span className="text-[8px] font-black text-primary/40 uppercase tracking-widest mt-1">PUNTOS</span>
                       </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </Card>
      
      <div className="flex items-center justify-center gap-8 py-4 opacity-40">
         <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-[8px] font-black uppercase tracking-widest">3 PTS</span>
         </div>
         <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-zinc-500" />
            <span className="text-[8px] font-black uppercase tracking-widest">1 PT</span>
         </div>
         <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-accent" />
            <span className="text-[8px] font-black uppercase tracking-widest">0 PTS</span>
         </div>
      </div>
    </div>
  );
}

function SortButton({ label, active, onClick, align = "center" }: { label: string, active: boolean, onClick: () => void, align?: "center" | "right" }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 font-black text-[10px] uppercase tracking-widest hover:text-white transition-colors group",
        align === "center" ? "mx-auto" : "ml-auto",
        active ? "text-primary" : "text-muted-foreground/60"
      )}
    >
      {label}
      <ArrowUpDown className={cn("h-3 w-3 transition-transform", active && "scale-110")} />
    </button>
  );
}

function FormDot({ result }: { result: 'W' | 'D' | 'L' }) {
  const colors = {
    W: "bg-emerald-500 text-emerald-950",
    D: "bg-zinc-500 text-zinc-950",
    L: "bg-accent text-accent-foreground"
  };

  const Icons = {
    W: TrendingUp,
    D: Minus,
    L: TrendingDown
  };

  const Icon = Icons[result];

  return (
    <div className={cn("h-5 w-5 rounded-md flex items-center justify-center shadow-sm", colors[result])}>
       <Icon className="h-3 w-3 stroke-[3]" />
    </div>
  );
}
