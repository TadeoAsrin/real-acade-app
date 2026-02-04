
'use client';

import * as React from 'react';
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
import { Card, CardContent } from "@/components/ui/card";
import { useCollection, useMemoFirebase, useFirestore } from "@/firebase";
import { collection, query, orderBy } from "firebase/firestore";
import type { Player, Match } from "@/lib/definitions";
import { Loader2, Trophy } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

const FormDot = ({ result }: { result: 'W' | 'D' | 'L' }) => {
  const colors = {
    W: "bg-emerald-500",
    D: "bg-orange-400",
    L: "bg-red-500"
  };
  const labels = { W: "G", D: "E", L: "P" };
  return (
    <div className={cn("h-5 w-5 rounded-full flex items-center justify-center text-[8px] font-black text-white", colors[result])}>
      {labels[result]}
    </div>
  );
};

export default function StandingsPage() {
  const firestore = useFirestore();

  const playersQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'players');
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
  const playerStats = calculateAggregatedStats(allPlayers, allMatches)
    .sort((a, b) => {
      const pointsA = a.wins * 3 + a.draws;
      const pointsB = b.wins * 3 + b.draws;
      if (pointsB !== pointsA) return pointsB - pointsA;
      if (b.winPercentage !== a.winPercentage) return b.winPercentage - a.winPercentage;
      return b.totalGoals - a.totalGoals;
    });

  return (
    <div className="flex flex-col gap-8 max-w-6xl mx-auto">
      <div>
        <h1 className="text-4xl font-black tracking-tighter uppercase italic">Clasificación General</h1>
        <p className="text-muted-foreground">La tabla oficial de Real Acade. Victoria: 3pts | Empate: 1pt.</p>
      </div>

      <Card className="glass-card border-none shadow-2xl overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-primary/10 hover:bg-primary/15 border-white/5">
                <TableHead className="w-12 text-center font-black uppercase text-[10px]">Pos</TableHead>
                <TableHead className="font-black uppercase text-[10px]">Jugador</TableHead>
                <TableHead className="text-center font-black uppercase text-[10px]">PJ</TableHead>
                <TableHead className="text-center font-black uppercase text-[10px] hidden md:table-cell text-emerald-500">G</TableHead>
                <TableHead className="text-center font-black uppercase text-[10px] hidden md:table-cell text-orange-400">E</TableHead>
                <TableHead className="text-center font-black uppercase text-[10px] hidden md:table-cell text-red-500">P</TableHead>
                <TableHead className="text-center font-black uppercase text-[10px] hidden sm:table-cell">GF</TableHead>
                <TableHead className="text-center font-black uppercase text-[10px] text-accent">% Efec</TableHead>
                <TableHead className="text-center font-black uppercase text-[10px] bg-primary/20">PTS</TableHead>
                <TableHead className="text-center font-black uppercase text-[10px] hidden lg:table-cell">Últimos 5</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {playerStats.map((player, index) => {
                const points = player.wins * 3 + player.draws;
                return (
                  <TableRow key={player.playerId} className="group border-white/5 hover:bg-white/5 transition-colors">
                    <TableCell className="text-center font-black italic text-lg">
                      {index + 1 === 1 ? <Trophy className="h-5 w-5 text-yellow-500 mx-auto" /> : index + 1}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9 ring-2 ring-white/5 group-hover:ring-primary/40 transition-all">
                          <AvatarImage src={player.avatar} alt={player.name} />
                          <AvatarFallback className="bg-muted text-xs font-black">{player.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <Link href={`/players/${player.playerId}`} className="font-bold hover:text-primary transition-colors text-sm truncate max-w-[100px] md:max-w-none">
                          {player.name}
                        </Link>
                      </div>
                    </TableCell>
                    <TableCell className="text-center font-mono">{player.matchesPlayed}</TableCell>
                    <TableCell className="text-center font-mono hidden md:table-cell text-emerald-500/80">{player.wins}</TableCell>
                    <TableCell className="text-center font-mono hidden md:table-cell text-orange-400/80">{player.draws}</TableCell>
                    <TableCell className="text-center font-mono hidden md:table-cell text-red-500/80">{player.losses}</TableCell>
                    <TableCell className="text-center font-black text-primary/70 hidden sm:table-cell">{player.totalGoals}</TableCell>
                    <TableCell className="text-center font-black text-accent italic">
                        {player.winPercentage}%
                    </TableCell>
                    <TableCell className={cn(
                        "text-center font-black text-xl italic bg-primary/10",
                        index < 3 ? "text-primary" : "text-white"
                    )}>
                        {points}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <div className="flex items-center justify-center gap-1">
                        {player.form.map((res, i) => (
                          <FormDot key={i} result={res} />
                        ))}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
