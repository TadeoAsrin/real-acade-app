'use client';

import { calculateAggregatedStats } from "@/lib/data";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useCollection, useMemoFirebase, useFirestore } from "@/firebase";
import { collection } from "firebase/firestore";
import type { Player, Match } from "@/lib/definitions";
import { Loader2 } from "lucide-react";

export default function PlayersPage() {
  const firestore = useFirestore();

  const playersQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'players');
  }, [firestore]);

  const matchesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'matches');
  }, [firestore]);

  const { data: playersData, isLoading: playersLoading } = useCollection<Player>(playersQuery);
  const { data: matchesData, isLoading: matchesLoading } = useCollection<Match>(matchesQuery);

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

  return (
    <Card>
        <CardHeader>
            <CardTitle>Todos los Jugadores</CardTitle>
            <CardDescription>Estadísticas acumuladas de todos los jugadores.</CardDescription>
        </CardHeader>
        <CardContent>
            <Table>
                <TableHeader>
                    <TableRow>
                    <TableHead>Jugador</TableHead>
                    <TableHead className="text-center">Partidos</TableHead>
                    <TableHead className="text-center">Goles</TableHead>
                    <TableHead className="text-center">Efectividad</TableHead>
                    <TableHead className="text-center">Capitán</TableHead>
                    <TableHead className="text-center">MVP</TableHead>
                    <TableHead className="text-center">Mejor Gol</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {playerStats.map((player) => (
                    <TableRow key={player.playerId}>
                        <TableCell>
                        <div className="flex items-center gap-3">
                            <Avatar className="h-9 w-9">
                            <AvatarImage src={player.avatar} alt={player.name} />
                            <AvatarFallback>{player.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <Link href={`/players/${player.playerId}`} className="font-medium hover:underline">{player.name}</Link>
                        </div>
                        </TableCell>
                        <TableCell className="text-center font-mono">{player.matchesPlayed}</TableCell>
                        <TableCell className="text-center font-mono">{player.totalGoals}</TableCell>
                        <TableCell className="text-center font-mono">{player.winPercentage}%</TableCell>
                        <TableCell className="text-center font-mono">{player.totalCaptaincies}</TableCell>
                        <TableCell className="text-center font-mono">{player.totalMvp}</TableCell>
                        <TableCell className="text-center font-mono">{player.totalBestGoals}</TableCell>
                    </TableRow>
                    ))}
                    {playerStats.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          No hay jugadores registrados.
                        </TableCell>
                      </TableRow>
                    )}
                </TableBody>
            </Table>
        </CardContent>
    </Card>
  );
}
