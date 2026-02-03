'use client';

import * as React from 'react';
import { calculateAggregatedStats, getTopChemistry } from "@/lib/data";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Medal, Trophy, Loader2, Sparkles, TrendingUp, Zap, Heart, Calendar, Users } from "lucide-react";
import Link from "next/link";
import { GoalsChart } from "@/components/dashboard/goals-chart";
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
  const topChemistry = getTopChemistry(allPlayers, allMatches);
  const lastMatch = allMatches[0];

  const sortedByGoals = [...playerStats].sort((a, b) => b.totalGoals - a.totalGoals || b.goalsPerMatch - a.goalsPerMatch);
  const sortedByMvp = [...playerStats].sort((a, b) => b.totalMvp - a.totalMvp || b.mvpPerMatch - a.mvpPerMatch);
  const sortedByWinRate = [...playerStats].filter(p => p.matchesPlayed > 2).sort((a, b) => b.winPercentage - a.winPercentage);

  const topScorer = sortedByGoals[0];
  const mvpKing = sortedByMvp[0];
  const winRateLeader = sortedByWinRate[0];

  // Cálculo de Asistencia
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
      {/* Metrics Row: Optimized for 6 cards in desktop with xl:grid-cols-6 */}
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

        {/* Elite Highlight Cards */}
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

        <Link href={mvpKing ? `/players/${mvpKing.playerId}` : "/players"} className="col-span-1">
          <Card className="glass-card hover:translate-y-[-4px] transition-all duration-300 cursor-pointer h-full border-primary/30 bg-primary/5">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
              <CardTitle className="text-[10px] font-black uppercase tracking-widest text-primary">MVP King</CardTitle>
              <Sparkles className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-xl lg:text-2xl font-black tracking-tighter text-primary truncate">
                {mvpKing?.name || '-'}
              </div>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-lg font-black text-primary/90">{mvpKing?.totalMvp || 0}</span>
                <span className="text-[10px] text-primary/60 font-bold uppercase ml-1">({mvpKing?.mvpPerMatch || 0} avg)</span>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href={winRateLeader ? `/players/${winRateLeader.playerId}` : "/players"} className="col-span-1">
          <Card className="glass-card hover:translate-y-[-4px] transition-all duration-300 cursor-pointer h-full border-accent/30 bg-accent/5">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
              <CardTitle className="text-[10px] font-black uppercase tracking-widest text-accent">Efectividad</CardTitle>
              <TrendingUp className="h-4 w-4 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-xl lg:text-2xl font-black tracking-tighter text-accent truncate">
                {winRateLeader?.name || '-'}
              </div>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-lg font-black text-accent/90">{winRateLeader?.winPercentage || 0}%</span>
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* Tarjeta de Asistencia */}
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
              <div className="flex items-center gap-2 mt-4">
                <div className="flex -space-x-2 overflow-hidden">
                  {attendanceLeaders.slice(0, 3).map((leader) => (
                    <Avatar key={leader.playerId} className="inline-block h-6 w-6 ring-2 ring-background border-emerald-500/20">
                      <AvatarFallback className="text-[8px] font-black bg-emerald-500/20 text-emerald-500">
                        {getInitials(leader.name)}
                      </AvatarFallback>
                    </Avatar>
                  ))}
                  {attendanceLeaders.length > 3 && (
                    <div className="flex items-center justify-center h-6 w-6 rounded-full bg-muted ring-2 ring-background text-[8px] font-black">
                      +{attendanceLeaders.length - 3}
                    </div>
                  )}
                </div>
                <div className="text-[10px] font-bold truncate text-muted-foreground uppercase tracking-tight">
                  {attendanceLeaders.length === 1 
                    ? attendanceLeaders[0].name.split(' ')[0] 
                    : attendanceLeaders.length > 1 
                      ? `${attendanceLeaders.length} Líderes` 
                      : '-'}
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Main Grid: Pitch and Social Analytics - Stacked on Mobile */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        <div className="order-2 lg:order-1">
          <FieldView team="Azul" players={lastMatchTeamAPlayers} topScorerId={topScorer?.playerId} />
        </div>
        <div className="order-3 lg:order-2">
          <FieldView team="Rojo" players={lastMatchTeamBPlayers} topScorerId={topScorer?.playerId} />
        </div>
        
        <div className="flex flex-col gap-6 order-1 lg:order-3">
            <PowerRanking players={allPlayers} matches={allMatches} />
            
            <Card className="glass-card border-white/5">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Heart className="h-6 w-6 text-accent fill-accent animate-pulse" />
                        <span className="font-black uppercase tracking-tighter italic text-xl lg:text-2xl text-accent">Química</span>
                    </CardTitle>
                    <CardDescription className="text-xs">La dupla con más victorias (mín. 3 partidos).</CardDescription>
                </CardHeader>
                <CardContent>
                    {topChemistry ? (
                        <div className="flex items-center justify-around gap-2 p-3 bg-accent/10 rounded-2xl border border-accent/20">
                            <div className="flex flex-col items-center gap-1">
                                <Avatar className="h-10 w-10 lg:h-14 lg:w-14 ring-2 ring-accent/30">
                                    <AvatarFallback className="text-xs lg:text-lg font-black">{getInitials(topChemistry.player1.name)}</AvatarFallback>
                                </Avatar>
                                <span className="text-[10px] font-bold truncate max-w-[60px]">{topChemistry.player1.name.split(' ')[0]}</span>
                            </div>
                            <div className="flex flex-col items-center">
                                <span className="text-xl lg:text-2xl font-black text-accent italic">+{topChemistry.wins}V</span>
                                <span className="text-[8px] uppercase font-black text-muted-foreground">Juntos</span>
                            </div>
                            <div className="flex flex-col items-center gap-1">
                                <Avatar className="h-10 w-10 lg:h-14 lg:w-14 ring-2 ring-accent/30">
                                    <AvatarFallback className="text-xs lg:text-lg font-black">{getInitials(topChemistry.player2.name)}</AvatarFallback>
                                </Avatar>
                                <span className="text-[10px] font-bold truncate max-w-[60px]">{topChemistry.player2.name.split(' ')[0]}</span>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-4 text-muted-foreground italic text-xs">Aún no hay parejas estables.</div>
                    )}
                </CardContent>
            </Card>
        </div>
      </div>

      {/* Table and Chart Row - Optimized for scanning */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="glass-card border-white/5 overflow-hidden">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-black uppercase tracking-tight">Top Goleadores</CardTitle>
              </div>
              <Trophy className="h-5 w-5 text-primary" />
            </div>
          </CardHeader>
          <CardContent className="p-0 lg:p-6">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-white/5">
                    <TableHead className="pl-4 lg:pl-0 font-black uppercase text-[10px] tracking-widest">Jugador</TableHead>
                    <TableHead className="text-center font-black uppercase text-[10px] tracking-widest">G</TableHead>
                    <TableHead className="text-center font-black uppercase text-[10px] tracking-widest hidden sm:table-cell">Prom</TableHead>
                    <TableHead className="text-right pr-4 lg:pr-0 font-black uppercase text-[10px] tracking-widest">PJ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedByGoals.slice(0, 5).map((player) => (
                    <TableRow key={player.playerId} className="border-white/5 group">
                      <TableCell className="pl-4 lg:pl-0">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8 ring-1 ring-transparent group-hover:ring-primary/40 transition-all">
                            <AvatarFallback className="bg-primary/20 text-primary font-black text-[10px]">{getInitials(player.name)}</AvatarFallback>
                          </Avatar>
                          <Link href={`/players/${player.playerId}`} className="font-bold text-xs truncate max-w-[100px] sm:max-w-none hover:text-primary transition-colors">{player.name}</Link>
                        </div>
                      </TableCell>
                      <TableCell className="text-center font-black text-base">{player.totalGoals}</TableCell>
                      <TableCell className="text-center hidden sm:table-cell">
                        <span className="bg-primary/10 text-primary px-2 py-0.5 rounded text-[10px] font-black">
                          {player.goalsPerMatch}
                        </span>
                      </TableCell>
                      <TableCell className="text-right pr-4 lg:pr-0 font-mono text-xs text-muted-foreground">{player.matchesPlayed}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
        <GoalsChart matches={allMatches} />
      </div>
    </div>
  );
}
