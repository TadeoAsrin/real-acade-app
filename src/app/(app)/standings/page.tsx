
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
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { getInitials, cn } from '@/lib/utils';
import { 
  Trophy, 
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

type SortConfig = {
  key: keyof AggregatedPlayerStats | 'points';
  direction: 'asc' | 'desc';
};

function StandingPlayerAvatar({ player, leader = false, mobile = false }: { player: AggregatedPlayerStats; leader?: boolean; mobile?: boolean }) {
  return (
    <Avatar className={cn(
      mobile ? 'h-11 w-11' : 'h-12 w-12',
      'border bg-zinc-950 shadow-inner transition-transform',
      leader ? 'border-yellow-500' : 'border-primary/45',
      !mobile && 'group-hover/player:scale-110'
    )}>
      <AvatarFallback className={cn(
        'bg-zinc-950 font-extrabold tabular-nums tracking-[-0.04em] text-primary flex items-center justify-center leading-none pt-[1px]',
        mobile ? 'text-lg' : 'text-xl'
      )}>
        {player.jerseyNumber ?? getInitials(player.name)}
      </AvatarFallback>
    </Avatar>
  );
}

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
    
    const processed = calculateAggregatedStats(players, matches);

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
    <div className="space-y-5 md:space-y-8 p-3 sm:p-4 lg:p-8 animate-in fade-in duration-700 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 md:gap-6">
        <div className="space-y-1">
          <h2 className="text-3xl sm:text-4xl lg:text-7xl font-black uppercase tracking-tighter italic text-white flex items-center gap-3 lg:gap-4">
            <Trophy className="h-7 w-7 sm:h-8 sm:w-8 lg:h-14 lg:w-14 text-yellow-500 shrink-0" />
            CLASIFICACIÓN
          </h2>
          <p className="text-[9px] lg:text-xs font-black uppercase tracking-[0.32em] lg:tracking-[0.4em] text-primary/60 ml-1">
            MÉTRICAS DE ÉLITE • REAL ACADE
          </p>
        </div>
      </div>

      <div className="md:hidden space-y-2">
        {stats.map((player, index) => {
          const isLeader = index === 0;
          const isPodium = index < 3;
          const leaguePoints = (player.wins * 3) + player.draws;

          return (
            <Link
              key={player.playerId}
              href={`/players/${player.playerId}`}
              className={cn(
                "relative grid grid-cols-[44px_52px_minmax(0,1fr)_58px] items-center gap-2 rounded-2xl border bg-[#111827] px-3 py-3.5 transition-colors active:bg-white/5",
                isLeader && "border-yellow-500/25 bg-yellow-500/[0.04]",
                index === 1 && "border-slate-400/15",
                index === 2 && "border-orange-700/20",
                index > 2 && "border-white/5"
              )}
            >
              <div className="flex items-center justify-center">
                <span className={cn(
                  "font-bebas text-2xl leading-none",
                  isPodium ? "text-white" : "text-muted-foreground/35"
                )}>
                  #{index + 1}
                </span>
              </div>

              <div className="relative">
                <StandingPlayerAvatar player={player} leader={isLeader} mobile />
                {isLeader && (
                  <div className="absolute -top-1.5 -right-1.5 bg-yellow-500 text-black p-0.5 rounded-full shadow-lg">
                    <Crown className="h-2.5 w-2.5 fill-current" />
                  </div>
                )}
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="font-black text-sm uppercase tracking-tight text-white truncate">
                    {player.name}
                  </span>
                  <ChevronRight className="h-3.5 w-3.5 shrink-0 text-white/20" />
                </div>
                <span className="block text-[8px] font-black uppercase text-muted-foreground/40 tracking-[0.14em] truncate">
                  {player.position || 'COMODÍN'}
                </span>
                <div className="mt-1.5 flex items-center gap-2 text-[9px] font-black uppercase tracking-wider">
                  <span className="text-white/55">{player.matchesPlayed} PJ</span>
                  <span className="h-1 w-1 rounded-full bg-white/15" />
                  <span className="text-primary/80">{player.efficiency}% EFIC</span>
                </div>
              </div>

              <div className="text-right">
                <span className="block font-bebas text-3xl italic leading-none text-primary">
                  {leaguePoints}
                </span>
                <span className="block mt-0.5 text-[7px] font-black uppercase tracking-[0.12em] text-primary/40">
                  PTS
                </span>
              </div>
            </Link>
          );
        })}
      </div>

      <Card className="hidden md:block competition-card border-white/5 bg-black/20 shadow-2xl overflow-hidden">
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
                          <StandingPlayerAvatar player={player} leader={isLeader} />
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
      
      <div className="hidden md:flex items-center justify-center gap-8 py-4 opacity-40">
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