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
import { Flame, Crown, Info, TrendingUp } from "lucide-react";
import Link from "next/link";
import { cn, getInitials } from "@/lib/utils";
import type { Player, Match } from "@/lib/definitions";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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
    <Card className="competition-card h-full border-t-4 border-t-orange-500 bg-gradient-to-b from-orange-500/5 to-card">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-orange-500" />
            <span className="font-bebas text-2xl tracking-widest text-orange-500">ON FIRE</span>
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button className="text-muted-foreground/40 hover:text-orange-500 transition-colors">
                  <Info className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent className="bg-zinc-900 border-white/10 text-[10px] p-4 space-y-2">
                <p className="font-black text-orange-500 uppercase tracking-widest font-oswald border-b border-white/10 pb-1 mb-2">SISTEMA DE PUNTUACIÓN</p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 font-bold">
                  <span>MVP:</span> <span className="text-orange-500">+15 PTS</span>
                  <span>VICTORIA:</span> <span className="text-orange-500">+10 PTS</span>
                  <span>EMPATE:</span> <span className="text-orange-500">+5 PTS</span>
                  <span>MEJOR GOL:</span> <span className="text-orange-500">+5 PTS</span>
                  <span>POR GOL:</span> <span className="text-orange-500">+2 PTS</span>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </CardTitle>
        <CardDescription className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 font-oswald">TOP 5 RENDIMIENTO GLOBAL</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-5">
          {topRanking.map((player, index) => {
            const isLeader = index === 0;
            return (
              <div key={player.playerId} className={cn(
                "flex items-center justify-between p-3 rounded-md transition-all",
                isLeader ? "bg-orange-500/10 border border-orange-500/20 shadow-inner" : "border border-white/5"
              )}>
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <Avatar className={cn(
                      "h-10 w-10 border-2",
                      isLeader ? "border-orange-500 shadow-lg shadow-orange-500/20" : "border-muted"
                    )}>
                      <AvatarFallback className="bg-muted text-sm font-bebas">{getInitials(player.name)}</AvatarFallback>
                    </Avatar>
                    <span className="absolute -top-2 -left-2 bg-background border border-white/10 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bebas text-orange-500">
                      {index + 1}
                    </span>
                  </div>
                  <div className="flex flex-col min-w-0">
                    <Link href={`/players/${player.playerId}`} className="font-bold text-sm hover:text-orange-500 transition-colors truncate uppercase tracking-tighter">
                      {player.name}
                    </Link>
                    <span className="text-[8px] text-muted-foreground uppercase font-black font-oswald">{player.position || 'COMODÍN'}</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-bebas text-orange-500 leading-none">{player.powerPoints}</span>
                  <p className="text-[8px] uppercase font-black text-muted-foreground/40 font-oswald">PTS</p>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
