'use client';

import { calculateAggregatedStats } from "@/lib/data";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Zap, Crown } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import type { Player, Match } from "@/lib/definitions";

interface PowerRankingProps {
  players: Player[];
  matches: Match[];
}

export function PowerRanking({ players, matches }: PowerRankingProps) {
  const playerStats = calculateAggregatedStats(players, matches);
  const topRanking = [...playerStats]
    .sort((a, b) => b.powerPoints - a.powerPoints)
    .slice(0, 5);

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-yellow-500 fill-yellow-500" />
          Power Ranking
        </CardTitle>
        <CardDescription>Los mejores 5 jugadores por puntos de rendimiento.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {topRanking.map((player, index) => (
            <div key={player.playerId} className="flex items-center justify-between group">
              <div className="flex items-center gap-4">
                <div className="relative">
                    <Avatar className={cn(
                        "h-10 w-10 border-2",
                        index === 0 ? "border-yellow-500 shadow-lg shadow-yellow-500/20" : "border-muted"
                    )}>
                    <AvatarImage src={player.avatar} alt={player.name} />
                    <AvatarFallback>{player.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    {index === 0 && (
                        <div className="absolute -top-3 -right-2 rotate-12">
                            <Crown className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                        </div>
                    )}
                </div>
                <div className="flex flex-col">
                  <Link href={`/players/${player.playerId}`} className="font-bold hover:underline">
                    {player.name}
                  </Link>
                  <span className="text-xs text-muted-foreground uppercase tracking-widest">Puesto #{index + 1}</span>
                </div>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-xl font-black text-primary">{player.powerPoints}</span>
                <span className="text-[10px] text-muted-foreground uppercase font-bold">Puntos</span>
              </div>
            </div>
          ))}
          {topRanking.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">No hay datos suficientes aún.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
