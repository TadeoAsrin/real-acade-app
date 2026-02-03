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
import { Medal, Loader2, Zap, Calendar, Users, Brain, Heart, Crown, ArrowUpRight, ArrowDownRight, Minus, Link as LinkIcon, Flame } from "lucide-react";
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
        const maxRate = leaders[0].matchesPlayed / totalMatches;
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
    <div className="flex flex-col gap-6 lg:gap-10 pb-10">
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <Link href="/matches" className="col-span-1">
          <Card className="glass-card hover:translate-y-[-4px] transition-all duration-300 cursor-pointer h-full border-white/5">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
              <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Partidos</CardTitle>
              <Calendar className="h-3 w-3 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl lg:text-3xl font-black tracking-tighter">{allMatches.length}</div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/players?sort=totalGoals" className="col-span-1">
          <Card className="glass-card hover:translate-y-[-4px] transition-all duration-300 cursor-pointer h-full border-white/5">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
              <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Goles</CardTitle>
              <Zap className="h-3 w-3 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl lg:text-3xl font-black tracking-tighter">{totalGoals}</div>
            </CardContent>
          </Card>
        </Link>

        <Link href={topScorer ? `/players/${topScorer.playerId}` : "/players"} className="col-span-1">
          <Card className="glass-card card-gold hover:translate-y-[-4px] transition-all duration-300 cursor-pointer h-full bg-gradient-to-br from-card/60 to-yellow-500/10 border-yellow-500/30">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
              <CardTitle className="text-[10px] font-black uppercase tracking-widest text-yellow-500">Pichichi</CardTitle>
              <Medal className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-xl lg:text-2xl font-black tracking-tighter text-yellow-500 truncate">
                {topScorer?.name || '-'}
              </div>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-lg font-black text-yellow-500/90">{topScorer?.totalGoals || 0} G</span>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/players" className="col-span-1">
          <Card className="glass-card hover:translate-y-[-4px] transition-all duration-300 cursor-pointer h-full border-emerald-500/30 bg-emerald-500/5">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
              <CardTitle className="text-[10px] font-black uppercase tracking-widest text-emerald-500">Asistencia</CardTitle>
              <Users className="h-4 w-4 text-emerald-500" />
            </CardHeader>
            <CardContent>
              <div className="text-xl lg:text-2xl font-black tracking-tighter text-emerald-500">
                {attendanceRate}%
              </div>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-lg font-black text-emerald-500/90">{attendanceLeaders[0]?.matchesPlayed || 0}</span>
                <span className="text-[10px] text-emerald-500/60 font-bold uppercase ml-1">Partidos</span>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        <div className="order-2 lg:order-1">
          <FieldView team="Azul" players={lastMatchTeamAPlayers} topScorerId={topScorer?.playerId} date={lastMatch?.date} />
        </div>
        <div className="order-3 lg:order-2">
          <FieldView team="Rojo" players={lastMatchTeamBPlayers} topScorerId={topScorer?.playerId} date={lastMatch?.date} />
        </div>
        
        <div className="flex flex-col gap-6 order-1 lg:order-3">
            <PowerRanking players={allPlayers} matches={allMatches} />
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-2xl font-black uppercase tracking-tighter italic text-white flex items-center gap-3">
            <Zap className="h-6 w-6 text-primary fill-primary" />
            Pulso de la Liga
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Link href="/pulse/influencer">
                <Card className="glass-card border-primary/20 hover:border-primary/50 transition-all group overflow-hidden cursor-pointer h-full">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <Brain className="h-24 w-24 text-primary" />
                    </div>
                    <CardHeader>
                        <CardTitle className="text-xs font-black uppercase tracking-widest text-primary flex items-center gap-2">
                            <Crown className="h-3 w-3" />
                            Más Influyente
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center gap-4">
                            <Avatar className="h-12 w-12 border-2 border-primary/30">
                                <AvatarFallback className="bg-primary/10 text-primary font-black">{getInitials(influencer?.name || "??")}</AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col">
                                <span className="text-lg font-black tracking-tight leading-none group-hover:text-primary transition-colors">{influencer?.name || '-'}</span>
                                <span className="text-[10px] uppercase font-bold text-muted-foreground">Victoria asegurada</span>
                            </div>
                        </div>
                        <div className="flex items-end justify-between">
                            <div className="flex flex-col">
                                <span className="text-3xl font-black italic text-white">{influencer?.winPercentage || 0}%</span>
                                <span className="text-[8px] uppercase font-black text-muted-foreground">Win Rate (mín. 3 PJ)</span>
                            </div>
                            <div className={cn(
                                "px-2 py-1 rounded text-[10px] font-bold",
                                influencer ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                            )}>
                                {influencer ? "Top Factor" : "Faltan datos"}
                            </div>
                        </div>
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
                        <div className="flex items-baseline justify-between">
                            <div className="flex flex-col">
                                <span className="text-5xl font-black italic text-white">{spiciestMatch ? spiciestMatch.teamAScore + spiciestMatch.teamBScore : 0}</span>
                                <span className="text-[8px] uppercase font-black text-muted-foreground">Goles Totales</span>
                            </div>
                            <div className="bg-orange-500/10 px-2 py-1 rounded text-[8px] font-black text-orange-500 uppercase tracking-tighter">
                                🔥 Récord histórico
                            </div>
                        </div>
                        <div className="bg-white/5 p-2 rounded-xl border border-white/5">
                            <p className="text-[10px] font-bold text-white uppercase tracking-tighter">
                                {spiciestMatch ? `Azul ${spiciestMatch.teamAScore} - ${spiciestMatch.teamBScore} Rojo` : 'Sin registros'}
                            </p>
                            <p className="text-[8px] text-muted-foreground uppercase font-medium">
                                {spiciestMatch ? new Date(spiciestMatch.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
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
                        <div className="flex -space-x-3 items-center">
                            <Avatar className="h-10 w-10 border-2 border-background ring-2 ring-white/10">
                                <AvatarFallback className="bg-muted text-[10px] font-black">{getInitials(topChemistry?.player1.name || "?")}</AvatarFallback>
                            </Avatar>
                            <Avatar className="h-10 w-10 border-2 border-background ring-2 ring-white/10">
                                <AvatarFallback className="bg-muted text-[10px] font-black">{getInitials(topChemistry?.player2.name || "?")}</AvatarFallback>
                            </Avatar>
                            <div className="pl-6 flex flex-col">
                                <span className="text-sm font-black truncate max-w-[120px]">{topChemistry?.player1.name.split(' ')[0]} + {topChemistry?.player2.name.split(' ')[0]}</span>
                                <span className="text-[8px] uppercase text-muted-foreground font-bold">{topChemistry?.matches || 0} partidos juntos</span>
                            </div>
                        </div>
                        <div className="pt-2">
                            <div className="flex justify-between text-[10px] font-black uppercase mb-1">
                                <span className="text-muted-foreground italic">Efectividad Dupla</span>
                                <span className="text-primary italic">{topChemistry ? Math.round((topChemistry.wins / topChemistry.matches) * 100) : 0}%</span>
                            </div>
                            <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                                <div 
                                    className="h-full bg-primary" 
                                    style={{ width: `${topChemistry ? (topChemistry.wins / topChemistry.matches) * 100 : 0}%` }} 
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </Link>
        </div>
      </div>
    </div>
  );
}
