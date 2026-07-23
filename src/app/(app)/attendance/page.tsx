
'use client';

import * as React from 'react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { calculateAggregatedStats } from '@/lib/data';
import type { Player, Match } from '@/lib/definitions';
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
  Users, 
  Loader2, 
  CalendarCheck,
  ChevronRight,
  TrendingUp,
  Minus,
  TrendingDown
} from 'lucide-react';
import Link from 'next/link';
import { useSeason } from '@/context/season-context';
import { Badge } from '@/components/ui/badge';

export default function AttendancePage() {
  const firestore = useFirestore();
  const { selectedSeasonId, loading: seasonLoading } = useSeason();

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
  const { data: matchesRaw, isLoading: matchesLoading } = useCollection<Match>(matchesRef);

  const stats = React.useMemo(() => {
    if (!players || !matchesRaw) return [];
    
    // Sort matches to calculate total possible matches in season
    const playedMatches = matchesRaw.filter(m => m.teamAScore > 0 || m.teamBScore > 0);
    const totalSeasonMatches = playedMatches.length;

    let processed = calculateAggregatedStats(players, matchesRaw);

    return processed
      .map(s => ({
        ...s,
        attendanceRate: totalSeasonMatches > 0 ? Math.round((s.matchesPlayed / totalSeasonMatches) * 100) : 0
      }))
      .sort((a, b) => b.matchesPlayed - a.matchesPlayed || a.name.localeCompare(b.name));
  }, [players, matchesRaw]);

  if (seasonLoading || playersLoading || matchesLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="font-bebas text-xl tracking-widest text-muted-foreground uppercase">Pasando lista oficial...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-4 lg:p-8 animate-in fade-in duration-700 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <h2 className="text-4xl lg:text-7xl font-black uppercase tracking-tighter italic text-white flex items-center gap-4">
            <CalendarCheck className="h-8 w-8 lg:h-14 lg:w-14 text-emerald-500 shrink-0" />
            CONTROL ASISTENCIA
          </h2>
          <p className="text-[10px] lg:text-xs font-black uppercase tracking-[0.4em] text-primary/60 ml-1">
            REGISTRO DE FIDELIDAD • REAL ACADE
          </p>
        </div>
      </div>

      <Card className="competition-card border-white/5 bg-black/20 shadow-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-white/5">
              <TableRow className="hover:bg-transparent border-white/10">
                <TableHead className="w-16 text-center font-black text-[10px] uppercase">Rango</TableHead>
                <TableHead className="min-w-[200px] font-black text-[10px] uppercase">Leyenda</TableHead>
                <TableHead className="w-32 text-center font-black text-[10px] uppercase">Partidos (PJ)</TableHead>
                <TableHead className="w-32 text-center font-black text-[10px] uppercase">% Asistencia</TableHead>
                <TableHead className="w-32 text-center font-black text-[10px] uppercase">Racha Presencia</TableHead>
                <TableHead className="w-32 text-right font-black text-[10px] uppercase"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stats.map((player, index) => {
                const isPerfect = player.attendanceRate >= 100;
                
                return (
                  <TableRow key={player.playerId} className="official-table-row group h-20">
                    <TableCell className="text-center">
                      <span className={cn(
                        "font-bebas text-2xl",
                        index < 3 ? "text-white" : "text-muted-foreground/20"
                      )}>
                        #{index + 1}
                      </span>
                    </TableCell>
                    
                    <TableCell>
                      <Link href={`/players/${player.playerId}`} className="flex items-center gap-4 group/player">
                        <Avatar className="h-10 w-10 border-2 border-white/10 transition-transform group-hover/player:scale-110">
                          <AvatarImage src={player.avatar} />
                          <AvatarFallback className="bg-zinc-900 font-bebas text-sm text-primary">
                            {getInitials(player.name)}
                          </AvatarFallback>
                        </Avatar>
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

                    <TableCell className="text-center">
                       <span className="font-bebas text-4xl text-white">
                         {player.matchesPlayed}
                       </span>
                    </TableCell>

                    <TableCell className="text-center">
                       <div className="flex flex-col items-center">
                          <span className={cn(
                            "font-bebas text-2xl",
                            isPerfect ? "text-emerald-500" : "text-white/60"
                          )}>
                            {player.attendanceRate}%
                          </span>
                          {isPerfect && (
                            <Badge className="bg-emerald-500/10 text-emerald-500 border-none text-[7px] font-black px-1.5 py-0 h-3">PERFECTO</Badge>
                          )}
                       </div>
                    </TableCell>

                    <TableCell className="text-center">
                       <div className="flex items-center justify-center gap-1">
                          {player.form.slice(0, 5).map((res, i) => (
                            <div 
                              key={i} 
                              className={cn(
                                "h-2 w-2 rounded-full",
                                res === 'L' ? "bg-red-500/20" : "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"
                              )} 
                            />
                          ))}
                       </div>
                    </TableCell>

                    <TableCell className="text-right pr-6">
                       <Link href={`/players/${player.playerId}`}>
                         <ChevronRight className="h-5 w-5 text-muted-foreground/20 group-hover:text-primary transition-colors ml-auto" />
                       </Link>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </Card>
      
      <div className="flex flex-col items-center gap-2 opacity-30 text-center">
         <Users className="h-6 w-6" />
         <p className="text-[8px] font-black uppercase tracking-[0.4em]">Compromiso • Honor • Real Acade</p>
      </div>
    </div>
  );
}

