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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getInitials, cn } from '@/lib/utils';
import { 
  ShieldCheck, 
  Crown, 
  Loader2, 
  ChevronRight,
  History,
  CalendarDays,
  Info
} from 'lucide-react';
import Link from 'next/link';
import { useSeason } from '@/context/season-context';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function HierarchyPage() {
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
  const { data: matches, isLoading: matchesLoading } = useCollection<Match>(matchesRef);

  const stats = React.useMemo(() => {
    if (!players || !matches) return [];
    
    // Solo consideramos jugadores activos (mínimo 1 PJ en la temporada actual)
    let processed = calculateAggregatedStats(players, matches)
      .filter(p => p.matchesPlayed > 0)
      .sort((a, b) => b.captaincyPriorityScore - a.captaincyPriorityScore || b.matchesPlayed - a.matchesPlayed);

    return processed;
  }, [players, matches]);

  const candidates = stats.slice(0, 3);
  const others = stats.slice(3);

  if (seasonLoading || playersLoading || matchesLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="font-bebas text-xl tracking-widest text-muted-foreground uppercase">Consultando Escalafón de Mando...</p>
      </div>
    );
  }

  return (
    <div className="space-y-12 p-4 lg:p-8 animate-in fade-in duration-700 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <h2 className="text-4xl lg:text-7xl font-black uppercase tracking-tighter italic text-white flex items-center gap-4">
            <ShieldCheck className="h-8 w-8 lg:h-14 lg:w-14 text-emerald-500 shrink-0" />
            ORDEN DE MANDO
          </h2>
          <p className="text-[10px] lg:text-xs font-black uppercase tracking-[0.4em] text-primary/60 ml-1">
            JERARQUÍA Y LIDERAZGO • REAL ACADE
          </p>
        </div>
      </div>

      {/* 1. TOP CANDIDATES SECTION */}
      <section className="space-y-6">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-sm font-black uppercase tracking-[0.3em] text-emerald-500/60 flex items-center gap-2">
            <Crown className="h-4 w-4" /> SUGERENCIA DE CAPITANES
          </h3>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button className="text-muted-foreground/40 hover:text-primary transition-colors">
                  <Info className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent className="bg-zinc-900 border-white/10 text-[10px] p-4 max-w-xs space-y-2">
                <p className="font-black text-primary uppercase tracking-widest border-b border-white/10 pb-1">SISTEMA DE PRIORIDAD</p>
                <p>El orden se basa en el <strong>compromiso reciente</strong> (PJ últimos 5) y la <strong>equidad</strong> (menos capitanías ejercidas).</p>
                <div className="grid grid-cols-2 gap-x-2 gap-y-1 font-bold pt-1">
                  <span className="text-emerald-500">+ PJ Recientes</span>
                  <span className="text-red-500">- Capitanías</span>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {candidates.map((player, idx) => (
            <Card key={player.playerId} className={cn(
              "competition-card group relative overflow-hidden transition-all duration-500 hover:-translate-y-2",
              idx === 0 ? "border-emerald-500/40 bg-emerald-500/5 shadow-2xl shadow-emerald-500/5" : "border-white/5 bg-black/40"
            )}>
              <div className="absolute top-0 right-0 p-4 opacity-5">
                <ShieldCheck className="h-24 w-24" />
              </div>
              <CardContent className="p-8 text-center space-y-6 relative z-10">
                <div className="relative mx-auto w-24 h-24">
                  <Avatar className={cn(
                    "h-full w-full border-4 shadow-2xl",
                    idx === 0 ? "border-emerald-500" : "border-white/10"
                  )}>
                    <AvatarImage src={player.avatar} />
                    <AvatarFallback className="bg-zinc-900 text-3xl font-bebas">{getInitials(player.name)}</AvatarFallback>
                  </Avatar>
                  <div className={cn(
                    "absolute -top-2 -right-2 h-10 w-10 rounded-full flex items-center justify-center border-2 border-black shadow-xl",
                    idx === 0 ? "bg-emerald-500 text-white" : "bg-zinc-800 text-white/40"
                  )}>
                    <span className="font-bebas text-xl">#{idx + 1}</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <h4 className="text-2xl font-black uppercase italic tracking-tighter text-white">{player.name}</h4>
                  <p className="text-[10px] font-black uppercase text-muted-foreground/40 tracking-widest">{player.position || 'COMODÍN'}</p>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-4 border-t border-white/5">
                  <div className="flex flex-col">
                    <span className="text-2xl font-bebas text-white leading-none">{player.matchesSinceLastCaptain}</span>
                    <span className="text-[7px] font-black uppercase text-muted-foreground tracking-widest">PJ SIN BRAZALETE</span>
                  </div>
                  <div className="flex flex-col border-l border-white/5">
                    <span className="text-2xl font-bebas text-emerald-500 leading-none">{player.totalCaptaincies}</span>
                    <span className="text-[7px] font-black uppercase text-emerald-500/40 tracking-widest">CAPITANÍAS</span>
                  </div>
                </div>

                <Button asChild className="w-full bg-white text-black hover:bg-emerald-500 hover:text-white transition-all font-black uppercase italic text-xs h-10 mt-4">
                  <Link href={`/players/${player.playerId}`}>VER EXPEDIENTE</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
          {candidates.length === 0 && (
            <div className="col-span-full py-12 text-center opacity-20">
               <ShieldCheck className="h-12 w-12 mx-auto mb-4" />
               <p className="font-bebas text-xl uppercase tracking-widest">No hay candidatos activos</p>
            </div>
          )}
        </div>
      </section>

      {/* 2. FULL HIERARCHY TABLE */}
      <section className="space-y-6">
        <h3 className="text-sm font-black uppercase tracking-[0.3em] text-muted-foreground/40 px-1">ESCALAFÓN COMPLETO</h3>
        <Card className="competition-card border-white/5 bg-black/20 overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-white/5">
                <TableRow className="hover:bg-transparent border-white/10">
                  <TableHead className="w-16 text-center font-black text-[10px] uppercase">Rango</TableHead>
                  <TableHead className="min-w-[200px] font-black text-[10px] uppercase">Líder</TableHead>
                  <TableHead className="w-32 text-center font-black text-[10px] uppercase">Capitanías</TableHead>
                  <TableHead className="w-32 text-center font-black text-[10px] uppercase">PJ sin Brazalete</TableHead>
                  <TableHead className="w-40 text-center font-black text-[10px] uppercase">Última Vez</TableHead>
                  <TableHead className="w-32 text-center font-black text-[10px] uppercase">Balance Cap.</TableHead>
                  <TableHead className="w-32 text-right font-black text-[10px] uppercase">Prioridad</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats.map((player, index) => {
                  const isTop = index < 3;
                  const balance = `${player.winsAsCaptain}V-${player.drawsAsCaptain}E-${player.lossesAsCaptain}D`;
                  
                  return (
                    <TableRow key={player.playerId} className="official-table-row group h-20">
                      <TableCell className="text-center">
                        <span className={cn(
                          "font-bebas text-2xl",
                          isTop ? "text-emerald-500" : "text-muted-foreground/20"
                        )}>
                          #{index + 1}
                        </span>
                      </TableCell>
                      
                      <TableCell>
                        <Link href={`/players/${player.playerId}`} className="flex items-center gap-4 group/player">
                          <Avatar className="h-10 w-10 border-2 border-white/10 group-hover/player:border-primary transition-all">
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
                         <span className="font-bebas text-3xl text-white">
                           {player.totalCaptaincies}
                         </span>
                      </TableCell>

                      <TableCell className="text-center">
                         <span className={cn(
                           "font-bebas text-3xl",
                           player.matchesSinceLastCaptain > 3 ? "text-emerald-500" : "text-white/40"
                         )}>
                           {player.matchesSinceLastCaptain}
                         </span>
                      </TableCell>

                      <TableCell className="text-center">
                        <div className="flex flex-col items-center">
                           <CalendarDays className="h-3 w-3 text-muted-foreground/20 mb-1" />
                           <span className="text-[9px] font-black uppercase text-muted-foreground">
                             {player.lastCaptainDate ? new Date(player.lastCaptainDate).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }) : 'NUNCA'}
                           </span>
                        </div>
                      </TableCell>

                      <TableCell className="text-center">
                         <Badge variant="outline" className="font-oswald text-[9px] border-white/5 text-muted-foreground/60">
                           {balance}
                         </Badge>
                      </TableCell>

                      <TableCell className="text-right pr-6">
                         <div className="flex flex-col items-end">
                            <span className={cn(
                              "font-bebas text-4xl leading-none",
                              isTop ? "text-emerald-500 italic" : "text-white/10"
                            )}>
                              {player.captaincyPriorityScore}
                            </span>
                            <span className="text-[7px] font-black uppercase text-muted-foreground/20">PTS MÉRTIO</span>
                         </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </Card>
      </section>
      
      <div className="flex flex-col items-center gap-2 opacity-30 text-center">
         <History className="h-6 w-6" />
         <p className="text-[8px] font-black uppercase tracking-[0.4em]">Justicia • Equidad • Real Acade</p>
      </div>
    </div>
  );
}
