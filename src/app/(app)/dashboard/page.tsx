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
import { Award, Medal, Trophy, Users, Loader2, Sparkles, TrendingUp, Zap, Heart, Calendar } from "lucide-react";
import Link from "next/link";
import { GoalsChart } from "@/components/dashboard/goals-chart";
import { FieldView } from "@/components/dashboard/field-view";
import { PowerRanking } from "@/components/dashboard/power-ranking";
import { useCollection, useMemoFirebase, useFirestore } from "@/firebase";
import { collection, query, orderBy } from "firebase/firestore";
import type { Match, Player } from "@/lib/definitions";
import { cn, getInitials } from "@/lib/utils";

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
  const sortedByMvp = [...playerStats].sort((a, b) => b.totalMvp - a.totalMvp);
  const sortedByWinRate = [...playerStats].filter(p => p.matchesPlayed > 2).sort((a, b) => b.winPercentage - a.winPercentage);

  const topScorer = sortedByGoals[0];
  const mvpKing = sortedByMvp[0];
  const winRateLeader = sortedByWinRate[0];

  const totalGoals = playerStats.reduce((sum, p) => sum + p.totalGoals, 0);

  const lastMatchTeamAPlayers = lastMatch?.teamAPlayers.map(s => allPlayers.find(p => p.id === s.playerId)).filter(Boolean) as Player[] || [];
  const lastMatchTeamBPlayers = lastMatch?.teamBPlayers.map(s => allPlayers.find(p => p.id === s.playerId)).filter(Boolean) as Player[] || [];

  return (
    <div className="flex flex-col gap-10">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Link href="/matches">
          <Card className="glass-card hover:translate-y-[-4px] transition-all duration-300 cursor-pointer h-full border-white/5">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
              <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Partidos</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black tracking-tighter">{allMatches.length}</div>
              <p className="text-[10px] text-muted-foreground font-medium mt-1 uppercase">Total jugados</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/players?sort=totalGoals">
          <Card className="glass-card hover:translate-y-[-4px] transition-all duration-300 cursor-pointer h-full border-white/5">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
              <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Goles</CardTitle>
              <Zap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black tracking-tighter">{totalGoals}</div>
              <p className="text-[10px] text-muted-foreground font-medium mt-1 uppercase">Anotados hoy</p>
            </CardContent>
          </Card>
        </Link>

        <Link href={topScorer ? `/players/${topScorer.playerId}` : "/players"}>
          <Card className="glass-card card-gold hover:translate-y-[-4px] transition-all duration-300 cursor-pointer h-full bg-gradient-to-br from-card/60 to-yellow-500/10 border-yellow-500/30">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
              <CardTitle className="text-[10px] font-black uppercase tracking-widest text-yellow-500">Pichichi</CardTitle>
              <Medal className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-black tracking-tighter text-yellow-500 truncate drop-shadow-[0_0_8px_rgba(234,179,8,0.3)]">
                {topScorer?.name || '-'}
              </div>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-xl font-black text-yellow-500/90">{topScorer?.totalGoals || 0} G</span>
                <span className="text-[10px] text-yellow-500/60 font-bold uppercase ml-1">({topScorer?.goalsPerMatch || 0} avg)</span>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href={mvpKing ? `/players/${mvpKing.playerId}` : "/players"}>
          <Card className="glass-card hover:translate-y-[-4px] transition-all duration-300 cursor-pointer h-full border-primary/30 bg-primary/5">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
              <CardTitle className="text-[10px] font-black uppercase tracking-widest text-primary">MVP King</CardTitle>
              <Sparkles className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-black tracking-tighter text-primary truncate">
                {mvpKing?.name || '-'}
              </div>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-xl font-black text-primary/90">{mvpKing?.totalMvp || 0}</span>
                <span className="text-[10px] text-primary/60 font-bold uppercase ml-1">Menciones</span>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href={winRateLeader ? `/players/${winRateLeader.playerId}` : "/players"}>
          <Card className="glass-card hover:translate-y-[-4px] transition-all duration-300 cursor-pointer h-full border-accent/30 bg-accent/5">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
              <CardTitle className="text-[10px] font-black uppercase tracking-widest text-accent">Efectividad %</CardTitle>
              <TrendingUp className="h-4 w-4 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-black tracking-tighter text-accent truncate">
                {winRateLeader?.name || '-'}
              </div>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-xl font-black text-accent/90">{winRateLeader?.winPercentage || 0}%</span>
                <span className="text-[10px] text-accent/60 font-bold uppercase ml-1">Win Rate</span>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-3">
        <FieldView team="Azul" players={lastMatchTeamAPlayers} topScorerId={topScorer?.playerId} />
        <FieldView team="Rojo" players={lastMatchTeamBPlayers} topScorerId={topScorer?.playerId} />
        
        <div className="flex flex-col gap-6">
            <PowerRanking players={allPlayers} matches={allMatches} />
            
            <Card className="glass-card border-white/5">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Heart className="h-6 w-6 text-accent fill-accent animate-pulse" />
                        <span className="font-black uppercase tracking-tighter italic text-2xl text-accent">Química</span>
                    </CardTitle>
                    <CardDescription>La dupla que más victorias tiene jugando juntos.</CardDescription>
                </CardHeader>
                <CardContent>
                    {topChemistry ? (
                        <div className="flex items-center justify-around gap-4 p-4 bg-accent/10 rounded-2xl border border-accent/20">
                            <div className="flex flex-col items-center gap-2">
                                <Avatar className="h-14 w-14 ring-2 ring-accent/30">
                                    <AvatarFallback className="text-lg font-black">{getInitials(topChemistry.player1.name)}</AvatarFallback>
                                </Avatar>
                                <span className="text-xs font-bold truncate max-w-[80px]">{topChemistry.player1.name.split(' ')[0]}</span>
                            </div>
                            <div className="flex flex-col items-center">
                                <span className="text-2xl font-black text-accent italic">+{topChemistry.wins}V</span>
                                <span className="text-[10px] uppercase font-black text-muted-foreground">Juntos</span>
                            </div>
                            <div className="flex flex-col items-center gap-2">
                                <Avatar className="h-14 w-14 ring-2 ring-accent/30">
                                    <AvatarFallback className="text-lg font-black">{getInitials(topChemistry.player2.name)}</AvatarFallback>
                                </Avatar>
                                <span className="text-xs font-bold truncate max-w-[80px]">{topChemistry.player2.name.split(' ')[0]}</span>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-6 text-muted-foreground italic text-sm">Aún no hay suficientes datos de victorias conjuntas.</div>
                    )}
                </CardContent>
            </Card>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
        <Card className="glass-card border-white/5">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl font-black uppercase tracking-tight">Top Goleadores</CardTitle>
                <CardDescription>Máxima efectividad frente al arco.</CardDescription>
              </div>
              <Trophy className="h-6 w-6 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-white/5">
                  <TableHead className="font-black uppercase text-[10px] tracking-widest">Jugador</TableHead>
                  <TableHead className="text-center font-black uppercase text-[10px] tracking-widest">Goles</TableHead>
                  <TableHead className="text-center font-black uppercase text-[10px] tracking-widest">Promedio</TableHead>
                  <TableHead className="text-right font-black uppercase text-[10px] tracking-widest">Partidos</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedByGoals.slice(0, 5).map((player) => (
                  <TableRow key={player.playerId} className="border-white/5 group">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10 ring-2 ring-transparent group-hover:ring-primary/40 transition-all">
                          <AvatarFallback className="bg-primary/20 text-primary font-black">{getInitials(player.name)}</AvatarFallback>
                        </Avatar>
                        <Link href={`/players/${player.playerId}`} className="font-bold text-sm hover:text-primary transition-colors">{player.name}</Link>
                      </div>
                    </TableCell>
                    <TableCell className="text-center font-black text-lg">{player.totalGoals}</TableCell>
                    <TableCell className="text-center">
                      <span className="bg-primary/10 text-primary px-2 py-0.5 rounded text-xs font-black">
                        {player.goalsPerMatch}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm text-muted-foreground">{player.matchesPlayed}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        <GoalsChart matches={allMatches} />
      </div>
    </div>
  );
}
