
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
import { Award, Medal, Trophy, Users, Swords, Loader2, ShieldCheck, Sparkles, TrendingUp, Flame } from "lucide-react";
import Link from "next/link";
import { GoalsChart } from "@/components/dashboard/goals-chart";
import { FieldView } from "@/components/dashboard/field-view";
import { PowerRanking } from "@/components/dashboard/power-ranking";
import { useCollection, useMemoFirebase, useFirestore, useUser, useDoc } from "@/firebase";
import { collection, query, orderBy, doc, setDoc } from "firebase/firestore";
import type { Match, Player } from "@/lib/definitions";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

export default function DashboardPage() {
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  const [isSettingUp, setIsSettingUp] = React.useState(false);

  const playersQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'players'), orderBy('name', 'asc'));
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
      await setDoc(doc(firestore, 'roles_admin', user.uid), { isAdmin: true });
      toast({ title: "¡Eres Administrador!", description: "Ahora puedes gestionar el club." });
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "No se pudo activar el modo admin." });
    } finally {
      setIsSettingUp(false);
    }
  };

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
  const teamStats = getTeamGlobalStats(allMatches);
  const lastMatch = allMatches[0];

  // Logic: Wins > Effective % > Goals > Matches (asc)
  const sortedByWins = [...playerStats].sort((a, b) => {
    if (b.wins !== a.wins) return b.wins - a.wins;
    if (b.winPercentage !== a.winPercentage) return b.winPercentage - a.winPercentage;
    if (b.totalGoals !== a.totalGoals) return b.totalGoals - a.totalGoals;
    return a.matchesPlayed - b.matchesPlayed;
  });

  const sortedByGoals = [...playerStats].sort((a, b) => {
    if (b.totalGoals !== a.totalGoals) return b.totalGoals - a.totalGoals;
    if (b.winPercentage !== a.winPercentage) return b.winPercentage - a.winPercentage;
    return a.matchesPlayed - b.matchesPlayed;
  });

  const topScorer = sortedByGoals[0];
  const topWinner = sortedByWins[0];
  const totalGoals = playerStats.reduce((sum, p) => sum + p.totalGoals, 0);

  const lastMatchTeamAPlayers = lastMatch?.teamAPlayers.map(s => allPlayers.find(p => p.id === s.playerId)).filter(Boolean) as Player[] || [];
  const lastMatchTeamBPlayers = lastMatch?.teamBPlayers.map(s => allPlayers.find(p => p.id === s.playerId)).filter(Boolean) as Player[] || [];

  return (
    <div className="flex flex-col gap-10">
      {user && !adminRole?.isAdmin && (
        <Card className="glass-card border-primary/40 bg-primary/5 border-dashed overflow-hidden relative group">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <ShieldCheck className="h-6 w-6 text-primary animate-pulse" />
              Acceso de Gestión
            </CardTitle>
            <CardDescription className="text-base text-muted-foreground">¿Eres el responsable del club? Activa el panel de administración.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleClaimAdmin} disabled={isSettingUp} size="lg" className="relative z-10 shadow-lg shadow-primary/20">
              {isSettingUp ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
              Activar Modo Administrador
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Tarjetas Superiores */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
        <Card className="glass-card overflow-hidden hover:translate-y-[-4px] transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
            <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Global (Azul-Rojo)</CardTitle>
            <Swords className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black tracking-tighter flex items-center gap-2">
              <span className="text-primary">{teamStats.blueWins}</span>
              <span className="text-muted-foreground/30 font-light">-</span>
              <span className="text-accent">{teamStats.redWins}</span>
            </div>
            <p className="text-[10px] text-muted-foreground font-medium mt-1 uppercase">{teamStats.draws} empates</p>
          </CardContent>
        </Card>

        <Card className="glass-card overflow-hidden hover:translate-y-[-4px] transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
            <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Partidos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black tracking-tighter text-white">{allMatches.length}</div>
            <p className="text-[10px] text-muted-foreground font-medium mt-1 uppercase">Encuentros totales</p>
          </CardContent>
        </Card>

        <Card className="glass-card overflow-hidden hover:translate-y-[-4px] transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
            <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Goles</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black tracking-tighter text-white">{totalGoals}</div>
            <p className="text-[10px] text-muted-foreground font-medium mt-1 uppercase">Anotados este año</p>
          </CardContent>
        </Card>

        {/* Pichichi Dorado */}
        <Card className="glass-card card-gold overflow-hidden hover:translate-y-[-4px] transition-all duration-300 bg-gradient-to-br from-card/60 to-yellow-500/10 border-yellow-500/30">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
            <CardTitle className="text-[10px] font-black uppercase tracking-widest text-yellow-500">Pichichi</CardTitle>
            <Medal className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black tracking-tighter text-yellow-500 truncate drop-shadow-[0_0_8px_rgba(234,179,8,0.3)]">
              {topScorer?.name || '-'}
            </div>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-xl font-black text-yellow-500/90">{topScorer?.totalGoals || 0}</span>
              <span className="text-[10px] text-yellow-500/60 font-bold uppercase">goles en {topScorer?.matchesPlayed || 0} part.</span>
            </div>
          </CardContent>
        </Card>

        {/* Mejor Ganador Verde */}
        <Card className="glass-card card-success overflow-hidden hover:translate-y-[-4px] transition-all duration-300 bg-gradient-to-br from-card/60 to-emerald-500/10 border-emerald-500/30">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
            <CardTitle className="text-[10px] font-black uppercase tracking-widest text-emerald-500">Victoria</CardTitle>
            <Award className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black tracking-tighter text-emerald-500 truncate drop-shadow-[0_0_8px_rgba(16,185,129,0.3)]">
              {topWinner?.name || '-'}
            </div>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-xl font-black text-emerald-500/90">{topWinner?.wins || 0}V</span>
              <span className="text-[10px] text-emerald-500/60 font-bold uppercase">({topWinner?.winPercentage || 0}% efectividad)</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Formación y On Fire */}
      <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-3">
        <FieldView team="Azul" players={lastMatchTeamAPlayers} />
        <FieldView team="Rojo" players={lastMatchTeamBPlayers} />
        <PowerRanking players={allPlayers} matches={allMatches} />
      </div>

      {/* Tabla y Gráfica */}
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
        <Card className="glass-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl font-black uppercase tracking-tight">Top Goleadores</CardTitle>
                <CardDescription>Máxima efectividad frente al arco.</CardDescription>
              </div>
              <TrendingUp className="h-6 w-6 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-white/5">
                  <TableHead className="font-black uppercase text-[10px] tracking-widest">Jugador</TableHead>
                  <TableHead className="text-center font-black uppercase text-[10px] tracking-widest">Goles</TableHead>
                  <TableHead className="text-right font-black uppercase text-[10px] tracking-widest">Partidos</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedByGoals.slice(0, 5).map((player) => (
                  <TableRow key={player.playerId} className="border-white/5 group">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10 ring-2 ring-transparent group-hover:ring-primary/40 transition-all">
                          <AvatarImage src={player.avatar} alt={player.name} />
                          <AvatarFallback>{player.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <Link href={`/players/${player.playerId}`} className="font-bold text-sm hover:text-primary transition-colors">{player.name}</Link>
                      </div>
                    </TableCell>
                    <TableCell className="text-center font-black text-lg">{player.totalGoals}</TableCell>
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
