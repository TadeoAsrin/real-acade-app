'use client';

import * as React from 'react';
import { calculateAggregatedStats } from "@/lib/data";
import { useCollection, useMemoFirebase, useFirestore } from "@/firebase";
import { collection } from "firebase/firestore";
import type { Player, Match, AggregatedPlayerStats } from "@/lib/definitions";
import { Loader2, ArrowLeftRight, Trophy, Zap, Shield, Target, TrendingUp, MapPin } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn, getInitials } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

export default function ComparePage() {
  const firestore = useFirestore();
  const [player1Id, setPlayer1Id] = React.useState<string>("");
  const [player2Id, setPlayer2Id] = React.useState<string>("");

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

  const stats = React.useMemo(() => {
    if (!playersData || !matchesData) return [];
    return calculateAggregatedStats(playersData, matchesData);
  }, [playersData, matchesData]);

  const p1 = stats.find(s => s.playerId === player1Id);
  const p2 = stats.find(s => s.playerId === player2Id);

  if (playersLoading || matchesLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  const sortedPlayers = [...stats].sort((a, b) => a.name.localeCompare(b.name));

  const StatRow = ({ label, val1, val2, icon: Icon, unit = "" }: { label: string, val1: number, val2: number, icon: any, unit?: string }) => {
    const total = val1 + val2;
    const perc1 = total > 0 ? (val1 / total) * 100 : 50;
    
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between px-2">
          <div className={cn("text-lg font-black italic", val1 >= val2 ? "text-primary" : "text-muted-foreground")}>
            {val1}{unit}
          </div>
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground/50">
            <Icon className="h-3 w-3" />
            {label}
          </div>
          <div className={cn("text-lg font-black italic", val2 >= val1 ? "text-accent" : "text-muted-foreground")}>
            {val2}{unit}
          </div>
        </div>
        <div className="relative h-2 bg-muted rounded-full overflow-hidden flex">
            <div 
                className="h-full bg-primary transition-all duration-700 ease-out border-r border-background" 
                style={{ width: `${perc1}%` }} 
            />
            <div 
                className="h-full bg-accent transition-all duration-700 ease-out" 
                style={{ width: `${100 - perc1}%` }} 
            />
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-10 max-w-5xl mx-auto pb-20">
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-black tracking-tighter uppercase italic flex items-center justify-center gap-3">
          <ArrowLeftRight className="h-10 w-10 text-primary" />
          Versus Mode
        </h1>
        <p className="text-muted-foreground">Compara el rendimiento de dos leyendas del club cara a cara.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        <Card className="glass-card border-primary/20 bg-primary/5">
            <CardHeader className="text-center">
                <Select onValueChange={setPlayer1Id} value={player1Id}>
                    <SelectTrigger className="w-full font-black italic uppercase">
                        <SelectValue placeholder="Seleccionar Jugador 1" />
                    </SelectTrigger>
                    <SelectContent>
                        {sortedPlayers.map(p => (
                            <SelectItem key={p.playerId} value={p.playerId}>{p.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-4 py-6">
                <Avatar className="h-32 w-32 border-4 border-primary shadow-2xl shadow-primary/20">
                    <AvatarFallback className="text-4xl bg-primary/20 text-primary font-black">{getInitials(p1?.name || "P1")}</AvatarFallback>
                </Avatar>
                {p1 && (
                    <div className="text-center space-y-2">
                        <h3 className="text-2xl font-black italic text-primary uppercase leading-tight">{p1.name}</h3>
                        <div className="flex flex-col items-center gap-1">
                            {p1.position && (
                                <div className="flex items-center gap-1.5 text-[10px] font-black uppercase text-primary bg-primary/10 px-3 py-1 rounded-full">
                                    <MapPin className="h-3 w-3" />
                                    {p1.position}
                                </div>
                            )}
                            <p className="text-[10px] font-bold text-muted-foreground tracking-widest uppercase">Poder: {p1.powerPoints} PTS</p>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>

        <Card className="glass-card border-accent/20 bg-accent/5">
            <CardHeader className="text-center">
                 <Select onValueChange={setPlayer2Id} value={player2Id}>
                    <SelectTrigger className="w-full font-black italic uppercase">
                        <SelectValue placeholder="Seleccionar Jugador 2" />
                    </SelectTrigger>
                    <SelectContent>
                        {sortedPlayers.map(p => (
                            <SelectItem key={p.playerId} value={p.playerId}>{p.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-4 py-6">
                <Avatar className="h-32 w-32 border-4 border-accent shadow-2xl shadow-accent/20">
                    <AvatarFallback className="text-4xl bg-accent/20 text-accent font-black">{getInitials(p2?.name || "P2")}</AvatarFallback>
                </Avatar>
                {p2 && (
                    <div className="text-center space-y-2">
                        <h3 className="text-2xl font-black italic text-accent uppercase leading-tight">{p2.name}</h3>
                        <div className="flex flex-col items-center gap-1">
                            {p2.position && (
                                <div className="flex items-center gap-1.5 text-[10px] font-black uppercase text-accent bg-accent/10 px-3 py-1 rounded-full">
                                    <MapPin className="h-3 w-3" />
                                    {p2.position}
                                </div>
                            )}
                            <p className="text-[10px] font-bold text-muted-foreground tracking-widest uppercase">Poder: {p2.powerPoints} PTS</p>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
      </div>

      {p1 && p2 ? (
          <Card className="glass-card p-10 space-y-12">
            <StatRow label="Partidos Jugados" val1={p1.matchesPlayed} val2={p2.matchesPlayed} icon={Shield} />
            <StatRow label="Goles Totales" val1={p1.totalGoals} val2={p2.totalGoals} icon={Target} />
            <StatRow label="Victorias" val1={p1.wins} val2={p2.wins} icon={Trophy} />
            <StatRow label="Efectividad" val1={p1.winPercentage} val2={p2.winPercentage} icon={TrendingUp} unit="%" />
            <StatRow label="Puntos de Poder" val1={p1.powerPoints} val2={p2.powerPoints} icon={Zap} />
            <StatRow label="Premios MVP" val1={p1.totalMvp} val2={p2.totalMvp} icon={Target} />
          </Card>
      ) : (
          <div className="h-40 flex flex-col items-center justify-center border-2 border-dashed rounded-3xl opacity-30 text-center">
            <ArrowLeftRight className="h-12 w-12 mb-2" />
            <p className="font-bold uppercase italic">Selecciona dos jugadores para comparar</p>
          </div>
      )}
    </div>
  );
}
