'use client';

import * as React from 'react';
import { useParams, useRouter } from "next/navigation";
import { calculateAggregatedStats, getChemistryRankings, getSpiciestMatch } from "@/lib/data";
import { useCollection, useMemoFirebase, useFirestore } from "@/firebase";
import { collection, query, orderBy } from "firebase/firestore";
import type { Match, Player } from "@/lib/definitions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Brain, Link as LinkIcon, Zap, Crown, Flame, Trophy, Calendar, Star, Heart, Skull, Ghost, CloudRain, Droplets, TrendingUp, Users, Target } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getInitials, cn } from "@/lib/utils";
import Link from "next/link";

export default function PulseDetailPage() {
  const { type } = useParams();
  const router = useRouter();
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

  const allPlayers = playersData || [];
  const allMatches = matchesData || [];
  const playerStats = calculateAggregatedStats(allPlayers, allMatches);
  const chemistryRankings = getChemistryRankings(allPlayers, allMatches, 2);
  const spiciestMatch = getSpiciestMatch(allMatches);

  if (playersLoading || matchesLoading) return <div className="flex h-screen items-center justify-center"><Zap className="animate-pulse text-primary h-12 w-12" /></div>;

  const renderInfluencer = () => {
    const sorted = [...playerStats]
      .filter(p => p.matchesPlayed >= 3)
      .sort((a, b) => {
        if (b.winPercentage !== a.winPercentage) return b.winPercentage - a.winPercentage;
        if (b.matchesPlayed !== a.matchesPlayed) return b.matchesPlayed - a.matchesPlayed;
        if (b.powerPoints !== a.powerPoints) return b.powerPoints - a.powerPoints;
        return b.totalGoals - a.totalGoals;
      })
      .slice(0, 10);

    const maxWin = Math.max(...sorted.map(p => p.winPercentage));

    return (
      <div className="space-y-8 max-w-2xl mx-auto">
        <div className="text-center space-y-4">
            <div className="mx-auto w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center">
                <Brain className="h-10 w-10 text-primary" />
            </div>
            <h1 className="text-4xl font-black italic uppercase tracking-tighter">Jugadores Más Influyentes</h1>
            <div className="bg-primary/10 border border-primary/20 rounded-xl p-4 text-xs text-primary font-bold uppercase tracking-widest inline-block">
                Mínimo 3 Partidos Jugados
            </div>
            <p className="text-muted-foreground italic">El factor determinante. Ordenado por efectividad bruta y desempatado por consistencia (PJ) y contribución total (Power Points).</p>
        </div>

        <div className="space-y-4">
            {sorted.map((p, i) => {
                const isLeader = p.winPercentage === maxWin;
                return (
                    <Card key={p.playerId} className={cn("glass-card transition-all", isLeader ? "border-primary/50 bg-primary/5 scale-105" : "border-white/5")}>
                        <CardContent className="p-6 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="flex flex-col items-center w-8">
                                    {isLeader ? <Crown className="h-5 w-5 text-yellow-500 mb-1" /> : <span className="text-2xl font-black italic text-muted-foreground/30">{i + 1}</span>}
                                </div>
                                <Avatar className={cn("h-12 w-12", isLeader && "border-2 border-primary")}>
                                    <AvatarFallback className="bg-muted font-black">{getInitials(p.name)}</AvatarFallback>
                                </Avatar>
                                <div className="flex flex-col">
                                    <span className="font-black text-lg">{p.name}</span>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-bold uppercase text-muted-foreground">{p.wins}V en {p.matchesPlayed} PJ</span>
                                        <span className="text-[10px] font-black text-primary/60 tracking-tighter">• {p.powerPoints} PTS</span>
                                    </div>
                                </div>
                            </div>
                            <div className="text-right">
                                <span className={cn("text-3xl font-black italic", isLeader ? "text-primary" : "text-white")}>{p.winPercentage}%</span>
                                <p className="text-[8px] uppercase font-black text-muted-foreground leading-none">Efectividad</p>
                            </div>
                        </CardContent>
                    </Card>
                );
            })}
        </div>
      </div>
    );
  };

  const renderMvpRanking = () => {
    const maxMvps = Math.max(...playerStats.map(p => p.totalMvp), 0);
    const sorted = [...playerStats]
      .filter(p => p.totalMvp > 0)
      .sort((a, b) => b.totalMvp - a.totalMvp || b.powerPoints - a.powerPoints)
      .slice(0, 10);

    return (
      <div className="space-y-8 max-w-2xl mx-auto">
        <div className="text-center space-y-4">
            <div className="mx-auto w-20 h-20 bg-yellow-500/10 rounded-full flex items-center justify-center">
                <Star className="h-10 w-10 text-yellow-500 fill-yellow-500" />
            </div>
            <h1 className="text-4xl font-black italic uppercase tracking-tighter">Rey de los MVP</h1>
            <p className="text-muted-foreground italic">El reconocimiento máximo de los compañeros. Jugadores elegidos como el mejor del partido.</p>
        </div>

        <div className="space-y-4">
            {sorted.map((p, i) => {
                const isLeader = p.totalMvp === maxMvps;
                return (
                    <Card key={p.playerId} className={cn("glass-card transition-all", isLeader ? "border-yellow-500/50 bg-yellow-500/5 scale-105" : "border-white/5")}>
                        <CardContent className="p-6 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="flex flex-col items-center w-8">
                                    {isLeader ? <Crown className="h-5 w-5 text-yellow-500 mb-1" /> : <span className="text-2xl font-black italic text-muted-foreground/30">{i + 1}</span>}
                                </div>
                                <Avatar className={cn("h-12 w-12", isLeader && "border-2 border-yellow-500")}>
                                    <AvatarFallback className="bg-muted font-black">{getInitials(p.name)}</AvatarFallback>
                                </Avatar>
                                <div className="flex flex-col">
                                    <span className="font-black text-lg">{p.name}</span>
                                    <span className="text-[10px] font-bold uppercase text-muted-foreground">{p.matchesPlayed} Partidos Jugados</span>
                                </div>
                            </div>
                            <div className="text-right">
                                <span className={cn("text-3xl font-black italic", isLeader ? "text-yellow-500" : "text-white")}>{p.totalMvp}</span>
                                <p className="text-[8px] uppercase font-black text-muted-foreground leading-none">Premios</p>
                            </div>
                        </CardContent>
                    </Card>
                );
            })}
        </div>
      </div>
    );
  };

  const renderAttendance = () => {
    const totalMatches = allMatches.length;
    const sorted = [...playerStats]
      .sort((a, b) => b.matchesPlayed - a.matchesPlayed || a.name.localeCompare(b.name))
      .slice(0, 20);
    
    const maxAttendance = Math.max(...playerStats.map(p => p.matchesPlayed), 0);

    return (
      <div className="space-y-8 max-w-2xl mx-auto">
        <div className="text-center space-y-4">
            <div className="mx-auto w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center border border-emerald-500/20">
                <Users className="h-10 w-10 text-emerald-500" />
            </div>
            <h1 className="text-4xl font-black italic uppercase tracking-tighter">Los Infaltables</h1>
            <p className="text-muted-foreground italic">El ranking de compromiso. Los jugadores que siempre están listos para la batalla.</p>
        </div>

        <div className="space-y-4">
            {sorted.map((p, i) => {
                const percentage = totalMatches > 0 ? Math.round((p.matchesPlayed / totalMatches) * 100) : 0;
                const isLeader = p.matchesPlayed === maxAttendance;
                return (
                    <Card key={p.playerId} className={cn("glass-card transition-all border-white/5", isLeader && "border-emerald-500/30 bg-emerald-500/5 scale-105")}>
                        <CardContent className="p-6 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <span className="text-2xl font-black italic text-muted-foreground/30 w-8">{i + 1}</span>
                                <Avatar className={cn("h-12 w-12", isLeader && "ring-2 ring-emerald-500/50")}>
                                    <AvatarFallback className="bg-muted font-black">{getInitials(p.name)}</AvatarFallback>
                                </Avatar>
                                <div className="flex flex-col">
                                    <span className="font-black text-lg">{p.name}</span>
                                    <span className="text-[10px] font-bold uppercase text-muted-foreground">{p.matchesPlayed} de {totalMatches} Partidos</span>
                                </div>
                            </div>
                            <div className="text-right">
                                <span className={cn("text-3xl font-black italic", isLeader ? "text-emerald-500" : "text-white")}>{percentage}%</span>
                                <p className="text-[8px] uppercase font-black text-muted-foreground leading-none">Asistencia</p>
                            </div>
                        </CardContent>
                    </Card>
                );
            })}
        </div>
      </div>
    );
  };

  const renderImanDerrotas = () => {
    const maxLosses = Math.max(...playerStats.map(p => p.losses), 0);
    const sorted = [...playerStats]
      .filter(p => p.losses > 0)
      .sort((a, b) => b.losses - a.losses || b.matchesPlayed - a.matchesPlayed)
      .slice(0, 10);

    return (
      <div className="space-y-8 max-w-2xl mx-auto">
        <div className="text-center space-y-4">
            <div className="mx-auto w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center border border-red-500/20">
                <Skull className="h-10 w-10 text-red-500" />
            </div>
            <h1 className="text-4xl font-black italic uppercase tracking-tighter">Sala de Humildad: Imán de Derrotas</h1>
            <p className="text-muted-foreground italic">El registro de la mala suerte o el bajo rendimiento. Los que más veces han visto caer su arco.</p>
        </div>

        <div className="space-y-4">
            {sorted.map((p, i) => {
                const isLeader = p.losses === maxLosses;
                return (
                    <Card key={p.playerId} className={cn("glass-card transition-all border-white/5", isLeader && "border-red-500/30 bg-red-500/5 scale-105")}>
                        <CardContent className="p-6 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="flex flex-col items-center w-8">
                                    <span className="text-2xl font-black italic text-muted-foreground/30">{i + 1}</span>
                                </div>
                                <Avatar className={cn("h-12 w-12", isLeader && "ring-2 ring-red-500/50")}>
                                    <AvatarFallback className="bg-muted font-black">{getInitials(p.name)}</AvatarFallback>
                                </Avatar>
                                <div className="flex flex-col">
                                    <span className="font-black text-lg">{p.name}</span>
                                    <span className="text-[10px] font-bold uppercase text-muted-foreground">{p.matchesPlayed} Partidos Jugados</span>
                                </div>
                            </div>
                            <div className="text-right">
                                <span className={cn("text-3xl font-black italic", isLeader ? "text-red-500" : "text-white")}>{p.losses}</span>
                                <p className="text-[8px] uppercase font-black text-muted-foreground leading-none">Derrotas</p>
                            </div>
                        </CardContent>
                    </Card>
                );
            })}
        </div>
      </div>
    );
  };

  const renderRiesgo = () => {
    const sorted = [...playerStats]
      .filter(p => p.matchesPlayed >= 3)
      .sort((a, b) => a.winPercentage - b.winPercentage || a.matchesPlayed - b.matchesPlayed)
      .slice(0, 10);

    const minWinRate = Math.min(...sorted.map(p => p.winPercentage));

    return (
      <div className="space-y-8 max-w-2xl mx-auto">
        <div className="text-center space-y-4">
            <div className="mx-auto w-20 h-20 bg-zinc-500/10 rounded-full flex items-center justify-center border border-zinc-500/20">
                <Ghost className="h-10 w-10 text-zinc-500" />
            </div>
            <h1 className="text-4xl font-black italic uppercase tracking-tighter">Sala de Humildad: Factor de Riesgo</h1>
            <div className="bg-zinc-500/10 border border-zinc-500/20 rounded-xl p-4 text-xs text-zinc-400 font-bold uppercase tracking-widest inline-block">
                Mínimo 3 Partidos Jugados
            </div>
            <p className="text-muted-foreground italic">Menor porcentaje de victorias. Los que más sufren para sumar de a tres.</p>
        </div>

        <div className="space-y-4">
            {sorted.map((p, i) => {
                const isLeader = p.winPercentage === minWinRate;
                return (
                    <Card key={p.playerId} className={cn("glass-card transition-all border-white/5", isLeader && "border-zinc-500/30 bg-zinc-500/5 scale-105")}>
                        <CardContent className="p-6 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="flex flex-col items-center w-8">
                                    <span className="text-2xl font-black italic text-muted-foreground/30">{i + 1}</span>
                                </div>
                                <Avatar className={cn("h-12 w-12")}>
                                    <AvatarFallback className="bg-muted font-black">{getInitials(p.name)}</AvatarFallback>
                                </Avatar>
                                <div className="flex flex-col">
                                    <span className="font-black text-lg">{p.name}</span>
                                    <span className="text-[10px] font-bold uppercase text-muted-foreground">{p.wins}V en {p.matchesPlayed} PJ</span>
                                </div>
                            </div>
                            <div className="text-right">
                                <span className={cn("text-3xl font-black italic", isLeader ? "text-zinc-400" : "text-white")}>{p.winPercentage}%</span>
                                <p className="text-[8px] uppercase font-black text-muted-foreground leading-none">Efectividad</p>
                            </div>
                        </CardContent>
                    </Card>
                );
            })}
        </div>
      </div>
    );
  };

  const renderPolvora = () => {
    // Pólvora Mojada: Solo Mediocampistas y Delanteros
    const sorted = [...playerStats]
      .filter(p => p.matchesPlayed >= 3 && (p.position === 'Mediocampista' || p.position === 'Delantero'))
      .sort((a, b) => a.goalsPerMatch - b.goalsPerMatch || a.totalGoals - b.totalGoals)
      .slice(0, 10);

    const minGoals = Math.min(...sorted.map(p => p.goalsPerMatch));

    return (
      <div className="space-y-8 max-w-2xl mx-auto">
        <div className="text-center space-y-4">
            <div className="mx-auto w-20 h-20 bg-blue-500/10 rounded-full flex items-center justify-center border border-blue-500/20">
                <Droplets className="h-10 w-10 text-blue-500" />
            </div>
            <h1 className="text-4xl font-black italic uppercase tracking-tighter">Sala de Humildad: Pólvora Mojada</h1>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 text-xs text-blue-400 font-bold uppercase tracking-widest inline-block">
                  Mínimo 3 Partidos Jugados
              </div>
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 text-xs text-white font-bold uppercase tracking-widest inline-block">
                  Solo Mediocampistas y Delanteros
              </div>
            </div>
            <p className="text-muted-foreground italic">Menor promedio de gol por partido. Analizamos exclusivamente a los roles ofensivos que tienen el arco entre ceja y ceja.</p>
        </div>

        <div className="space-y-4">
            {sorted.map((p, i) => {
                const isLeader = p.goalsPerMatch === minGoals;
                return (
                    <Card key={p.playerId} className={cn("glass-card transition-all border-white/5", isLeader && "border-blue-500/30 bg-blue-500/5 scale-105")}>
                        <CardContent className="p-6 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="flex flex-col items-center w-8">
                                    <span className="text-2xl font-black italic text-muted-foreground/30">{i + 1}</span>
                                </div>
                                <Avatar className={cn("h-12 w-12")}>
                                    <AvatarFallback className="bg-muted font-black">{getInitials(p.name)}</AvatarFallback>
                                </Avatar>
                                <div className="flex flex-col">
                                    <span className="font-black text-lg">{p.name}</span>
                                    <div className="flex items-center gap-2">
                                      <span className="text-[10px] font-bold uppercase text-muted-foreground">{p.totalGoals} Goles en {p.matchesPlayed} PJ</span>
                                      <Badge variant="outline" className="text-[7px] h-3 uppercase border-white/10">{p.position}</Badge>
                                    </div>
                                </div>
                            </div>
                            <div className="text-right">
                                <span className={cn("text-3xl font-black italic", isLeader ? "text-blue-400" : "text-white")}>{p.goalsPerMatch}</span>
                                <p className="text-[8px] uppercase font-black text-muted-foreground leading-none">Goles/PJ</p>
                            </div>
                        </CardContent>
                    </Card>
                );
            })}
        </div>
      </div>
    );
  };

  const renderSpiciestMatch = () => {
    return (
      <div className="space-y-8 max-w-2xl mx-auto text-center">
        <div className="space-y-4">
            <div className="mx-auto w-20 h-20 bg-orange-500/10 rounded-full flex items-center justify-center">
                <Flame className="h-10 w-10 text-orange-500 fill-orange-500" />
            </div>
            <h1 className="text-4xl font-black italic uppercase tracking-tighter">Partido más picante</h1>
            <p className="text-muted-foreground italic">El encuentro con mayor producción ofensiva registrado en la historia de Real Acade.</p>
        </div>

        {spiciestMatch ? (
            <div className="space-y-6">
                <Card className="glass-card border-orange-500/30 bg-gradient-to-br from-orange-500/10 to-transparent p-10">
                    <div className="flex flex-col items-center gap-6">
                        <div className="bg-orange-500 text-white px-4 py-1 rounded-full text-xs font-black uppercase tracking-widest animate-pulse">
                            🔥 Récord histórico
                        </div>
                        <span className="text-8xl font-black italic text-white leading-none drop-shadow-[0_0_20px_rgba(249,115,22,0.4)]">
                            {spiciestMatch.teamAScore + spiciestMatch.teamBScore}
                        </span>
                        <span className="text-sm font-black uppercase text-orange-500 tracking-widest">Goles Totales</span>
                        
                        <div className="flex items-center gap-8 md:gap-16 pt-4 border-t border-white/10 w-full justify-center">
                            <div className="flex flex-col items-center">
                                <span className="text-xs font-black uppercase text-primary mb-1">Azul</span>
                                <span className="text-4xl font-black">{spiciestMatch.teamAScore}</span>
                            </div>
                            <div className="text-2xl font-light text-muted-foreground/30 italic">VS</div>
                            <div className="flex flex-col items-center">
                                <span className="text-xs font-black uppercase text-accent mb-1">Rojo</span>
                                <span className="text-4xl font-black">{spiciestMatch.teamBScore}</span>
                            </div>
                        </div>
                    </div>
                </Card>

                <div className="flex flex-col md:flex-row gap-4 items-center justify-center">
                    <div className="flex items-center gap-2 text-muted-foreground bg-white/5 px-4 py-2 rounded-full border border-white/5">
                        <Calendar className="h-4 w-4" />
                        <span className="text-xs font-bold uppercase tracking-tight">
                            {new Date(spiciestMatch.date).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                        </span>
                    </div>
                    <Button asChild variant="outline" className="border-orange-500/20 hover:bg-orange-500/10">
                        <Link href={`/matches/${spiciestMatch.id}`}>
                            <Trophy className="mr-2 h-4 w-4" /> Ver Ficha Técnica
                        </Link>
                    </Button>
                </div>
            </div>
        ) : (
            <div className="h-64 border-2 border-dashed rounded-3xl flex items-center justify-center text-muted-foreground italic">No hay partidos registrados para calcular el récord.</div>
        )}
      </div>
    );
  };

  const renderPartnership = () => {
    const maxWinRate = chemistryRankings.length > 0 ? chemistryRankings[0].winRate : 0;

    return (
      <div className="space-y-8 max-w-2xl mx-auto">
        <div className="text-center space-y-4">
            <div className="mx-auto w-20 h-20 bg-white/10 rounded-full flex items-center justify-center">
                <LinkIcon className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-4xl font-black italic uppercase tracking-tighter">Ranking de Sociedades</h1>
            <p className="text-muted-foreground italic">La química perfecta. Parejas de jugadores que dominan el campo cuando juegan juntos.</p>
        </div>

        {chemistryRankings.length > 0 ? (
            <div className="space-y-4">
                {chemistryRankings.map((pair, i) => {
                    const isLeader = pair.winRate === maxWinRate;
                    return (
                        <Card key={i} className={cn("glass-card transition-all", isLeader ? "border-primary/50 bg-primary/5 scale-105" : "border-white/5")}>
                            <CardContent className="p-6 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="flex flex-col items-center w-8">
                                        {isLeader ? <Crown className="h-5 w-5 text-primary mb-1" /> : <span className="text-2xl font-black italic text-muted-foreground/30">{i + 1}</span>}
                                    </div>
                                    <div className="flex -space-x-4">
                                        <Avatar className={cn("h-12 w-12 border-2 border-background ring-2", isLeader ? "ring-primary/40" : "ring-white/10")}>
                                            <AvatarFallback className="bg-muted font-black">{getInitials(pair.player1.name)}</AvatarFallback>
                                        </Avatar>
                                        <Avatar className={cn("h-12 w-12 border-2 border-background ring-2", isLeader ? "ring-primary/40" : "ring-white/10")}>
                                            <AvatarFallback className="bg-muted font-black">{getInitials(pair.player2.name)}</AvatarFallback>
                                        </Avatar>
                                    </div>
                                    <div className="flex flex-col min-w-0">
                                        <span className="font-black text-lg truncate italic">
                                            {pair.player1.name.split(' ')[0]} + {pair.player2.name.split(' ')[0]}
                                        </span>
                                        <span className="text-[10px] font-bold uppercase text-muted-foreground">{pair.wins}V en {pair.matches} PJ</span>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <span className={cn("text-3xl font-black italic", isLeader ? "text-primary" : "text-white")}>{pair.winRate}%</span>
                                    <p className="text-[8px] uppercase font-black text-muted-foreground leading-none">Efectividad</p>
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>
        ) : (
            <div className="h-64 border-2 border-dashed rounded-3xl flex items-center justify-center text-muted-foreground italic">No hay suficientes datos de parejas aún (mínimo 2 partidos juntos).</div>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto pb-20">
      <Button variant="ghost" onClick={() => router.back()} className="mb-8 hover:text-primary">
        <ArrowLeft className="mr-2 h-4 w-4" /> Volver al Dashboard
      </Button>

      {type === 'influencer' && renderInfluencer()}
      {type === 'league' && renderSpiciestMatch()}
      {type === 'partnership' && renderPartnership()}
      {type === 'mvp' && renderMvpRanking()}
      {type === 'attendance' && renderAttendance()}
      {type === 'iman-derrotas' && renderImanDerrotas()}
      {type === 'riesgo' && renderRiesgo()}
      {type === 'polvora' && renderPolvora()}
    </div>
  );
}