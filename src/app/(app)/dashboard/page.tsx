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
import { Award, Medal, Trophy, Users, Swords, Loader2, ShieldCheck, Sparkles, TrendingUp } from "lucide-react";
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

  const topScorers = [...playerStats].sort((a, b) => b.totalGoals - a.totalGoals).slice(0, 5);
  const topWinner = [...playerStats].sort((a, b) => b.wins - a.wins)[0];
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
            <CardDescription className="text-base">¿Eres el responsable del club? Activa el panel de administración.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleClaimAdmin} disabled={isSettingUp} size="lg" className="relative z-10 shadow-lg shadow-primary/20">
              {isSettingUp ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
              Activar Modo Administrador
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Hero Stats Section */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
        {[
          { label: "Global", val: `${teamStats.blueWins}-${teamStats.redWins}`, sub: `${teamStats.draws} empates`, icon: Swords, color: "text-white" },
          { label: "Partidos", val: allMatches.length, sub: "Encuentros", icon: Users, color: "text-white" },
          { label: "Goles", val: totalGoals, sub: "Anotados", icon: Trophy, color: "text-white" },
          { label: "Goleador", val: topScorers[0]?.name || '-', sub: `${topScorers[0]?.totalGoals || 0} goles`, icon: Medal, color: "text-primary" },
          { label: "Victorioso", val: topWinner?.name || '-', sub: `${topWinner?.wins || 0} victorias`, icon: Award, color: "text-accent" },
        ].map((item, i) => (
          <Card key={i} className="glass-card overflow-hidden hover:translate-y-[-4px] transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{item.label}</CardTitle>
              <item.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={cn("text-3xl font-black tracking-tighter", item.color)}>{item.val}</div>
              <p className="text-xs text-muted-foreground font-medium mt-1">{item.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-3">
        <FieldView team="Azul" players={lastMatchTeamAPlayers} />
        <FieldView team="Rojo" players={lastMatchTeamBPlayers} />
        <PowerRanking players={allPlayers} matches={allMatches} />
      </div>

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
                  <TableHead className="text-right font-black uppercase text-[10px] tracking-widest">Ratio</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topScorers.map((player) => (
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
                    <TableCell className="text-right font-mono text-sm text-primary">{player.winPercentage}%</TableCell>
                  </TableRow>
                ))}
                {topScorers.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-10 text-muted-foreground italic">Esperando datos...</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        <GoalsChart matches={allMatches} />
      </div>
    </div>
  );
}