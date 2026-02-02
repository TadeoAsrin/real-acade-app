
'use client';

import * as React from 'react';
import { calculateAggregatedStats, getTeamGlobalStats } from "@/lib/data";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Award, Medal, Trophy, Users, Swords, Loader2, ShieldCheck, Sparkles } from "lucide-react";
import Link from "next/link";
import { GoalsChart } from "@/components/dashboard/goals-chart";
import { FieldView } from "@/components/dashboard/field-view";
import { PowerRanking } from "@/components/dashboard/power-ranking";
import { useCollection, useMemoFirebase, useFirestore, useUser, useDoc } from "@/firebase";
import { collection, query, orderBy, doc, setDoc } from "firebase/firestore";
import type { Match, Player } from "@/lib/definitions";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

export default function DashboardPage() {
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  const [isSettingUp, setIsSettingUp] = React.useState(false);

  const playersQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'players');
  }, [firestore]);

  const matchesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'matches'), orderBy('date', 'desc'));
  }, [firestore]);

  const adminRoleRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'roles_admin', user.uid);
  }, [firestore, user]);

  const { data: playersData, isLoading: playersLoading } = useCollection<Player>(playersQuery);
  const { data: matchesData, isLoading: matchesLoading } = useCollection<Match>(matchesQuery);
  const { data: adminRole } = useDoc<{isAdmin: boolean}>(adminRoleRef);

  const handleClaimAdmin = async () => {
    if (!firestore || !user) return;
    setIsSettingUp(true);
    try {
      await setDoc(doc(firestore, 'roles_admin', user.uid), {
        isAdmin: true
      });
      toast({
        title: "¡Eres Administrador!",
        description: "Ahora tienes permisos para gestionar jugadores y partidos.",
      });
    } catch (error) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo activar el modo administrador.",
      });
    } finally {
      setIsSettingUp(false);
    }
  };

  if (playersLoading || matchesLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const allPlayers = playersData || [];
  const allMatches = matchesData || [];
  
  const playerStats = calculateAggregatedStats(allPlayers, allMatches);
  const teamStats = getTeamGlobalStats(allMatches);
  const lastMatch = allMatches[0];

  const topScorers = [...playerStats]
    .sort((a, b) => b.totalGoals - a.totalGoals)
    .slice(0, 5);
  
  const topWinner = [...playerStats]
    .sort((a, b) => b.wins - a.wins)[0];

  const totalGoals = playerStats.reduce((sum, p) => sum + p.totalGoals, 0);
  const totalMatches = allMatches.length;

  const lastMatchTeamAPlayers = lastMatch?.teamAPlayers.map(s => allPlayers.find(p => p.id === s.playerId)).filter(Boolean) as Player[] || [];
  const lastMatchTeamBPlayers = lastMatch?.teamBPlayers.map(s => allPlayers.find(p => p.id === s.playerId)).filter(Boolean) as Player[] || [];

  return (
    <div className="flex flex-col gap-8">
      {user && !adminRole?.isAdmin && (
        <Card className="border-primary bg-primary/5 border-dashed">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" />
              Configuración Inicial
            </CardTitle>
            <CardDescription>
              Parece que eres un usuario nuevo. Pulsa el botón para convertirte en el administrador del club.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleClaimAdmin} disabled={isSettingUp}>
              {isSettingUp && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Activar Modo Administrador para mi cuenta
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Historial Global</CardTitle>
            <Swords className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold flex gap-2">
              <span className="text-primary">{teamStats.blueWins}</span>
              <span className="text-muted-foreground">-</span>
              <span className="text-accent">{teamStats.redWins}</span>
            </div>
            <p className="text-xs text-muted-foreground">{teamStats.draws} empates</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Partidos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalMatches}</div>
            <p className="text-xs text-muted-foreground">Encuentros disputados</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Goles</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalGoals}</div>
            <p className="text-xs text-muted-foreground">Total marcados</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Goleador</CardTitle>
            <Medal className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold truncate">{topScorers[0]?.name || '-'}</div>
            <p className="text-xs text-muted-foreground">{topScorers[0]?.totalGoals || 0} goles</p>
          </CardContent>
        </Card>
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Ganador</CardTitle>
                <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold truncate">{topWinner?.name || '-'}</div>
                <p className="text-xs text-muted-foreground">{topWinner?.wins || 0} victorias</p>
            </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-center text-primary">Formación Azul</h3>
          <FieldView team="Azul" players={lastMatchTeamAPlayers} />
        </div>
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-center text-accent">Formación Rojo</h3>
          <FieldView team="Rojo" players={lastMatchTeamBPlayers} />
        </div>
        <div className="space-y-4">
            <h3 className="text-lg font-semibold text-center text-yellow-500">Elite del Club</h3>
            <PowerRanking players={allPlayers} matches={allMatches} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Tabla de Goleadores</CardTitle>
            <CardDescription>Top 5 jugadores con más goles.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Jugador</TableHead>
                  <TableHead className="text-center">Goles</TableHead>
                  <TableHead className="text-right">Efectividad</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topScorers.map((player) => (
                  <TableRow key={player.playerId}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={player.avatar} alt={player.name} />
                          <AvatarFallback>{player.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <Link href={`/players/${player.playerId}`} className="font-medium hover:underline">{player.name}</Link>
                      </div>
                    </TableCell>
                    <TableCell className="text-center font-mono">{player.totalGoals}</TableCell>
                    <TableCell className="text-right font-mono">{player.winPercentage}%</TableCell>
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
