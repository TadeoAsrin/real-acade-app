'use client';

import * as React from 'react';
import { calculateAggregatedStats, getTopChemistry, getSpiciestMatch } from "@/lib/data";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Medal, Loader2, Zap, Calendar, Users, Brain, Heart, Crown, Link as LinkIcon, Flame, Target, Trophy, TrendingUp, Star, Skull, Ghost, CloudRain, Frown, Droplets } from "lucide-react";
import Link from "next/link";
import { FieldView } from "@/components/dashboard/field-view";
import { PowerRanking } from "@/components/dashboard/power-ranking";
import { useCollection, useMemoFirebase, useFirestore } from "@/firebase";
import { collection, query, orderBy } from "firebase/firestore";
import type { Match, Player } from "@/lib/definitions";
import { getInitials, cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";

export default function DashboardPage() {
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

  if (playersLoading || matchesLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  const allPlayers = playersData || [];
  const allMatches = matchesData || [];
  const playerStats = calculateAggregatedStats(allPlayers, allMatches);
  const topChemistry = getTopChemistry(allPlayers, allMatches, 2);
  const spiciestMatch = getSpiciestMatch(allMatches);
  const lastMatch = allMatches[0];

  // Gloria Metrics
  const sortedByGoals = [...playerStats].sort((a, b) => b.totalGoals - a.totalGoals || b.goalsPerMatch - a.goalsPerMatch);
  const sortedByInfluence = [...playerStats]
    .filter(p => p.matchesPlayed >= 3)
    .sort((a, b) => {
      if (b.winPercentage !== a.winPercentage) return b.winPercentage - a.winPercentage;
      if (b.matchesPlayed !== a.matchesPlayed) return b.matchesPlayed - a.matchesPlayed;
      if (b.powerPoints !== a.powerPoints) return b.powerPoints - a.powerPoints;
      return b.totalGoals - a.totalGoals;
    });

  const topScorers = sortedByGoals.slice(0, 3);
  const topScorer = topScorers[0];
  const runnersUp = topScorers.slice(1);

  const topInfluencers = sortedByInfluence.slice(0, 3);
  const influencer = topInfluencers[0];
  const influencerRunnersUp = topInfluencers.slice(1);

  // Pulse Metrics
  const maxMvps = Math.max(...playerStats.map(p => p.totalMvp), 0);
  const mvpLeaders = maxMvps > 0 ? playerStats.filter(p => p.totalMvp === maxMvps) : [];
  const topMvpPlayer = mvpLeaders[0];

  const totalMatches = allMatches.length;
  const attendanceLeaders = playerStats.length > 0 && totalMatches > 0
    ? (() => {
        const leaders = [...playerStats].sort((a, b) => {
          const rateA = a.matchesPlayed / totalMatches;
          const rateB = b.matchesPlayed / totalMatches;
          return rateB - rateA || b.matchesPlayed - a.matchesPlayed;
        });
        const maxRate = (leaders[0]?.matchesPlayed || 0) / totalMatches;
        return leaders.filter(p => (p.matchesPlayed / totalMatches) === maxRate);
      })()
    : [];

  const attendanceRate = attendanceLeaders.length > 0 && totalMatches > 0 
    ? Math.round((attendanceLeaders[0].matchesPlayed / totalMatches) * 100) 
    : 0;

  // NOS CAEMOS A PEDAZOS (Humildad Metrics)
  const maxLosses = Math.max(...playerStats.map(p => p.losses), 0);
  const imanDeDerrotasLeaders = maxLosses > 0 ? playerStats.filter(p => p.losses === maxLosses) : [];

  const eligibleForRiesgo = playerStats.filter(p => p.matchesPlayed >= 3);
  const minWinRate = eligibleForRiesgo.length > 0 ? Math.min(...eligibleForRiesgo.map(p => p.winPercentage)) : 0;
  const factorDeRiesgoLeaders = eligibleForRiesgo.length > 0 ? eligibleForRiesgo.filter(p => p.winPercentage === minWinRate) : [];

  const eligibleForPolvora = playerStats.filter(p => p.matchesPlayed >= 3 && p.position !== 'Arquero');
  const minGoalsPerMatch = eligibleForPolvora.length > 0 ? Math.min(...eligibleForPolvora.map(p => p.goalsPerMatch)) : 0;
  const polvoraMojadaLeaders = eligibleForPolvora.length > 0 ? eligibleForPolvora.filter(p => p.goalsPerMatch === minGoalsPerMatch) : [];

  // Action Metrics
  const totalGoals = playerStats.reduce((sum, p) => sum + p.totalGoals, 0);
  const lastMatchTeamAPlayers = lastMatch?.teamAPlayers.map(s => allPlayers.find(p => p.id === s.playerId)).filter(Boolean) as Player[] || [];
  const lastMatchTeamBPlayers = lastMatch?.teamBPlayers.map(s => allPlayers.find(p => p.id === s.playerId)).filter(Boolean) as Player[] || [];

  return (
    <div className="flex flex-col gap-8 lg:gap-12 pb-20 max-w-7xl mx-auto">
      
      {/* SECCIÓN 1: EL OLIMPO (GLORIA INDIVIDUAL) */}
      <section className="space-y-4">
        <h2 className="text-sm font-black uppercase tracking-[0.3em] text-muted-foreground/50 px-1 italic">Nombres Propios de la Academia</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="md:col-span-2 lg:col-span-1 glass-card card-gold bg-gradient-to-br from-card/60 to-yellow-500/10 overflow-hidden relative flex flex-col h-full border-yellow-500/20">
            <div className="absolute top-0 right-0 p-6 opacity-10">
              <Medal className="h-32 w-32 text-yellow-500" />
            </div>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-black uppercase tracking-widest text-yellow-500 flex items-center gap-2">
                <Trophy className="h-3 w-3" /> Carrera por el Pichichi
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 flex-1 flex flex-col">
              <Link href={topScorer ? `/players/${topScorer.playerId}` : "/players"} className="group">
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16 border-4 border-yellow-500/30 group-hover:scale-105 transition-transform">
                    <AvatarFallback className="bg-yellow-500/10 text-yellow-500 text-2xl font-black">{getInitials(topScorer?.name || "?")}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <div className="text-3xl lg:text-4xl font-black tracking-tighter text-white uppercase leading-none group-hover:text-yellow-500 transition-colors truncate italic">
                      {topScorer?.name || '-'}
                    </div>
                    <p className="text-xs font-bold text-yellow-500/60 uppercase italic">Líder Actual</p>
                  </div>
                </div>
                <div className="mt-4 flex items-baseline gap-2">
                  <span className="text-5xl font-black text-yellow-500 italic leading-none">{topScorer?.totalGoals || 0}</span>
                  <span className="text-sm font-black text-yellow-500/50 uppercase tracking-widest">Goles Totales</span>
                </div>
              </Link>
              {runnersUp.length > 0 && (
                <div className="mt-auto pt-6 border-t border-yellow-500/10 space-y-3">
                  <p className="text-[9px] font-black uppercase tracking-[0.2em] text-yellow-500/40 italic">En la mira</p>
                  <div className="space-y-3">
                    {runnersUp.map((runner, idx) => (
                      <Link key={runner.playerId} href={`/players/${runner.playerId}`} className="flex items-center justify-between group/runner">
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] font-black text-yellow-500/30 italic">#{idx + 2}</span>
                          <Avatar className="h-8 w-8 border border-white/5">
                            <AvatarFallback className="text-[10px] font-black bg-muted">{getInitials(runner.name)}</AvatarFallback>
                          </Avatar>
                          <span className="text-sm font-bold text-muted-foreground group-hover/runner:text-white transition-colors">{runner.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-black italic text-white/80">{runner.totalGoals}</span>
                          <span className="text-[8px] font-bold text-yellow-500/40 uppercase">(-{topScorer.totalGoals - runner.totalGoals})</span>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="md:col-span-2 lg:col-span-1 glass-card border-primary/30 bg-gradient-to-br from-card/60 to-primary/10 overflow-hidden flex flex-col h-full relative group">
            <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform duration-500">
              <Brain className="h-32 w-32 text-primary" />
            </div>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-black uppercase tracking-widest text-primary flex items-center gap-2">
                <Crown className="h-3 w-3" /> Jugadores más Influyentes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 flex-1 flex flex-col">
              <Link href={influencer ? `/players/${influencer.playerId}` : "/players"} className="group/leader">
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16 border-4 border-primary/30 group-hover/leader:scale-105 transition-transform">
                    <AvatarFallback className="bg-primary/10 text-primary text-2xl font-black">{getInitials(influencer?.name || "?")}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <div className="text-3xl lg:text-4xl font-black tracking-tighter text-white uppercase leading-none group-hover:text-primary transition-colors truncate italic">
                      {influencer?.name || '-'}
                    </div>
                    <p className="text-xs font-bold text-primary/60 uppercase italic">Factor de Victoria</p>
                  </div>
                </div>
                <div className="mt-4 space-y-2">
                  <div className="flex items-baseline gap-2">
                    <span className="text-5xl font-black text-primary italic leading-none">{influencer?.winPercentage || 0}%</span>
                    <span className="text-xs font-black text-primary/50 uppercase tracking-widest">{influencer?.wins}V en {influencer?.matchesPlayed}PJ</span>
                  </div>
                  <Progress value={influencer?.winPercentage || 0} className="h-1.5 bg-primary/10" />
                </div>
              </Link>
              {influencerRunnersUp.length > 0 && (
                <div className="mt-auto pt-6 border-t border-primary/10 space-y-3">
                  <p className="text-[9px] font-black uppercase tracking-[0.2em] text-primary/40 italic">En la mira</p>
                  <div className="space-y-3">
                    {influencerRunnersUp.map((runner, idx) => (
                      <Link key={runner.playerId} href={`/players/${runner.playerId}`} className="flex items-center justify-between group/runner">
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] font-black text-primary/30 italic">#{idx + 2}</span>
                          <Avatar className="h-8 w-8 border border-white/5">
                            <AvatarFallback className="text-[10px] font-black bg-muted">{getInitials(runner.name)}</AvatarFallback>
                          </Avatar>
                          <span className="text-sm font-bold text-muted-foreground group-hover/runner:text-white transition-colors">{runner.name}</span>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-1.5 justify-end">
                            <span className="text-lg font-black italic text-white/80">{runner.winPercentage}%</span>
                            <TrendingUp className="h-3 w-3 text-primary/40" />
                          </div>
                          <p className="text-[8px] font-bold text-primary/40 uppercase leading-none">{runner.wins}V - {runner.matchesPlayed}PJ</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="lg:col-span-1">
            <PowerRanking players={allPlayers} matches={allMatches} />
          </div>
        </div>
      </section>

      {/* SECCIÓN 2: PULSO DE LA LIGA (SOCIAL BENTO) */}
      <section className="space-y-4">
        <div className="flex items-center gap-3 px-1">
          <Zap className="h-5 w-5 text-primary fill-primary" />
          <h2 className="text-sm font-black uppercase tracking-[0.3em] text-muted-foreground/50 italic">Pulso de la Liga</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Link href="/pulse/mvp">
                <Card className="glass-card border-yellow-500/20 hover:border-yellow-500/50 transition-all group overflow-hidden cursor-pointer h-full">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <Star className="h-24 w-24 text-yellow-500" />
                    </div>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-[10px] font-black uppercase tracking-widest text-yellow-500 flex items-center gap-2">
                            <Crown className="h-3 w-3" />
                            {mvpLeaders.length > 1 ? "Reyes de los MVP" : "Rey de los MVP"}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center gap-4">
                            <div className="flex -space-x-3 overflow-hidden">
                                {mvpLeaders.slice(0, 3).map((leader) => (
                                    <Avatar key={leader.playerId} className="h-12 w-12 border-2 border-background ring-2 ring-yellow-500/30 shrink-0">
                                        <AvatarFallback className="bg-yellow-500/10 text-yellow-500 font-black text-xs">{getInitials(leader.name)}</AvatarFallback>
                                    </Avatar>
                                ))}
                                {mvpLeaders.length === 0 && (
                                    <Avatar className="h-12 w-12 border-2 border-yellow-500/30">
                                        <AvatarFallback className="bg-yellow-500/10 text-yellow-500 font-black">??</AvatarFallback>
                                    </Avatar>
                                )}
                            </div>
                            <div className="flex flex-col min-w-0">
                                <span className="text-lg font-black tracking-tight leading-none group-hover:text-yellow-500 transition-colors truncate italic">
                                    {mvpLeaders.length > 1 
                                        ? `${mvpLeaders[0].name.split(' ')[0]} + ${mvpLeaders.length - 1}`
                                        : (topMvpPlayer?.name || '-')}
                                </span>
                                <span className="text-[10px] uppercase font-bold text-muted-foreground">Premios Oficiales</span>
                            </div>
                        </div>
                        <div className="text-3xl font-black italic text-white">{maxMvps}</div>
                    </CardContent>
                </Card>
            </Link>

            <Link href="/pulse/league">
                <Card className="glass-card border-orange-500/20 hover:border-orange-500/50 transition-all group overflow-hidden cursor-pointer h-full bg-gradient-to-br from-card/60 to-orange-500/5">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <Flame className="h-24 w-24 text-orange-500" />
                    </div>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-[10px] font-black uppercase tracking-widest text-orange-500 flex items-center gap-2">
                            <Flame className="h-3 w-3 fill-orange-500" />
                            Partido más picante
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex flex-col">
                            <span className="text-5xl font-black italic text-white leading-none">{spiciestMatch ? spiciestMatch.teamAScore + spiciestMatch.teamBScore : 0}</span>
                            <span className="text-[10px] uppercase font-black text-orange-500 tracking-widest">Goles Totales</span>
                        </div>
                        <div className="bg-white/5 p-2 rounded-xl border border-white/5 min-w-0">
                            <p className="text-[10px] font-bold text-white uppercase tracking-tighter truncate">
                                {spiciestMatch ? `Azul ${spiciestMatch.teamAScore} - ${spiciestMatch.teamBScore} Rojo` : 'Sin registros'}
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </Link>

            <Link href="/pulse/partnership">
                <Card className="glass-card border-white/10 hover:border-white/20 transition-all group overflow-hidden cursor-pointer h-full">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <Heart className="h-24 w-24 text-white" />
                    </div>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                            <LinkIcon className="h-3 w-3" />
                            Mejor Sociedad
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex -space-x-3 items-center min-w-0">
                            <Avatar className="h-10 w-10 border-2 border-background ring-2 ring-white/10 shrink-0">
                                <AvatarFallback className="bg-muted text-[10px] font-black">{getInitials(topChemistry?.player1.name || "?")}</AvatarFallback>
                            </Avatar>
                            <Avatar className="h-10 w-10 border-2 border-background ring-2 ring-white/10 shrink-0">
                                <AvatarFallback className="bg-muted text-[10px] font-black">{getInitials(topChemistry?.player2.name || "?")}</AvatarFallback>
                            </Avatar>
                            <div className="pl-6 flex flex-col min-w-0">
                                <span className="text-sm font-black truncate italic">{topChemistry ? `${topChemistry.player1.name.split(' ')[0]} + ${topChemistry.player2.name.split(' ')[0]}` : 'Sin datos'}</span>
                                <span className="text-[8px] uppercase text-muted-foreground font-bold">{topChemistry?.matches || 0} PJ</span>
                            </div>
                        </div>
                        <div className="pt-2">
                            <div className="flex justify-between text-[10px] font-black uppercase mb-1">
                                <span className="text-muted-foreground italic">Química</span>
                                <span className="text-primary italic">{topChemistry ? Math.round((topChemistry.wins / topChemistry.matches) * 100) : 0}%</span>
                            </div>
                            <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                                <div 
                                    className="h-full bg-primary transition-all duration-500" 
                                    style={{ width: `${topChemistry ? (topChemistry.wins / topChemistry.matches) * 100 : 0}%` }} 
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </Link>

            <Card className="glass-card border-emerald-500/20 bg-emerald-500/5 overflow-hidden h-full">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 pt-4">
                    <CardTitle className="text-[10px] font-black uppercase tracking-widest text-emerald-500">Los Infaltables</CardTitle>
                    <Users className="h-4 w-4 text-emerald-500" />
                </CardHeader>
                <CardContent className="px-4 pb-4 overflow-hidden">
                    <div className="flex flex-col gap-4 min-w-0">
                        <div className="flex flex-col">
                            <span className="text-5xl font-black tracking-tighter text-emerald-500 italic leading-none">{attendanceRate}%</span>
                            <span className="text-[10px] font-bold text-emerald-500/60 uppercase mt-1">Asistencia Global</span>
                        </div>
                        <div className="bg-white/5 p-2 rounded-xl border border-white/5 min-w-0">
                            <p className="text-[10px] font-bold text-white uppercase truncate">
                                {attendanceLeaders.length > 0 
                                ? (attendanceLeaders.length <= 3 
                                    ? attendanceLeaders.map(p => p.name.split(' ')[0]).join(', ')
                                    : `${attendanceLeaders[0].name.split(' ')[0]} + ${attendanceLeaders.length - 1} más`)
                                : 'Sin datos'}
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
      </section>

      {/* SECCIÓN 3: NOS CAEMOS A PEDAZOS (SALA DE HUMILDAD) */}
      <section className="space-y-4">
        <div className="flex items-center gap-3 px-1">
          <Frown className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-sm font-black uppercase tracking-[0.3em] text-muted-foreground/50 italic">Nos Caemos a Pedazos</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* El Imán de Derrotas */}
            <Link href="/pulse/iman-derrotas">
                <Card className="glass-card border-red-500/10 bg-red-500/5 relative overflow-hidden group hover:border-red-500/30 transition-all cursor-pointer h-full">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <CloudRain className="h-20 w-20 text-red-500" />
                    </div>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-[10px] font-black uppercase tracking-widest text-red-500 flex items-center gap-2">
                            <Skull className="h-3 w-3" /> 
                            {imanDeDerrotasLeaders.length > 1 ? "Imanes de Derrotas" : "El Imán de Derrotas"}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center gap-4">
                            <div className="flex -space-x-3 overflow-hidden">
                                {imanDeDerrotasLeaders.slice(0, 3).map(leader => (
                                    <Avatar key={leader.playerId} className="h-12 w-12 border-2 border-background ring-2 ring-red-500/20">
                                        <AvatarFallback className="bg-red-500/10 text-red-500 font-black">{getInitials(leader.name)}</AvatarFallback>
                                    </Avatar>
                                ))}
                            </div>
                            <div className="flex flex-col min-w-0">
                                <span className="text-lg font-black tracking-tight leading-none truncate italic text-white/80 group-hover:text-red-500 transition-colors">
                                    {imanDeDerrotasLeaders.length > 1 
                                        ? `${imanDeDerrotasLeaders[0].name.split(' ')[0]} + ${imanDeDerrotasLeaders.length - 1}`
                                        : (imanDeDerrotasLeaders[0]?.name || '-')}
                                </span>
                                <span className="text-[10px] uppercase font-bold text-muted-foreground">Más caídas registradas</span>
                            </div>
                        </div>
                        <div className="flex items-baseline gap-2">
                            <span className="text-4xl font-black italic text-red-500/80 leading-none">{maxLosses}</span>
                            <span className="text-[10px] font-black uppercase text-red-500/40 tracking-widest">Derrotas</span>
                        </div>
                    </CardContent>
                </Card>
            </Link>

            {/* Factor de Riesgo */}
            <Link href="/pulse/riesgo">
                <Card className="glass-card border-zinc-500/10 bg-zinc-500/5 relative overflow-hidden group hover:border-zinc-500/30 transition-all cursor-pointer h-full">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <Ghost className="h-20 w-20 text-zinc-500" />
                    </div>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-[10px] font-black uppercase tracking-widest text-zinc-500 flex items-center gap-2">
                            <TrendingUp className="h-3 w-3 rotate-180" /> 
                            {factorDeRiesgoLeaders.length > 1 ? "Factores de Riesgo" : "Factor de Riesgo"}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center gap-4">
                            <div className="flex -space-x-3 overflow-hidden">
                                {factorDeRiesgoLeaders.slice(0, 3).map(leader => (
                                    <Avatar key={leader.playerId} className="h-12 w-12 border-2 border-background ring-2 ring-zinc-500/20">
                                        <AvatarFallback className="bg-zinc-500/10 text-zinc-500 font-black">{getInitials(leader.name)}</AvatarFallback>
                                    </Avatar>
                                ))}
                            </div>
                            <div className="flex flex-col min-w-0">
                                <span className="text-lg font-black tracking-tight leading-none truncate italic text-white/80 group-hover:text-zinc-400 transition-colors">
                                    {factorDeRiesgoLeaders.length > 1 
                                        ? `${factorDeRiesgoLeaders[0].name.split(' ')[0]} + ${factorDeRiesgoLeaders.length - 1}`
                                        : (factorDeRiesgoLeaders[0]?.name || '-')}
                                </span>
                                <span className="text-[10px] uppercase font-bold text-muted-foreground">Efectividad mínima (+3 PJ)</span>
                            </div>
                        </div>
                        <div className="flex items-baseline gap-2">
                            <span className="text-4xl font-black italic text-zinc-500 leading-none">{minWinRate}%</span>
                            <span className="text-[10px] font-black uppercase text-zinc-500/40 tracking-widest">Victorias</span>
                        </div>
                    </CardContent>
                </Card>
            </Link>

            {/* Pólvora Mojada */}
            <Link href="/pulse/polvora">
                <Card className="glass-card border-blue-500/10 bg-blue-500/5 relative overflow-hidden group hover:border-blue-500/30 transition-all cursor-pointer h-full">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <Droplets className="h-20 w-20 text-blue-500" />
                    </div>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-[10px] font-black uppercase tracking-widest text-blue-500 flex items-center gap-2">
                            <Droplets className="h-3 w-3" /> 
                            {polvoraMojadaLeaders.length > 1 ? "Pólvoras Mojadas" : "Pólvora Mojada"}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center gap-4">
                            <div className="flex -space-x-3 overflow-hidden">
                                {polvoraMojadaLeaders.slice(0, 3).map(leader => (
                                    <Avatar key={leader.playerId} className="h-12 w-12 border-2 border-background ring-2 ring-blue-500/20">
                                        <AvatarFallback className="bg-blue-500/10 text-blue-500 font-black">{getInitials(leader.name)}</AvatarFallback>
                                    </Avatar>
                                ))}
                            </div>
                            <div className="flex flex-col min-w-0">
                                <span className="text-lg font-black tracking-tight leading-none truncate italic text-white/80 group-hover:text-blue-400 transition-colors">
                                    {polvoraMojadaLeaders.length > 1 
                                        ? `${polvoraMojadaLeaders[0].name.split(' ')[0]} + ${polvoraMojadaLeaders.length - 1}`
                                        : (polvoraMojadaLeaders[0]?.name || '-')}
                                </span>
                                <span className="text-[10px] uppercase font-bold text-muted-foreground">Menos goles/PJ (+3 PJ)</span>
                            </div>
                        </div>
                        <div className="flex items-baseline gap-2">
                            <span className="text-4xl font-black italic text-blue-500 leading-none">{minGoalsPerMatch}</span>
                            <span className="text-[10px] font-black uppercase text-blue-500/40 tracking-widest">Goles/PJ</span>
                        </div>
                    </CardContent>
                </Card>
            </Link>
        </div>
      </section>

      {/* SECCIÓN 4: MATCH CENTER (ACCIÓN Y TÁCTICA) */}
      <section className="space-y-6">
        <h2 className="text-sm font-black uppercase tracking-[0.3em] text-muted-foreground/50 px-1 italic">Historial</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link href="/matches">
            <Card className="glass-card hover:bg-white/5 transition-all border-white/5 overflow-hidden group">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 px-4">
                <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground group-hover:text-primary transition-colors">Partidos Totales</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <div className="text-4xl font-black tracking-tighter italic">{allMatches.length}</div>
                <p className="text-[10px] font-bold text-muted-foreground/60 uppercase mt-1">Historial del club</p>
              </CardContent>
            </Card>
          </Link>
          <Link href="/players?sort=totalGoals">
            <Card className="glass-card hover:bg-white/5 transition-all border-white/5 overflow-hidden group">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 px-4">
                <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground group-hover:text-primary transition-colors">Goles Marcados</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <div className="text-4xl font-black tracking-tighter italic">{totalGoals}</div>
                <p className="text-[10px] font-bold text-muted-foreground/60 uppercase mt-1">Producción colectiva</p>
              </CardContent>
            </Card>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FieldView team="Azul" players={lastMatchTeamAPlayers} topScorerId={topScorer?.playerId} date={lastMatch?.date} />
          <FieldView team="Rojo" players={lastMatchTeamBPlayers} topScorerId={topScorer?.playerId} date={lastMatch?.date} />
        </div>
      </section>
    </div>
  );
}
