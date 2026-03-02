'use client';

import * as React from 'react';
import { useParams, useRouter } from "next/navigation";
import { calculateAggregatedStats, getChemistryRankings, getSpiciestMatch } from "@/lib/data";
import { useCollection, useMemoFirebase, useFirestore } from "@/firebase";
import { collection, query, orderBy } from "firebase/firestore";
import type { Match, Player, AggregatedPlayerStats } from "@/lib/definitions";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Brain, Link as LinkIcon, Zap, Crown, Flame, Calendar, Star, Users, Target, Skull, Ghost, Droplets, Loader2, Trophy } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getInitials, cn } from "@/lib/utils";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

export default function PulseDetailPage() {
  const { type } = useParams();
  const router = useRouter();
  const firestore = useFirestore();

  const playersQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'players'), orderBy('name', 'asc'));
  }, [firestore]);

  const matchesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'matches'), orderBy('date', 'desc'));
  }, [firestore]);

  const { data: playersData, isLoading: playersLoading } = useCollection<Player>(playersQuery);
  const { data: matchesData, isLoading: matchesLoading } = useCollection<Match>(matchesQuery);

  const allPlayers = React.useMemo(() => playersData || [], [playersData]);
  const allMatches = React.useMemo(() => matchesData || [], [matchesData]);

  const playerStats = React.useMemo(() => {
    if (allPlayers.length === 0) return [];
    return calculateAggregatedStats(allPlayers, allMatches);
  }, [allPlayers, allMatches]);

  if (playersLoading || matchesLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="animate-spin text-primary h-12 w-12" />
      </div>
    );
  }

  // --- RENDERS DE RANKING ---

  const renderRankingList = (
    title: string, 
    description: string, 
    icon: any, 
    sortedData: AggregatedPlayerStats[], 
    valueFn: (p: AggregatedPlayerStats) => string | number,
    label: string,
    colorClass: string
  ) => (
    <div className="space-y-8 max-w-2xl mx-auto">
      <div className="text-center space-y-4">
          <div className={cn("mx-auto w-20 h-20 rounded-full flex items-center justify-center border", colorClass.replace('text-', 'bg-').replace('text-', 'border-') + '/20')}>
              {React.createElement(icon, { className: cn("h-10 w-10", colorClass) })}
          </div>
          <h1 className="text-4xl font-black italic uppercase tracking-tighter">{title}</h1>
          <p className="text-muted-foreground italic">{description}</p>
      </div>

      <div className="space-y-4">
          {sortedData.length > 0 ? sortedData.map((p, i) => (
              <Card key={p.playerId} className={cn("glass-card border-white/5 hover:border-white/20 transition-all", i < 3 && "border-primary/20 bg-primary/5")}>
                  <CardContent className="p-6 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                          <span className="text-2xl font-black italic text-muted-foreground/30 w-8">{i + 1}</span>
                          <Avatar className="h-14 w-14 border-2 border-white/10">
                              <AvatarFallback className="bg-muted font-black text-lg">{getInitials(p.name)}</AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col">
                              <Link href={`/players/${p.playerId}`} className="font-black text-xl hover:underline italic">{p.name}</Link>
                              <span className="text-[10px] font-bold uppercase text-muted-foreground">{p.matchesPlayed} Partidos Jugados</span>
                          </div>
                      </div>
                      <div className="text-right">
                          <span className={cn("text-4xl font-black italic", colorClass)}>{valueFn(p)}</span>
                          <p className="text-[10px] uppercase font-black text-muted-foreground leading-none">{label}</p>
                      </div>
                  </CardContent>
              </Card>
          )) : (
            <div className="h-40 flex flex-col items-center justify-center border-2 border-dashed rounded-3xl opacity-30 italic">
              Sin datos registrados.
            </div>
          )}
      </div>
    </div>
  );

  if (type === 'influencer') {
    const sorted = [...playerStats].sort((a, b) => b.winPercentage - a.winPercentage || b.matchesPlayed - a.matchesPlayed);
    return renderRankingList("Cerebros del Campo", "Ranking de efectividad pura. Los jugadores con mayor porcentaje de victoria.", Brain, sorted, (p) => `${p.winPercentage}%`, "Victorias", "text-primary");
  }

  if (type === 'mvp') {
    const sorted = [...playerStats].sort((a, b) => b.totalMvp - a.totalMvp || b.powerPoints - a.powerPoints);
    return renderRankingList("Reyes del MVP", "El trono de los mejores del partido. Ranking acumulado de premios oficiales.", Star, sorted, (p) => p.totalMvp, "Premios", "text-yellow-500");
  }

  if (type === 'attendance') {
    const total = allMatches.length;
    const sorted = [...playerStats].sort((a, b) => b.matchesPlayed - a.matchesPlayed || a.name.localeCompare(b.name));
    return renderRankingList("Los Infaltables", "El compromiso no se negocia. Ranking de asistencia a la academia.", Users, sorted, (p) => `${total > 0 ? Math.round((p.matchesPlayed / total) * 100) : 0}%`, "Asistencia", "text-emerald-500");
  }

  if (type === 'iman-derrotas') {
    const sorted = [...playerStats].sort((a, b) => b.losses - a.losses || b.matchesPlayed - a.matchesPlayed);
    return renderRankingList("Imán de Derrotas", "La mala racha no perdona. Jugadores con más caídas en el historial.", Skull, sorted, (p) => p.losses, "Derrotas", "text-red-500");
  }

  if (type === 'riesgo') {
    const sorted = [...playerStats].filter(p => p.matchesPlayed >= 1).sort((a, b) => a.winPercentage - b.winPercentage || a.matchesPlayed - b.matchesPlayed);
    return renderRankingList("Factor de Riesgo", "Menor porcentaje de victorias. Los que más sufren para sumar de a tres.", Ghost, sorted, (p) => `${p.winPercentage}%`, "Efectividad", "text-zinc-400");
  }

  if (type === 'polvora') {
    const sorted = [...playerStats]
      .filter(p => p.position === 'Mediocampista' || p.position === 'Delantero')
      .sort((a, b) => a.goalsPerMatch - b.goalsPerMatch || a.totalGoals - b.totalGoals);
    return renderRankingList("Pólvora Mojada", "Baja producción ofensiva en roles de ataque (Medios y Delanteros).", Droplets, sorted, (p) => p.goalsPerMatch, "Goles/PJ", "text-blue-400");
  }

  if (type === 'partnership') {
    const pairs = getChemistryRankings(allPlayers, allMatches, 1); // Bajamos umbral a 1 para que siempre haya datos
    return (
      <div className="space-y-8 max-w-2xl mx-auto">
        <div className="text-center space-y-4">
            <div className="mx-auto w-20 h-20 bg-white/10 rounded-full flex items-center justify-center">
                <LinkIcon className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-4xl font-black italic uppercase tracking-tighter">Sociedades de Élite</h1>
            <p className="text-muted-foreground italic">La química perfecta. Duplas de jugadores que dominan el campo cuando comparten equipo.</p>
        </div>
        <div className="space-y-4">
            {pairs.map((pair, i) => (
                <Card key={i} className={cn("glass-card transition-all", i === 0 ? "border-primary/50 bg-primary/5 scale-105" : "border-white/5")}>
                    <CardContent className="p-6 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <span className="text-2xl font-black italic text-muted-foreground/30 w-8">{i + 1}</span>
                            <div className="flex -space-x-4">
                                <Avatar className="h-12 w-12 border-2 border-background ring-2 ring-white/10">
                                    <AvatarFallback className="bg-muted font-black">{getInitials(pair.player1.name)}</AvatarFallback>
                                </Avatar>
                                <Avatar className="h-12 w-12 border-2 border-background ring-2 ring-white/10">
                                    <AvatarFallback className="bg-muted font-black">{getInitials(pair.player2.name)}</AvatarFallback>
                                </Avatar>
                            </div>
                            <div className="flex flex-col min-w-0">
                                <span className="font-black text-lg truncate italic">{pair.player1.name.split(' ')[0]} + {pair.player2.name.split(' ')[0]}</span>
                                <span className="text-[10px] font-bold uppercase text-muted-foreground">{pair.wins}V en {pair.matches} PJ</span>
                            </div>
                        </div>
                        <div className="text-right">
                            <span className={cn("text-3xl font-black italic", i === 0 ? "text-primary" : "text-white")}>{pair.winRate}%</span>
                            <p className="text-[8px] uppercase font-black text-muted-foreground leading-none">Efectividad</p>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
      </div>
    );
  }

  if (type === 'league') {
    const spiciest = getSpiciestMatch(allMatches);
    return (
      <div className="space-y-8 max-w-2xl mx-auto text-center">
        <div className="space-y-4">
            <div className="mx-auto w-20 h-20 bg-orange-500/10 rounded-full flex items-center justify-center">
                <Flame className="h-10 w-10 text-orange-500 fill-orange-500" />
            </div>
            <h1 className="text-4xl font-black italic uppercase tracking-tighter">Partido más picante</h1>
            <p className="text-muted-foreground italic">El encuentro con mayor producción ofensiva registrado en la historia.</p>
        </div>
        {spiciest ? (
            <Card className="glass-card border-orange-500/30 bg-gradient-to-br from-orange-500/10 to-transparent p-10">
                <div className="flex flex-col items-center gap-6">
                    <span className="text-8xl font-black italic text-white leading-none">{spiciest.teamAScore + spiciest.teamBScore}</span>
                    <span className="text-sm font-black uppercase text-orange-500 tracking-widest">Goles Totales</span>
                    <div className="flex items-center gap-16 pt-4 border-t border-white/10 w-full justify-center">
                        <div className="flex flex-col items-center">
                            <span className="text-xs font-black uppercase text-primary">Azul: {spiciest.teamAScore}</span>
                        </div>
                        <div className="text-2xl font-light text-muted-foreground/30 italic">VS</div>
                        <div className="flex flex-col items-center">
                            <span className="text-xs font-black uppercase text-accent">Rojo: {spiciest.teamBScore}</span>
                        </div>
                    </div>
                    <Button asChild variant="outline" className="mt-4"><Link href={`/matches/${spiciest.id}`}>Ver Ficha Técnica</Link></Button>
                </div>
            </Card>
        ) : <p className="italic opacity-30">Sin partidos registrados.</p>}
      </div>
    );
  }

  return null;
}
