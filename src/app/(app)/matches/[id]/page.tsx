
'use client';

import * as React from 'react';
import { useParams } from "next/navigation";
import {
  Card,
  CardContent,
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
import { Badge } from "@/components/ui/badge";
import type { Player, PlayerStats, Match } from "@/lib/definitions";
import { cn } from "@/lib/utils";
import { BestGoalVote } from "@/components/matches/best-goal-vote";
import { Award, Star, Loader2, Share2, Pencil } from "lucide-react";
import { MatchAiSummary } from "@/components/matches/match-ai-summary";
import { useDoc, useCollection, useMemoFirebase, useFirestore, useUser } from "@/firebase";
import { doc, collection } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";

const PlayerStatsTable = ({
  title,
  stats,
  teamColor,
  allPlayers,
}: {
  title: string;
  stats: PlayerStats[];
  teamColor: "primary" | "accent";
  allPlayers: Player[];
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className={cn(teamColor === 'primary' ? "text-primary" : "text-accent")}>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Jugador</TableHead>
              <TableHead className="text-center">Goles</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {stats.map((stat) => {
              const player = allPlayers.find(p => p.id === stat.playerId);
              if (!player) return null;
              return (
                <TableRow key={player.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={player.avatar} alt={player.name} />
                        <AvatarFallback>{player.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{player.name}</span>
                       {stat.isMvp && (
                        <Badge variant="outline" className="border-yellow-400 text-yellow-400">
                          <Star className="mr-1 h-3 w-3" /> MVP
                        </Badge>
                      )}
                      {stat.hasBestGoal && (
                        <Badge variant="outline" className="border-primary text-primary">
                          <Award className="mr-1 h-3 w-3" /> Mejor Gol
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-center font-mono">
                    {stat.goals}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default function MatchDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();

  const matchRef = useMemoFirebase(() => {
    if (!firestore || !id) return null;
    return doc(firestore, 'matches', id);
  }, [firestore, id]);

  const playersRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'players');
  }, [firestore]);

  const adminRoleRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'roles_admin', user.uid);
  }, [firestore, user]);

  const { data: match, isLoading: matchLoading } = useDoc<Match>(matchRef);
  const { data: players, isLoading: playersLoading } = useCollection<Player>(playersRef);
  const { data: adminRole } = useDoc<{isAdmin: boolean}>(adminRoleRef);

  const isAdmin = adminRole?.isAdmin;

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast({
      title: "Enlace Copiado",
      description: "El enlace al partido se ha copiado al portapapeles.",
    });
  };

  if (matchLoading || playersLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!match) {
    return <div className="text-center py-12">Partido no encontrado.</div>;
  }

  const allPlayers = players || [];
  const allPlayerStats = [...match.teamAPlayers, ...match.teamBPlayers];
  
  const scorers = allPlayerStats
    .filter(stat => stat.goals > 0)
    .map(stat => {
      const player = allPlayers.find(p => p.id === stat.playerId);
      return player ? { ...player, goals: stat.goals } : null;
    })
    .filter(Boolean) as (Player & { goals: number })[];

  const mvpStat = allPlayerStats.find(s => s.isMvp);
  const bestGoalStat = allPlayerStats.find(s => s.hasBestGoal);

  const matchSummaryData = {
    date: match.date,
    teamAScore: match.teamAScore,
    teamBScore: match.teamBScore,
    teamAPlayers: match.teamAPlayers.map(s => ({ name: allPlayers.find(p => p.id === s.playerId)?.name || 'Desconocido', goals: s.goals })),
    teamBPlayers: match.teamBPlayers.map(s => ({ name: allPlayers.find(p => p.id === s.playerId)?.name || 'Desconocido', goals: s.goals })),
    mvpName: mvpStat ? allPlayers.find(p => p.id === mvpStat.playerId)?.name : undefined,
    bestGoalName: bestGoalStat ? allPlayers.find(p => p.id === bestGoalStat.playerId)?.name : undefined,
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
            <h1 className="text-4xl font-black tracking-tighter uppercase">Resumen del Partido</h1>
            <div className="flex items-center gap-2">
                <p className="text-muted-foreground">
                {new Date(match.date).toLocaleDateString("es-ES", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                })}
                </p>
                <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleShare}>
                        <Share2 className="h-4 w-4" />
                    </Button>
                    {isAdmin && (
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" asChild>
                            <Link href={`/matches/${id}/edit`}><Pencil className="h-4 w-4" /></Link>
                        </Button>
                    )}
                </div>
            </div>
        </div>
        <Badge variant="secondary" className="w-fit text-lg py-1 px-4 border-primary/20">Real Acade League</Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
            <Card className="bg-gradient-to-br from-background to-muted/50 border-none shadow-2xl overflow-hidden">
                <CardContent className="p-12 relative">
                    <div className="flex items-center justify-around relative z-10">
                        <div className="flex flex-col items-center gap-4">
                            <span className="text-2xl font-black text-primary uppercase tracking-widest">Azul</span>
                            <span className="text-8xl font-black text-primary drop-shadow-[0_0_15px_rgba(var(--primary),0.3)]">
                                {match.teamAScore}
                            </span>
                        </div>
                        <div className="flex flex-col items-center">
                            <div className="h-20 w-[2px] bg-muted-foreground/20 rotate-12"></div>
                            <span className="text-3xl font-light text-muted-foreground/30 italic my-4">VS</span>
                            <div className="h-20 w-[2px] bg-muted-foreground/20 -rotate-12"></div>
                        </div>
                        <div className="flex flex-col items-center gap-4">
                            <span className="text-2xl font-black text-accent uppercase tracking-widest">Rojo</span>
                            <span className="text-8xl font-black text-accent drop-shadow-[0_0_15px_rgba(var(--accent),0.3)]">
                                {match.teamBScore}
                            </span>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <PlayerStatsTable
                title="Equipo Azul"
                stats={match.teamAPlayers}
                teamColor="primary"
                allPlayers={allPlayers}
                />
                <PlayerStatsTable
                title="Equipo Rojo"
                stats={match.teamBPlayers}
                teamColor="accent"
                allPlayers={allPlayers}
                />
            </div>
        </div>

        <div className="space-y-8">
            <MatchAiSummary matchData={matchSummaryData} />
            
            <BestGoalVote matchId={id} scorers={scorers} />
        </div>
      </div>
    </div>
  );
}
