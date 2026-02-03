
'use client';

import * as React from 'react';
import { calculateAggregatedStats, balanceTeams } from "@/lib/data";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, Dices, RefreshCw, Swords, Shield, Zap } from "lucide-react";
import { useCollection, useMemoFirebase, useFirestore } from "@/firebase";
import { collection } from "firebase/firestore";
import type { Player, Match, AggregatedPlayerStats } from "@/lib/definitions";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export default function TeamGeneratorPage() {
  const firestore = useFirestore();
  const [selectedIds, setSelectedIds] = React.useState<string[]>([]);
  const [teams, setTeams] = React.useState<{ teamA: AggregatedPlayerStats[], teamB: AggregatedPlayerStats[], scoreA: number, scoreB: number } | null>(null);

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

  const handleTogglePlayer = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleGenerate = () => {
    const playersToBalance = stats.filter(s => selectedIds.includes(s.playerId));
    const balanced = balanceTeams(playersToBalance);
    setTeams(balanced);
  };

  if (playersLoading || matchesLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-10 max-w-6xl mx-auto pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black tracking-tighter uppercase italic flex items-center gap-3">
            <Dices className="h-10 w-10 text-primary" />
            Equilibrador Pro
          </h1>
          <p className="text-muted-foreground">Selecciona a los jugadores presentes y genera equipos nivelados automáticamente.</p>
        </div>
        <div className="flex items-center gap-3">
            <Badge variant="outline" className="text-lg py-1 px-4 border-primary/20">
                {selectedIds.length} Seleccionados
            </Badge>
            <Button 
                onClick={handleGenerate} 
                disabled={selectedIds.length < 2} 
                size="lg"
                className="shadow-lg shadow-primary/20"
            >
                <Zap className="mr-2 h-4 w-4" /> Generar Equipos
            </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <Card className="lg:col-span-1 glass-card border-white/5">
          <CardHeader>
            <CardTitle className="text-xl font-bold">Convocatoria</CardTitle>
            <CardDescription>Marca a los que han venido hoy.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="max-h-[600px] overflow-y-auto px-6 pb-6 space-y-2">
              {stats.sort((a,b) => a.name.localeCompare(b.name)).map((player) => (
                <div 
                    key={player.playerId} 
                    className={cn(
                        "flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer",
                        selectedIds.includes(player.playerId) 
                            ? "bg-primary/10 border-primary/40 shadow-inner" 
                            : "bg-white/5 border-transparent hover:border-white/10"
                    )}
                    onClick={() => handleTogglePlayer(player.playerId)}
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10 border-2 border-white/10">
                      <AvatarImage src={player.avatar} alt={player.name} />
                      <AvatarFallback>{player.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                        <span className="font-bold text-sm">{player.name}</span>
                        <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-black">Nivel: {player.powerPoints}</span>
                    </div>
                  </div>
                  <Checkbox checked={selectedIds.includes(player.playerId)} />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="lg:col-span-2 space-y-8">
          {teams ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <Card className="glass-card border-primary/30 overflow-hidden relative">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                    <Shield className="h-20 w-20 text-primary" />
                </div>
                <CardHeader className="bg-primary/10 border-b border-primary/20">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-primary uppercase font-black italic">Equipo Azul</CardTitle>
                    <span className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-xs font-black">
                        Poder: {teams.scoreA}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  {teams.teamA.map(p => (
                    <div key={p.playerId} className="flex items-center gap-4 group">
                      <Avatar className="h-12 w-12 border-2 border-primary/50 group-hover:scale-110 transition-transform">
                        <AvatarImage src={p.avatar} alt={p.name} />
                        <AvatarFallback>{p.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="font-black text-lg">{p.name}</span>
                        <span className="text-xs text-muted-foreground italic font-medium">{p.totalGoals} goles este año</span>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="glass-card border-accent/30 overflow-hidden relative">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                    <Shield className="h-20 w-20 text-accent" />
                </div>
                <CardHeader className="bg-accent/10 border-b border-accent/20">
                   <div className="flex justify-between items-center">
                    <CardTitle className="text-accent uppercase font-black italic">Equipo Rojo</CardTitle>
                    <span className="bg-accent text-accent-foreground px-3 py-1 rounded-full text-xs font-black">
                        Poder: {teams.scoreB}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  {teams.teamB.map(p => (
                    <div key={p.playerId} className="flex items-center gap-4 group">
                      <Avatar className="h-12 w-12 border-2 border-accent/50 group-hover:scale-110 transition-transform">
                        <AvatarImage src={p.avatar} alt={p.name} />
                        <AvatarFallback>{p.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="font-black text-lg">{p.name}</span>
                        <span className="text-xs text-muted-foreground italic font-medium">{p.totalGoals} goles este año</span>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <div className="md:col-span-2 flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-3xl bg-white/5 space-y-4">
                <div className="flex items-center gap-6">
                    <div className="text-center">
                        <p className="text-[10px] uppercase font-black text-muted-foreground mb-1">Diferencia de Nivel</p>
                        <span className={cn(
                            "text-4xl font-black italic",
                            Math.abs(teams.scoreA - teams.scoreB) < 10 ? "text-emerald-500" : "text-orange-400"
                        )}>
                            {Math.abs(teams.scoreA - teams.scoreB)}
                        </span>
                    </div>
                    <Swords className="h-10 w-10 text-muted-foreground/30" />
                    <div className="text-center">
                        <p className="text-[10px] uppercase font-black text-muted-foreground mb-1">Equilibrio</p>
                        <span className="text-xl font-bold uppercase tracking-widest">
                            {Math.abs(teams.scoreA - teams.scoreB) < 10 ? "Máximo" : "Aceptable"}
                        </span>
                    </div>
                </div>
                <Button variant="outline" onClick={handleGenerate} className="border-white/10">
                    <RefreshCw className="mr-2 h-4 w-4" /> Re-equilibrar
                </Button>
              </div>
            </div>
          ) : (
            <div className="h-[400px] flex flex-col items-center justify-center border-2 border-dashed rounded-3xl bg-black/20 text-center p-12 space-y-6">
                <div className="p-6 bg-primary/10 rounded-full animate-pulse">
                    <Dices className="h-16 w-16 text-primary" />
                </div>
                <div className="max-w-xs">
                    <h3 className="text-xl font-bold uppercase italic mb-2 tracking-tight">Listo para el Pick</h3>
                    <p className="text-sm text-muted-foreground">Selecciona a los jugadores que han venido hoy a la izquierda para armar los equipos más parejos del club.</p>
                </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
