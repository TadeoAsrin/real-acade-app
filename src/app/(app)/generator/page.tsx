'use client';

import * as React from 'react';
import { calculateAggregatedStats, balanceTeams } from "@/lib/data";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, Dices, RefreshCw, Swords, Shield, Zap, Lock } from "lucide-react";
import { useCollection, useMemoFirebase, useFirestore, useUser, useDoc } from "@/firebase";
import { collection, doc } from "firebase/firestore";
import type { Player, Match, AggregatedPlayerStats } from "@/lib/definitions";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export default function TeamGeneratorPage() {
  const firestore = useFirestore();
  const { user } = useUser();
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

  const adminRoleRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'roles_admin', user.uid);
  }, [firestore, user]);

  const { data: playersData, isLoading: playersLoading } = useCollection<Player>(playersQuery);
  const { data: matchesData, isLoading: matchesLoading } = useCollection<Match>(matchesQuery);
  const { data: adminRole, isLoading: adminLoading } = useDoc<{isAdmin: boolean}>(adminRoleRef);

  const stats = React.useMemo(() => {
    if (!playersData || !matchesData) return [];
    return calculateAggregatedStats(playersData, matchesData);
  }, [playersData, matchesData]);

  if (playersLoading || matchesLoading || adminLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!adminRole?.isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-6 text-center px-6">
        <div className="p-6 bg-red-500/10 rounded-full">
            <Lock className="h-16 w-16 text-red-500" />
        </div>
        <div className="max-w-md">
            <h1 className="text-3xl font-black uppercase italic mb-2">Acceso Restringido</h1>
            <p className="text-muted-foreground">El Equilibrador Pro es una herramienta exclusiva para los capitanes y administradores del club.</p>
        </div>
      </div>
    );
  }

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

  return (
    <div className="flex flex-col gap-10 max-w-6xl mx-auto pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black tracking-tighter uppercase italic flex items-center gap-3 text-orange-400">
            <Dices className="h-10 w-10" />
            Equilibrador Pro
          </h1>
          <p className="text-muted-foreground">Selecciona a los jugadores presentes y genera equipos nivelados automáticamente.</p>
        </div>
        <div className="flex items-center gap-3">
            <Badge variant="outline" className="text-lg py-1 px-4 border-orange-500/20 text-orange-400">
                {selectedIds.length} Seleccionados
            </Badge>
            <Button 
                onClick={handleGenerate} 
                disabled={selectedIds.length < 2} 
                size="lg"
                className="bg-orange-500 hover:bg-orange-600 shadow-lg shadow-orange-500/20"
            >
                <Zap className="mr-2 h-4 w-4" /> Generar Equipos
            </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <Card className="lg:col-span-1 competition-card border-white/5">
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
                            ? "bg-orange-500/10 border-orange-500/40 shadow-inner" 
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
                  <Checkbox 
                    checked={selectedIds.includes(player.playerId)}
                    className="data-[state=checked]:bg-orange-500 data-[state=checked]:border-orange-500" 
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="lg:col-span-2 space-y-8">
          {teams ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <Card className="competition-card border-primary/30 overflow-hidden relative">
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
                        <span className="text-xs text-muted-foreground italic font-medium">{p.powerPoints} Puntos de Poder</span>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="competition-card border-accent/30 overflow-hidden relative">
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
                        <span className="text-xs text-muted-foreground italic font-medium">{p.powerPoints} Puntos de Poder</span>
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
                        <span className="text-xl font-bold uppercase tracking-widest text-white">
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
                <div className="p-6 bg-orange-500/10 rounded-full animate-pulse">
                    <Dices className="h-16 w-16 text-orange-500" />
                </div>
                <div className="max-w-xs">
                    <h3 className="text-xl font-bold uppercase italic mb-2 tracking-tight">Listo para el Pick</h3>
                    <p className="text-sm text-muted-foreground">Selecciona a los jugadores que han venido hoy a la izquierda para armar los equipos más parejos del club basándose en su nivel actual.</p>
                </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
