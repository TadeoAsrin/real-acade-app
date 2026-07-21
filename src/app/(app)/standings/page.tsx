'use client';

import * as React from 'react';
import { useFirestore, useCollection, useMemoFirebase, useDoc } from '@/firebase';
import { collection, query, orderBy, where, doc } from 'firebase/firestore';
import { calculateAggregatedStats } from '@/lib/data';
import type { Player, Match, AppSettings } from '@/lib/definitions';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { getInitials, cn } from '@/lib/utils';
import { Trophy, Medal, Star, Target, Info, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function StandingsPage() {
  const firestore = useFirestore();

  const settingsRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, 'app_settings', 'global');
  }, [firestore]);

  const { data: settings, isLoading: settingsLoading } = useDoc<AppSettings>(settingsRef);
  const activeSeasonId = settings?.activeSeasonId;

  const playersRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'players'), orderBy('name', 'asc'));
  }, [firestore]);

  const matchesRef = useMemoFirebase(() => {
    if (!firestore || !activeSeasonId) return null;
    return query(
      collection(firestore, 'matches'), 
      where('seasonId', '==', activeSeasonId),
      orderBy('date', 'desc')
    );
  }, [firestore, activeSeasonId]);

  const { data: players, isLoading: playersLoading } = useCollection<Player>(playersRef);
  const { data: matches, isLoading: matchesLoading } = useCollection<Match>(matchesRef);

  const stats = React.useMemo(() => {
    if (!players || !matches) return [];
    return calculateAggregatedStats(players, matches)
      .sort((a, b) => b.efficiency - a.efficiency || b.powerPoints - a.powerPoints);
  }, [players, matches]);

  const isLoading = settingsLoading || playersLoading || matchesLoading;

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="font-bebas text-xl tracking-widest text-muted-foreground uppercase">Procesando Clasificación...</p>
      </div>
    );
  }

  if (!activeSeasonId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6">
        <Info className="h-12 w-12 text-muted-foreground/20 mb-4" />
        <h2 className="text-2xl font-bebas tracking-widest text-white mb-2">Temporada No Inicializada</h2>
        <p className="text-muted-foreground text-sm max-w-md">
          El administrador debe inicializar la temporada actual para ver la clasificación.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-4 lg:p-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <h2 className="text-4xl lg:text-6xl font-black uppercase tracking-tighter italic text-white flex items-center gap-4">
            <Trophy className="h-8 w-8 lg:h-12 lg:w-12 text-yellow-500 shrink-0" />
            Clasificación Oficial
          </h2>
          <p className="text-[10px] lg:text-xs font-black uppercase tracking-[0.3em] text-primary/60 ml-1">
            Métricas de Élite • Temporada {activeSeasonId.substring(0, 8)}
          </p>
        </div>
      </div>

      <Card className="competition-card border-white/5 bg-black/20 shadow-2xl overflow-hidden">
        <Table>
          <TableHeader className="bg-white/5">
            <TableRow className="hover:bg-transparent border-white/10">
              <TableHead className="w-12 text-center font-black text-[10px] uppercase">Pos</TableHead>
              <TableHead className="font-black text-[10px] uppercase">Jugador</TableHead>
              <TableHead className="text-center font-black text-[10px] uppercase">PJ</TableHead>
              <TableHead className="text-center font-black text-[10px] uppercase">G</TableHead>
              <TableHead className="text-center font-black text-[10px] uppercase">E</TableHead>
              <TableHead className="text-center font-black text-[10px] uppercase">P</TableHead>
              <TableHead className="text-center font-black text-[10px] uppercase">Goles</TableHead>
              <TableHead className="text-center font-black text-[10px] uppercase text-primary">EFIC %</TableHead>
              <TableHead className="text-right font-black text-[10px] uppercase text-orange-500">POWER</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {stats.map((player, index) => {
              const isPodium = index < 3;
              const podiumClass = index === 0 ? "podium-1" : index === 1 ? "podium-2" : index === 2 ? "podium-3" : "";

              return (
                <TableRow key={player.playerId} className={cn("official-table-row group", podiumClass)}>
                  <TableCell className="text-center">
                    <span className={cn(
                      "font-bebas text-xl",
                      isPodium ? "text-white" : "text-muted-foreground/40"
                    )}>
                      {index + 1}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8 border border-white/10">
                        <AvatarFallback className="text-[10px] font-bold bg-zinc-900">{getInitials(player.name)}</AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <Link 
                          href={`/players/${player.playerId}`} 
                          className="font-bold text-sm hover:text-primary transition-colors uppercase tracking-tighter"
                        >
                          {player.name}
                        </Link>
                        <span className="text-[7px] font-black uppercase text-muted-foreground/40">{player.position || 'COMODÍN'}</span>
                      </div>
                      {index === 0 && <Medal className="h-3 w-3 text-yellow-500 ml-1" />}
                    </div>
                  </TableCell>
                  <TableCell className="text-center font-medium">{player.matchesPlayed}</TableCell>
                  <TableCell className="text-center text-emerald-500 font-bold">{player.wins}</TableCell>
                  <TableCell className="text-center text-zinc-500 font-bold">{player.draws}</TableCell>
                  <TableCell className="text-center text-accent font-bold">{player.losses}</TableCell>
                  <TableCell className="text-center font-bold">{player.totalGoals}</TableCell>
                  <TableCell className="text-center font-bebas text-lg text-primary">{player.efficiency}%</TableCell>
                  <TableCell className="text-right font-bebas text-2xl text-orange-500">{player.powerPoints}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
