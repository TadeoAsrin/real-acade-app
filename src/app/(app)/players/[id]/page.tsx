
'use client';

import * as React from 'react';
import { useParams } from "next/navigation";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Trophy, History, TrendingUp, Loader2, MapPin } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import Link from "next/link";
import { PlayerPerformanceChart } from "@/components/players/player-performance-chart";
import { Badge } from "@/components/ui/badge";
import { useDoc, useCollection, useMemoFirebase, useFirestore } from "@/firebase";
import { doc, collection, query, orderBy } from "firebase/firestore";
import { calculateAggregatedStats } from "@/lib/data";
import type { Player, Match, AggregatedPlayerStats } from "@/lib/definitions";
import { getInitials } from "@/lib/utils";

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

  if (!player) {
    return <div className="text-center py-12">Jugador no encontrado.</div>;
  }

  const allMatches = matches || [];
  const statsList = calculateAggregatedStats(allPlayers || [], allMatches);
  const playerStats = statsList.find(s => s.playerId === id);

  if (!playerStats) {
      return <div className="text-center py-12">No hay estadísticas disponibles para este jugador.</div>;
  }

  const playerMatchHistory = allMatches
    .filter(match => 
        match.teamAPlayers.some(p => p.playerId === id) || 
        match.teamBPlayers.some(p => p.playerId === id)
    )
    .map(match => {
        const teamA = match.teamAPlayers.find(p => p.playerId === id);
        const teamB = match.teamBPlayers.find(p => p.playerId === id);
        const stats = teamA || teamB;
        return {
            ...stats!,
            matchId: match.id,
            date: match.date,
            team: teamA ? 'Azul' : 'Rojo'
        };
    });

  return (
    <div className="space-y-8">
      <div className="flex flex-col items-center gap-6 md:flex-row md:items-start">
        <Avatar className="h-32 w-32 border-4 border-primary shadow-2xl shadow-primary/20">
          <AvatarFallback className="text-4xl bg-primary/10 text-primary font-black">
            {getInitials(player.name)}
          </AvatarFallback>
        </Avatar>
        <div className="pt-4 text-center md:text-left space-y-2">
          <h1 className="text-4xl font-bold tracking-tight">{player.name}</h1>
          <div className="flex items-center justify-center md:justify-start gap-2">
            <Badge variant="secondary" className="px-3 py-1 uppercase tracking-widest text-[10px] font-black">
                {player.role === 'admin' ? 'Administrador' : 'Jugador Oficial'}
            </Badge>
            {player.position && (
                <div className="flex items-center gap-1.5 text-primary bg-primary/10 px-3 py-1 rounded-full">
                    <MapPin className="h-3 w-3" />
                    <span className="text-[10px] font-black uppercase tracking-wider">{player.position}</span>
                </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Efectividad General</CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{playerStats.winPercentage}%</div>
            <p className="text-xs text-muted-foreground">
              {playerStats.wins}V - {playerStats.draws}E - {playerStats.losses}D
            </p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Partidos por Equipo</CardTitle>
            <History className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
                <div>
                    <div className="text-2xl font-bold text-primary">{playerStats.matchesAsBlue}</div>
                    <p className="text-[10px] uppercase text-muted-foreground">Azul</p>
                </div>
                <div>
                    <div className="text-2xl font-bold text-accent">{playerStats.matchesAsRed}</div>
                    <p className="text-[10px] uppercase text-muted-foreground">Rojo</p>
                </div>
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Hitos</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="flex gap-4">
            <div>
                <div className="text-2xl font-bold">{playerStats.totalMvp}</div>
                <p className="text-[10px] uppercase text-muted-foreground">MVP</p>
            </div>
            <div>
                <div className="text-2xl font-bold">{playerStats.totalBestGoals}</div>
                <p className="text-[10px] uppercase text-muted-foreground">Mejor Gol</p>
            </div>
            <div>
                <div className="text-2xl font-bold">{playerStats.totalGoals}</div>
                <p className="text-[10px] uppercase text-muted-foreground">Goles</p>
            </div>
          </CardContent>
        </Card>
      </div>

       <PlayerPerformanceChart matchHistory={playerMatchHistory} />

      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Historial de Partidos</CardTitle>
          <CardDescription>Rendimiento en los últimos partidos.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Equipo</TableHead>
                <TableHead className="text-center">Goles</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {playerMatchHistory.map((match) => (
                <TableRow key={match.matchId}>
                  <TableCell>{new Date(match.date).toLocaleDateString('es-ES', { month: 'long', day: 'numeric', year: 'numeric' })}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={match.team === 'Azul' ? 'border-primary text-primary' : 'border-accent text-accent'}>
                        {match.team}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center font-mono">{match.goals}</TableCell>
                  <TableCell className="text-right">
                    <Link href={`/matches/${match.matchId}`} className="text-sm font-medium text-primary hover:underline">
                      Ver Partido
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
              {playerMatchHistory.length === 0 && (
                  <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                          No ha participado en partidos aún.
                      </TableCell>
                  </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
