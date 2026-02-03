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
import { Medal, Loader2, Zap, Calendar, Users, Brain, Heart, Crown, Link as LinkIcon, Flame, Target, Trophy } from "lucide-react";
import Link from "next/link";
import { FieldView } from "@/components/dashboard/field-view";
import { PowerRanking } from "@/components/dashboard/power-ranking";
import { useCollection, useMemoFirebase, useFirestore } from "@/firebase";
import { collection, query, orderBy } from "firebase/firestore";
import type { Match, Player } from "@/lib/definitions";
import { getInitials, cn } from "@/lib/utils";

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

  const sortedByGoals = [...playerStats].sort((a, b) => b.totalGoals - a.totalGoals || b.goalsPerMatch - a.goalsPerMatch);
  
  const sortedByInfluence = [...playerStats]
    .filter(p => p.matchesPlayed >= 3)
    .sort((a, b) => {
      if (b.winPercentage !== a.winPercentage) return b.winPercentage - a.winPercentage;
      if (b.matchesPlayed !== a.matchesPlayed) return b.matchesPlayed - a.matchesPlayed;
      if (b.powerPoints !== a.powerPoints) return b.powerPoints - a.powerPoints;
      return b.totalGoals - a.totalGoals;
    });

  const topScorer = sortedByGoals[0];
  const influencer = sortedByInfluence[0];

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

  const totalGoals = playerStats.reduce((sum, p) => sum + p.totalGoals, 0);

  const lastMatchTeamAPlayers = lastMatch?.teamAPlayers.map(s => allPlayers.find(p => p.id === s.playerId)).filter(Boolean) as Player[] || [];
  const lastMatchTeamBPlayers = lastMatch?.teamBPlayers.map(s => allPlayers.find(p => p.id === s.playerId)).filter(Boolean) as Player[] || [];

  return (
    <div className="flex flex-col gap-8 lg:gap-12 pb-20 max-w-7xl mx-auto">
      
      {/* SECCIÓN 1: EL OLIMPO (MÉTRICAS REINA) */}
      <section className="space-y-4">
        <h2 className="text-sm font-black uppercase tracking-[0.3em] text-muted-foreground/50 px-1">Líderes de la Academia</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Pichichi Hero Card */}
          <Link href={topScorer ? `/players/${topScorer.playerId}` : "/players"} className="md:col-span-2 lg:col-span-1">
            <Card className="glass-card card-gold hover:translate-y-[-4px] transition-all duration-300 cursor-pointer h-full bg-gradient-to-br from-card/60 to-yellow-500/10 overflow-hidden group relative">
              <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform duration-500">
                <Medal className="h-32 w-32 text-yellow-500" />
              </div>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-black uppercase tracking-widest text-yellow-500 flex items-center gap-2">
                  <Trophy className="h-3 w-3" /> Máximo Goleador
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16 border-4 border-yellow-500/30">
                    <AvatarFallback className="bg-yellow-500/10 text-yellow-500 text-2xl font-black">{getInitials(topScorer?.name || "?")}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="text-3xl lg:text-4xl font-black tracking-tighter text-white uppercase leading-none">
                      {topScorer?.name || '-'}
                    </div>
                    <p className="text-sm font-bold text-yellow-500/60 uppercase italic">Dueño de las redes</p>
                  </div>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-black text-yellow-500 italic leading-none">{topScorer?.totalGoals || 0}</span>
                  <span className="text-sm font-black text-yellow-500/50 uppercase tracking-widest">Goles Totales</span>
                </div>
              </CardContent>
            </Card>
          </Link>

          {/* Influencer Hero Card */}
          <Link href="/pulse/influencer" className="lg:col-span-1">
            <Card className="glass-card border-primary/30 hover:translate-y-[-4px] transition-all duration-300 cursor-pointer h-full bg-gradient-to-br from-card/60 to-primary/10 overflow-hidden group relative">
              <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform duration-500">
                <Brain className="h-32 w-32 text-primary" />
              </div>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-black uppercase tracking-widest text-primary flex items-center gap-2">
                  <Crown className="h-3 w-3" /> Jugador más Influyente
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16 border-4 border-primary/30">
                    <AvatarFallback className="bg-primary/10 text-primary text-2xl font-black">{getInitials(influencer?.name || "?")}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="text-3xl lg:text-4xl font-black tracking-tighter text-white uppercase leading-none">
                      {influencer?.name || '-'}
                    </div>
                    <p className="text-sm font-bold text-primary/60 uppercase italic">Factor de victoria</p>
                  </div>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-black text-primary italic leading-none">{influencer?.winPercentage || 0}%</span>
                  <span className="text-sm font-black text-primary/50 uppercase tracking-widest">Efectividad</span>
                </div>
              </CardContent>
            </Card>
          </Link>

          {/* Power Ranking Column */}
          <div className="lg:col-span-1">
            <PowerRanking players={allPlayers} matches={allMatches} />
          </div>
        </div>
      </section>

      {/* SECCIÓN 2: EL MOTOR DEL CLUB (RENDIMIENTO INDIVIDUAL Y TÁCTICO) */}
      <section className="space-y-6">
        <h2 className="text-sm font-black uppercase tracking-[0.3em] text-muted-foreground/50 px-1">Acción en la Cancha</h2>
        
        {/* Quick Stats Grid - Horizontal Row on Desktop */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
          <Link href="/matches">
            <Card className="glass-card hover:bg-white/5 transition-all border-white/5 overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 px-4">
                <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Partidos</CardTitle>
                <Calendar className="h-3 w-3 text-muted-foreground" />
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <div className="text-3xl font-black tracking-tighter">{allMatches.length}</div>
              </CardContent>
            </Card>
          </Link>
          <Link href="/players?sort=totalGoals">
            <Card className="glass-card hover:bg-white/5 transition-all border-white/5 overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 px-4">
                <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Goles</CardTitle>
                <Target className="h-3 w-3 text-muted-foreground" />
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <div className="text-3xl font-black tracking-tighter">{totalGoals}</div>
              </CardContent>
            </Card>
          </Link>
          <Link href="/players" className="col-span-2 lg:col-span-1">
            <Card className="glass-card hover:bg-emerald-500/10 transition-all border-emerald-500/20 bg-emerald-500/5 overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 px-4">
                <CardTitle className="text-[10px] font-black uppercase tracking-widest text-emerald-500">Los Infaltables</CardTitle>
                <Users className="h-4 w-4 text-emerald-500" />
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <div className="flex flex-col gap-2">
                  <div className="flex items-baseline justify-between">
                    <div className="text-3xl font-black tracking-tighter text-emerald-500">{attendanceRate}%</div>
                    <div className="text-[10px] font-bold text-emerald-500/60 uppercase">Asistencia</div>
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold text-white uppercase truncate">
                      {attendanceLeaders.length > 0 
                        ? (attendanceLeaders.length <= 3 
                            ? attendanceLeaders.map(p => p.name.split(' ')[0]).join(', ')
                            : `${attendanceLeaders[0].name.split(' ')[0]} + ${attendanceLeaders.length - 1} más`)
                        : 'Sin datos'}
                    </p>
                    <p className="text-[8px] uppercase font-black text-emerald-500/50 tracking-widest truncate">
                      {attendanceLeaders.length > 0 ? `Presentes en ${attendanceLeaders[0].matchesPlayed} encuentros` : ''}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Field Views - Full Width Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FieldView team="Azul" players={lastMatchTeamAPlayers} topScorerId={topScorer?.playerId} date={lastMatch?.date} />
          <FieldView team="Rojo" players={lastMatchTeamBPlayers} topScorerId={topScorer?.playerId} date={lastMatch?.date} />
        </div>
      </section>

      {/* SECCIÓN 3: EL PULSO SOCIAL (INSIGHTS) */}
      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <Zap className="h-5 w-5 text-primary fill-primary" />
          <h2 className="text-2xl font-black uppercase tracking-tighter italic text-white">Pulso de la Liga</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Link href="/pulse/influencer">
                <Card className="glass-card border-primary/20 hover:border-primary/50 transition-all group overflow-hidden cursor-pointer h-full">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <Brain className="h-24 w-24 text-primary" />
                    </div>
                    <CardHeader>
                        <CardTitle className="text-xs font-black uppercase tracking-widest text-primary flex items-center gap-2">
                            <Zap className="h-3 w-3" />
                            Top Factor
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center gap-4">
                            <Avatar className="h-12 w-12 border-2 border-primary/30">
                                <AvatarFallback className="bg-primary/10 text-primary font-black">{getInitials(influencer?.name || "??")}</AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col min-w-0">
                                <span className="text-lg font-black tracking-tight leading-none group-hover:text-primary transition-colors truncate">{influencer?.name || '-'}</span>
                                <span className="text-[10px] uppercase font-bold text-muted-foreground">Efectividad Bruta</span>
                            </div>
                        </div>
                        <div className="text-3xl font-black italic text-white">{influencer?.winPercentage || 0}%</div>
                    </CardContent>
                </Card>
            </Link>

            <Link href="/pulse/league">
                <Card className="glass-card border-orange-500/20 hover:border-orange-500/50 transition-all group overflow-hidden cursor-pointer h-full bg-gradient-to-br from-card/60 to-orange-500/5">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <Flame className="h-24 w-24 text-orange-500" />
                    </div>
                    <CardHeader>
                        <CardTitle className="text-xs font-black uppercase tracking-widest text-orange-500 flex items-center gap-2">
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
                    <CardHeader>
                        <CardTitle className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
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
                                <span className="text-sm font-black truncate">{topChemistry ? `${topChemistry.player1.name.split(' ')[0]} + ${topChemistry.player2.name.split(' ')[0]}` : 'Sin datos'}</span>
                                <span className="text-[8px] uppercase text-muted-foreground font-bold">{topChemistry?.matches || 0} partidos juntos</span>
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
        </div>
      </section>
    </div>
  );
}
