'use client';

import { calculateAggregatedStats } from "@/lib/data";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Flame, Crown } from "lucide-react";
import Link from "next/link";
import { cn, getInitials } from "@/lib/utils";
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
    <Card className="h-full glass-card border-orange-500/10">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Flame className="h-6 w-6 text-orange-500 fill-orange-500 animate-pulse" />
          <span className="font-black uppercase tracking-tighter italic text-2xl text-orange-500">On Fire</span>
        </CardTitle>
        <CardDescription>Los mejores 5 jugadores según su rendimiento actual.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {topRanking.map((player, index) => (
            <div key={player.playerId} className="flex items-center justify-between group">
              <div className="flex items-center gap-4">
                <div className="relative">
                    <Avatar className={cn(
                        "h-12 w-12 border-2",
                        index === 0 ? "border-yellow-500 shadow-lg shadow-yellow-500/20" : "border-muted"
                    )}>
                    <AvatarFallback className="bg-muted text-lg font-black">{getInitials(player.name)}</AvatarFallback>
                    </Avatar>
                    {index === 0 && (
                        <div className="absolute -top-3 -right-2 rotate-12">
                            <Crown className="h-6 w-6 text-yellow-500 fill-yellow-500" />
                        </div>
                    )}
                </div>
                <div className="flex flex-col">
                  <Link href={`/players/${player.playerId}`} className="font-bold hover:text-primary transition-colors">
                    {player.name}
                  </Link>
                  <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-black">Puesto #{index + 1}</span>
                </div>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-2xl font-black text-orange-500 italic leading-none">{player.powerPoints}</span>
                <span className="text-[10px] text-muted-foreground uppercase font-black">Pts</span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
