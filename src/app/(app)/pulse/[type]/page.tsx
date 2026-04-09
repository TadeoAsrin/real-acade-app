'use client';

import * as React from 'react';
import { useParams } from "next/navigation";
import { calculateAggregatedStats, getChemistryRankings, getSpiciestMatch } from "@/lib/data";
import { useCollection, useMemoFirebase, useFirestore } from "@/firebase";
import { collection, query, orderBy } from "firebase/firestore";
import type { Match, Player, AggregatedPlayerStats, ChemistryPair } from "@/lib/definitions";
import { Card, CardContent } from "@/components/ui/card";
import { Brain, Link as LinkIcon, Star, Users, Flame, Skull, Ghost, Droplets, Loader2, ChevronLeft, Zap, TrendingUp, Info, ShieldAlert } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getInitials, cn } from "@/lib/utils";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

export default function PulseDetailPage() {
  const { type } = useParams();
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

  const renderRankingList = (
    title: string, 
    description: string, 
    icon: any, 
    sortedData: AggregatedPlayerStats[], 
    valueFn: (p: AggregatedPlayerStats) => string | number,
    labelFn: (p: AggregatedPlayerStats) => string,
    colorClass: string,
    requirementLabel?: string
  ) => (
    <div className="space-y-8 max-w-2xl mx-auto pb-20">
      <Link href="/dashboard" className="flex items-center gap-2 text-[10px] font-black uppercase text-muted-foreground hover:text-primary transition-colors mb-4 font-oswald tracking-widest">
        <ChevronLeft className="h-3 w-3" /> VOLVER AL PANEL
      </Link>
      
      <div className="text-center space-y-4">
          <div className={cn("mx-auto w-20 h-20 rounded-full flex items-center justify-center border", colorClass.replace('text-', 'bg-').replace('text-', 'border-') + '/20')}>
              {React.createElement(icon, { className: cn("h-10 w-10", colorClass) })}
          </div>
          <h1 className="text-4xl font-black italic uppercase tracking-tighter text-white">{title}</h1>
          <p className="text-muted-foreground italic text-sm">{description}</p>
          {requirementLabel && (
            <Badge variant="outline" className="mx-auto border-orange-500/20 text-orange-500 uppercase font-black text-[10px] py-1 px-4">
              REQUISITO: {requirementLabel}
            </Badge>
          )}
      </div>

      <div className="space-y-4">
          {sortedData.length > 0 ? sortedData.map((p, i) => (
              <Card key={p.playerId} className={cn("competition-card border-l-4 transition-all hover-lift", i === 0 ? "border-l-yellow-500 bg-yellow-500/5 shadow-[0_0_30px_rgba(234,179,8,0.1)]" : "border-l-primary/20")}>
                  <CardContent className="p-6 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                          <span className="text-2xl font-black italic text-muted-foreground/30 w-8">#{i + 1}</span>
                          <Avatar className="h-14 w-14 border-2 border-white/10">
                              <AvatarFallback className="bg-muted font-black text-lg">{getInitials(p.name)}</AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col">
                              <Link href={`/players/${p.playerId}`} className="font-black text-xl hover:underline italic uppercase tracking-tighter text-white">{p.name}</Link>
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">{p.matchesPlayed} PJ</span>
                                {p.isActive && <Badge variant="outline" className="h-3 text-[6px] border-emerald-500/30 text-emerald-500 uppercase">Activo</Badge>}
                              </div>
                          </div>
                      </div>
                      <div className="text-right">
                          <span className={cn("text-4xl font-black italic leading-none", colorClass)}>{valueFn(p)}</span>
                          <p className="text-[10px] uppercase font-black text-muted-foreground/40 mt-1">{labelFn(p)}</p>
                      </div>
                  </CardContent>
              </Card>
          )) : (
            <div className="h-60 flex flex-col items-center justify-center border-2 border-dashed rounded-3xl opacity-30 italic text-center px-10 gap-4">
              <Info className="h-10 w-10 text-muted-foreground" />
              <p className="text-sm">Aún no hay suficientes datos para generar este ranking de élite.</p>
            </div>
          )}
      </div>
    </div>
  );

  if (type === 'influencer') {
    const sorted = [...playerStats].filter(p => p.matchesPlayed >= 4).sort((a, b) => b.influenceScore - a.influenceScore);
    return renderRankingList("Cerebros del Campo", "Efectividad ponderada por victorias y regularidad (Fórmula: wins+2 / played+4).", Brain, sorted, (p) => `${p.winPercentage}%`, (p) => `${p.wins}V - ${p.draws}E - ${p.losses}D`, "text-primary", "MÍNIMO 4 PARTIDOS JUGADOS");
  }

  if (type === 'mvp') {
    const sorted = [...playerStats].filter(p => p.matchesPlayed > 0).sort((a, b) => b.totalMvp - a.totalMvp || b.powerPoints - a.powerPoints);
    return renderRankingList("Reyes del MVP", "El trono de los mejores del partido. Ranking acumulado de premios oficiales.", Star, sorted, (p) => p.totalMvp, () => "Premios", "text-yellow-500");
  }

  if (type === 'attendance') {
    const total = allMatches.filter(m => m.teamAScore > 0 || m.teamBScore > 0).length;
    const sorted = [...playerStats].filter(p => p.matchesPlayed > 0).sort((a, b) => b.matchesPlayed - a.matchesPlayed);
    return renderRankingList("Los Infaltables", "El compromiso no se negocia. Ranking de asistencia histórica al club.", Users, sorted, (p) => `${total > 0 ? Math.round((p.matchesPlayed / total) * 100) : 0}%`, () => "Asistencia", "text-emerald-500");
  }

  if (type === 'iman-derrotas') {
    const sorted = [...playerStats]
      .filter(p => p.matchesPlayed >= 2)
      .sort((a, b) => b.lossPercentage - a.lossPercentage || b.losses - a.losses);
    return renderRankingList("Ratio de Vulnerabilidad", "Récord adverso ponderado. Ranking de porcentaje de derrota en el club.", Skull, sorted, (p) => `${p.lossPercentage}%`, (p) => `${p.losses} DERROTAS EN ${p.matchesPlayed} PJ`, "text-red-500", "MÍNIMO 2 PARTIDOS JUGADOS");
  }

  if (type === 'deuda-mando') {
    const sorted = [...playerStats].filter(p => p.matchesPlayed >= 2 && p.totalCaptaincies === 0).sort((a, b) => b.matchesPlayed - a.matchesPlayed);
    return renderRankingList("Deuda de Mando", "Veteranos sin brazalete. Jugadores con muchas batallas que nunca han liderado.", ShieldAlert, sorted, (p) => p.matchesPlayed, () => "PJ SIN BRAZALETE", "text-orange-500", "MÍNIMO 2 PARTIDOS JUGADOS");
  }

  if (type === 'polvora') {
    const sorted = [...playerStats]
      .filter(p => (p.position === 'Mediocampista' || p.position === 'Delantero') && p.matchesPlayed >= 2)
      .sort((a, b) => a.goalsPerMatch - b.goalsPerMatch || a.totalGoals - b.totalGoals);
    return renderRankingList("Pólvora Mojada", "Sequía ofensiva en roles de ataque. Ranking de promedios de gol bajos.", Droplets, sorted, (p) => p.goalsPerMatch, (p) => `${p.totalGoals} GOLES EN ${p.matchesPlayed} PJ`, "text-blue-400", "MÍNIMO 2 PJ Y ROL OFENSIVO");
  }

  if (type === 'clutch') {
    const sorted = [...playerStats].filter(p => p.clutchWins > 0).sort((a, b) => b.clutchWins - a.clutchWins || b.winPercentage - a.winPercentage);
    return renderRankingList("Especialistas Clutch", "Expertos en ganar bajo presión. Jugadores con más victorias por diferencia de 1 gol.", Zap, sorted, (p) => p.clutchWins, () => "WINS AJUSTADOS", "text-purple-500");
  }

  if (type === 'partnership') {
    let pairs = getChemistryRankings(allPlayers, allMatches, 1);
    const topPairs = pairs.filter(p => p.winRate >= 50).slice(0, 15);

    return (
      <div className="space-y-8 max-w-2xl mx-auto pb-20">
        <Link href="/dashboard" className="flex items-center gap-2 text-[10px] font-black uppercase text-muted-foreground hover:text-primary transition-colors mb-4 font-oswald tracking-widest">
          <ChevronLeft className="h-3 w-3" /> VOLVER AL PANEL
        </Link>
        <div className="text-center space-y-4">
            <div className="mx-auto w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center border border-primary/20">
                <LinkIcon className="h-10 w-10 text-primary" />
            </div>
            <h1 className="text-4xl font-black italic uppercase tracking-tighter text-white">Sociedades de Élite</h1>
            <p className="text-muted-foreground italic text-sm">El Top 15 de química pura. Duplas activas con éxito superior al 50%.</p>
            <Badge variant="outline" className="mx-auto border-primary/20 text-primary uppercase font-black text-[10px] py-1 px-4">
              RANKING DE EXCLUSIVIDAD: TOP 15
            </Badge>
        </div>
        <div className="space-y-4">
            {topPairs.length > 0 ? topPairs.map((pair, i) => (
                <Card key={i} className={cn("competition-card transition-all hover-lift", i === 0 ? "border-l-4 border-l-primary bg-primary/5 shadow-[0_0_30px_rgba(37,99,235,0.1)]" : "border-l-4 border-l-transparent")}>
                    <CardContent className="p-6 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <span className="text-2xl font-black italic text-muted-foreground/30 w-8">#{i + 1}</span>
                            <div className="flex -space-x-4">
                                <Avatar className="h-12 w-12 border-2 border-background ring-2 ring-white/10">
                                    <AvatarFallback className="bg-muted font-black">{getInitials(pair.player1.name)}</AvatarFallback>
                                </Avatar>
                                <Avatar className="h-12 w-12 border-2 border-background ring-2 ring-white/10">
                                    <AvatarFallback className="bg-muted font-black">{getInitials(pair.player2.name)}</AvatarFallback>
                                </Avatar>
                            </div>
                            <div className="flex flex-col min-w-0">
                                <span className="font-black text-lg truncate italic uppercase tracking-tighter text-white">
                                  {pair.player1.name.split(' ')[0]} + {pair.player2.name.split(' ')[0]}
                                </span>
                                <div className="flex items-center gap-2">
                                  <span className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">{pair.wins}V en {pair.matches} PJ</span>
                                  {pair.matches === 1 && <Badge className="h-3 text-[6px] bg-primary/20 text-primary border-none uppercase font-black">Nueva Sociedad</Badge>}
                                </div>
                            </div>
                        </div>
                        <div className="text-right">
                            <span className={cn("text-3xl font-black italic leading-none", i === 0 ? "text-primary" : "text-white")}>{pair.winRate}%</span>
                            <p className="text-[8px] uppercase font-black text-muted-foreground/40 mt-1">Efectividad</p>
                        </div>
                    </CardContent>
                </Card>
            )) : (
              <div className="h-40 flex flex-col items-center justify-center border-2 border-dashed rounded-3xl opacity-30 italic px-10 text-center">
                <LinkIcon className="h-10 w-10 mb-2 opacity-50" />
                <p>No se han detectado sociedades activas con éxito demostrado.</p>
              </div>
            )}
        </div>
      </div>
    );
  }

  if (type === 'league') {
    const spiciest = getSpiciestMatch(allMatches);
    return (
      <div className="space-y-8 max-w-2xl mx-auto text-center pb-20">
        <Link href="/dashboard" className="flex items-center gap-2 text-[10px] font-black uppercase text-muted-foreground hover:text-primary transition-colors mb-4 font-oswald tracking-widest w-fit mx-auto">
          <ChevronLeft className="h-3 w-3" /> VOLVER AL PANEL
        </Link>
        <div className="space-y-4">
            <div className="mx-auto w-20 h-20 bg-orange-500/10 rounded-full flex items-center justify-center border border-orange-500/20">
                <Flame className="h-10 w-10 text-orange-500 fill-orange-500" />
            </div>
            <h1 className="text-4xl font-black italic uppercase tracking-tighter text-white">Partido más picante</h1>
            <p className="text-muted-foreground italic text-sm">El encuentro con mayor producción ofensiva registrado.</p>
        </div>
        {spiciest ? (
            <Card className="competition-card border-orange-500/30 bg-gradient-to-br from-orange-500/10 to-transparent p-10">
                <div className="flex flex-col items-center gap-6">
                    <span className="text-[10rem] font-black italic text-white leading-none drop-shadow-2xl">{spiciest.teamAScore + spiciest.teamBScore}</span>
                    <span className="text-sm font-black uppercase text-orange-500 tracking-[0.4em]">Goles Totales</span>
                    <div className="flex items-center gap-16 pt-8 border-t border-white/10 w-full justify-center">
                        <div className="flex flex-col items-center">
                            <span className="text-lg font-bebas text-primary tracking-widest">Azul: {spiciest.teamAScore}</span>
                        </div>
                        <div className="text-2xl font-light text-muted-foreground/30 italic">VS</div>
                        <div className="flex flex-col items-center">
                            <span className="text-lg font-bebas text-accent tracking-widest">Rojo: {spiciest.teamBScore}</span>
                        </div>
                    </div>
                    <Button asChild variant="outline" className="mt-8 border-white/10 hover:bg-white/5"><Link href={`/matches/${spiciest.id}`}>VER FICHA TÉCNICA</Link></Button>
                </div>
            </Card>
        ) : <p className="italic opacity-30 py-20">Sin partidos registrados aún.</p>}
      </div>
    );
  }

  return null;
}
