'use client';

import * as React from 'react';
import { useParams } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Trophy, History, TrendingUp, Loader2, MapPin, Target, Star, ChevronLeft, Calendar, ChevronRight, Zap, ShieldCheck, Crown } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { PlayerPerformanceChart } from "@/components/players/player-performance-chart";
import { Badge } from "@/components/ui/badge";
import { useDoc, useCollection, useMemoFirebase, useFirestore } from "@/firebase";
import { doc, collection, query, orderBy } from "firebase/firestore";
import { calculateAggregatedStats } from "@/lib/data";
import type { Player, Match, AggregatedPlayerStats } from "@/lib/definitions";
import { getInitials, cn } from "@/lib/utils";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";

export default function PlayerProfilePage() {
  const params = useParams();
  const id = params.id as string;
  const firestore = useFirestore();

  const playerRef = useMemoFirebase(() => {
    if (!firestore || !id) return null;
    return doc(firestore, 'players', id);
  }, [firestore, id]);

  const matchesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'matches'), orderBy('date', 'desc'));
  }, [firestore]);

  const playersQuery = useMemoFirebase(() => {
      if (!firestore) return null;
      return collection(firestore, 'players');
  }, [firestore]);

  const { data: player, isLoading: playerLoading } = useDoc<Player>(playerRef);
  const { data: matches, isLoading: matchesLoading } = useCollection<Match>(matchesQuery);
  const { data: allPlayers, isLoading: allPlayersLoading } = useCollection<Player>(playersQuery);

  if (playerLoading || matchesLoading || allPlayersLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!player) return <div className="text-center py-12 font-black uppercase opacity-20">Jugador no encontrado.</div>;

  const allMatches = matches || [];
  const statsList = calculateAggregatedStats(allPlayers || [], allMatches);
  const playerStats = statsList.find(s => s.playerId === id);

  if (!playerStats) return <div className="text-center py-12 italic opacity-20">Sin estadísticas disponibles aún.</div>;

  const playerMatchHistory = allMatches
    .filter(match => 
        match.teamAPlayers.some(p => p.playerId === id) || 
        match.teamBPlayers.some(p => p.playerId === id)
    )
    .map(match => {
        const teamA = match.teamAPlayers.find(p => p.playerId === id);
        const teamB = match.teamBPlayers.find(p => p.playerId === id);
        const stats = teamA || teamB;
        
        const teamAWon = match.teamAScore > match.teamBScore;
        const teamBWon = match.teamBScore > match.teamAScore;
        const draw = match.teamAScore === match.teamBScore;
        
        let result: 'W' | 'D' | 'L' = 'L';
        if (draw) result = 'D';
        else if ((teamA && teamAWon) || (teamB && teamBWon)) result = 'W';

        return {
            ...stats!,
            matchId: match.id,
            date: match.date,
            team: teamA ? 'Azul' : 'Rojo',
            result
        };
    });

  const StatBox = ({ label, value, icon: Icon, color = "primary", sub }: { label: string, value: string | number, icon: any, color?: string, sub?: string }) => (
    <Card className="competition-card group hover-lift">
      <CardContent className="p-6 relative">
        <div className={cn("absolute -right-4 -bottom-4 opacity-5 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-12", `text-${color}`)}>
          <Icon className="h-24 w-24" />
        </div>
        <div className="space-y-1 relative z-10">
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">{label}</p>
          <div className="flex items-baseline gap-2">
            <span className={cn("text-4xl font-black italic tracking-tighter", `text-${color}`)}>{value}</span>
            {sub && <span className="text-[10px] font-bold text-muted-foreground/40 uppercase">{sub}</span>}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-10 max-w-5xl mx-auto pb-20">
      <Link href="/players" className="flex items-center gap-2 text-xs font-black uppercase text-muted-foreground hover:text-primary transition-colors">
        <ChevronLeft className="h-3 w-3" /> Galería de Cracks
      </Link>

      <div className="flex flex-col items-center gap-8 md:flex-row md:items-end justify-between">
        <div className="flex flex-col items-center md:items-start gap-6 md:flex-row md:items-end">
          <div className="relative">
            <Avatar className="h-40 w-40 border-4 border-primary shadow-2xl shadow-primary/20">
              <AvatarFallback className="text-5xl bg-primary/10 text-primary font-black">
                {getInitials(player.name)}
              </AvatarFallback>
            </Avatar>
            <Badge className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-4 py-1 font-black uppercase italic tracking-tighter bg-primary shadow-lg ring-4 ring-background">
              {playerStats.powerPoints} PTS
            </Badge>
          </div>
          <div className="text-center md:text-left space-y-4">
            <div className="space-y-1">
              <h1 className="text-5xl font-black italic uppercase tracking-tighter leading-none">{player.name}</h1>
              <div className="flex items-center justify-center md:justify-start gap-3">
                {player.position && (
                    <div className="flex items-center gap-1.5 text-primary bg-primary/10 px-3 py-1 rounded-full border border-primary/20">
                        <MapPin className="h-3 w-3" />
                        <span className="text-[10px] font-black uppercase tracking-widest">{player.position}</span>
                    </div>
                )}
                <Badge variant="outline" className="px-3 py-1 uppercase tracking-widest text-[9px] font-black border-white/10">
                    MODO COMPETITIVO
                </Badge>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center md:items-end gap-2">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/40">Estado de Forma</p>
          <div className="flex items-center gap-1.5 bg-white/5 p-2 rounded-2xl border border-white/5">
            {playerStats.form.map((res, i) => (
              <div key={i} className={cn(
                "h-8 w-8 rounded-lg flex items-center justify-center text-[10px] font-black text-white transition-all hover:scale-110",
                res === 'W' ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]' : res === 'D' ? 'bg-orange-400' : 'bg-red-500 opacity-40'
              )}>
                {res}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-6 grid-cols-2 lg:grid-cols-4">
        <StatBox label="Partidos" value={playerStats.matchesPlayed} icon={History} color="primary" sub="PJ" />
        <StatBox label="Goles" value={playerStats.totalGoals} icon={Target} color="accent" sub="GF" />
        <StatBox label="Premios MVP" value={playerStats.totalMvp} icon={Star} color="yellow-500" sub="MVP" />
        <StatBox label="Capitanías" value={playerStats.totalCaptaincies} icon={ShieldCheck} color="emerald-500" sub="CAP" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <PlayerPerformanceChart matchHistory={playerMatchHistory} />
          
          <Card className="competition-card">
            <CardHeader>
              <CardTitle className="text-xl font-black uppercase italic tracking-tighter">Historial de Combates</CardTitle>
              <CardDescription>Desempeño cronológico en la liga.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/20 border-white/5">
                      <TableHead className="pl-6 text-[10px] font-black uppercase">Fecha</TableHead>
                      <TableHead className="text-center text-[10px] font-black uppercase">Equipo</TableHead>
                      <TableHead className="text-center text-[10px] font-black uppercase">Resultado</TableHead>
                      <TableHead className="text-center text-[10px] font-black uppercase">Goles</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {playerMatchHistory.map((match) => (
                      <TableRow key={match.matchId} className="official-table-row group">
                        <TableCell className="pl-6 font-bold text-sm">
                          <div className="flex flex-col">
                            <span>{format(parseISO(match.date), "dd MMM yyyy", { locale: es })}</span>
                            {match.isCaptain && (
                              <div className="flex items-center gap-1 text-emerald-500 text-[8px] font-black uppercase tracking-widest mt-0.5">
                                <ShieldCheck className="h-2.5 w-2.5" /> Brazalete de Capitán
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline" className={cn(
                            "font-black text-[9px] uppercase",
                            match.team === 'Azul' ? 'border-primary text-primary bg-primary/5' : 'border-accent text-accent bg-accent/5'
                          )}>
                              {match.team}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className={cn(
                            "h-6 w-6 rounded-full mx-auto flex items-center justify-center text-[10px] font-black text-white",
                            match.result === 'W' ? 'bg-emerald-500' : match.result === 'D' ? 'bg-orange-400' : 'bg-red-500'
                          )}>
                            {match.result}
                          </div>
                        </TableCell>
                        <TableCell className="text-center font-black italic text-lg">{match.goals}</TableCell>
                        <TableCell className="text-right pr-6">
                          <Button variant="ghost" size="sm" asChild className="h-8 w-8 p-0 group-hover:text-primary transition-colors">
                            <Link href={`/matches/${match.matchId}`}><ChevronRight className="h-4 w-4" /></Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-8">
          <Card className="competition-card border-t-4 border-t-emerald-500 bg-emerald-500/5">
            <CardHeader className="bg-emerald-500/10 pb-4">
              <CardTitle className="text-xs font-black uppercase tracking-widest text-emerald-500 flex items-center gap-2">
                <Crown className="h-3 w-3" /> Récord de Mando
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-emerald-500/10 p-2 rounded-lg">
                  <p className="text-[8px] font-black uppercase text-emerald-500/60 mb-1">V</p>
                  <p className="text-xl font-bebas text-emerald-500">{playerStats.winsAsCaptain}</p>
                </div>
                <div className="bg-orange-500/10 p-2 rounded-lg">
                  <p className="text-[8px] font-black uppercase text-orange-500/60 mb-1">E</p>
                  <p className="text-xl font-bebas text-orange-500">{playerStats.drawsAsCaptain}</p>
                </div>
                <div className="bg-red-500/10 p-2 rounded-lg">
                  <p className="text-[8px] font-black uppercase text-red-500/60 mb-1">D</p>
                  <p className="text-xl font-bebas text-red-500">{playerStats.lossesAsCaptain}</p>
                </div>
              </div>
              <div className="pt-4 border-t border-white/5 space-y-2">
                <div className="flex items-center justify-between text-[10px] font-bold uppercase text-muted-foreground/60">
                  <span>Estado de Turno:</span>
                  {playerStats.totalCaptaincies === 0 ? (
                    <span className="text-emerald-500">Debut Pendiente</span>
                  ) : (
                    <span>Último mando: {format(parseISO(playerStats.lastCaptainDate!), "dd/MM", { locale: es })}</span>
                  )}
                </div>
                <div className="flex items-center justify-between text-[10px] font-black uppercase text-white">
                  <span>Partidos en deuda:</span>
                  <span className="text-lg font-bebas italic text-emerald-500">{playerStats.matchesSinceLastCaptain}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="competition-card border-t-4 border-t-primary bg-primary/5">
            <CardHeader className="bg-primary/10 pb-4">
              <CardTitle className="text-xs font-black uppercase tracking-widest text-primary flex items-center gap-2">
                <Trophy className="h-3 w-3" /> Distribución de Power
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground font-bold uppercase tracking-tighter">Por Victorias</span>
                <span className="font-black text-emerald-500">+{playerStats.wins * 10}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground font-bold uppercase tracking-tighter">Por Empates</span>
                <span className="font-black text-orange-400">+{playerStats.draws * 5}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground font-bold uppercase tracking-tighter">Por Goles</span>
                <span className="font-black text-accent">+{playerStats.totalGoals * 2}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground font-bold uppercase tracking-tighter">Por MVP / Goles VIP</span>
                <span className="font-black text-yellow-500">+{playerStats.totalMvp * 15 + playerStats.totalBestGoals * 5}</span>
              </div>
              <div className="pt-4 border-t border-white/10 flex items-center justify-between">
                <span className="font-black uppercase tracking-widest text-white">Total Acumulado</span>
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-primary fill-primary" />
                  <span className="text-3xl font-black italic text-primary">{playerStats.powerPoints}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
