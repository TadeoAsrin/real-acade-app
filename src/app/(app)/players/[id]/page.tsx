
'use client';

import * as React from 'react';
import { useParams } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Trophy, History, TrendingUp, Loader2, MapPin, Target, Star, ChevronLeft, Calendar } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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

  const StatBox = ({ label, value, icon: Icon, color = "primary" }: { label: string, value: string | number, icon: any, color?: string }) => (
    <Card className="glass-card overflow-hidden group">
      <CardContent className="p-6 relative">
        <div className={cn("absolute -right-4 -bottom-4 opacity-5 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-12", `text-${color}`)}>
          <Icon className="h-24 w-24" />
        </div>
        <div className="space-y-1 relative z-10">
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">{label}</p>
          <div className="flex items-baseline gap-2">
            <span className={cn("text-4xl font-black italic tracking-tighter", `text-${color}`)}>{value}</span>
            <Icon className={cn("h-4 w-4 opacity-40", `text-${color}`)} />
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

      <div className="flex flex-col items-center gap-8 md:flex-row md:items-end">
        <div className="relative">
          <Avatar className="h-40 w-40 border-4 border-primary shadow-2xl shadow-primary/20">
            <AvatarFallback className="text-5xl bg-primary/10 text-primary font-black">
              {getInitials(player.name)}
            </AvatarFallback>
          </Avatar>
          <Badge className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-4 py-1 font-black uppercase italic tracking-tighter bg-primary shadow-lg">
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
                  ID: {id.slice(0, 8)}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 grid-cols-2 lg:grid-cols-4">
        <StatBox label="Partidos" value={playerStats.matchesPlayed} icon={History} color="primary" />
        <StatBox label="Goles" value={playerStats.totalGoals} icon={Target} color="accent" />
        <StatBox label="MVP" value={playerStats.totalMvp} icon={Star} color="yellow-500" />
        <StatBox label="Efectividad" value={`${playerStats.winPercentage}%`} icon={TrendingUp} color="emerald-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <PlayerPerformanceChart matchHistory={playerMatchHistory} />
          
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-xl font-black uppercase italic tracking-tighter">Historial de Combates</CardTitle>
              <CardDescription>Desempeño cronológico en la liga.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
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
                    <TableRow key={match.matchId} className="border-white/5 hover:bg-white/5 transition-colors">
                      <TableCell className="pl-6 font-bold text-sm">
                        {format(parseISO(match.date), "dd MMM yyyy", { locale: es })}
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
                        <Button variant="ghost" size="sm" asChild className="h-8 w-8 p-0 hover:text-primary">
                          <Link href={`/matches/${match.matchId}`}><ChevronRight className="h-4 w-4" /></Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-8">
          <Card className="glass-card border-primary/20 overflow-hidden">
            <CardHeader className="bg-primary/5 pb-4">
              <CardTitle className="text-xs font-black uppercase tracking-widest text-primary flex items-center gap-2">
                <Trophy className="h-3 w-3" /> Distribución de Puntos
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
              <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                <span className="font-black uppercase tracking-widest text-white">Total Power</span>
                <span className="text-2xl font-black italic text-primary">{playerStats.powerPoints}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card bg-gradient-to-br from-card/60 to-primary/5">
            <CardHeader>
              <CardTitle className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <Calendar className="h-3 w-3" /> Fidelidad
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center py-6">
              <span className="text-6xl font-black italic tracking-tighter text-white">
                {allMatches.length > 0 ? Math.round((playerStats.matchesPlayed / allMatches.length) * 100) : 0}%
              </span>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] mt-2">Asistencia Perfecta</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
