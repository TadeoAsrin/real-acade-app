'use client';

import * as React from 'react';
import { useParams, useRouter } from "next/navigation";
import { calculateAggregatedStats, getTopChemistry, getSpiciestMatch } from "@/lib/data";
import { useCollection, useMemoFirebase, useFirestore } from "@/firebase";
import { collection, query, orderBy } from "firebase/firestore";
import type { Match, Player } from "@/lib/definitions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Brain, Link as LinkIcon, Zap, Crown, Flame, Trophy, Calendar, Star, Heart } from "lucide-react";
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
  const topChemistry = getTopChemistry(allPlayers, allMatches, 2);
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
      .slice(0, 5);

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
            {sorted.map((p, i) => (
                <Card key={p.playerId} className={cn("glass-card transition-all", i === 0 ? "border-primary/50 bg-primary/5 scale-105" : "border-white/5")}>
                    <CardContent className="p-6 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="flex flex-col items-center w-8">
                                {i === 0 ? <Crown className="h-5 w-5 text-yellow-500 mb-1" /> : <span className="text-2xl font-black italic text-muted-foreground/30">{i + 1}</span>}
                            </div>
                            <Avatar className={cn("h-12 w-12", i === 0 && "border-2 border-primary")}>
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
                            <span className={cn("text-3xl font-black italic", i === 0 ? "text-primary" : "text-white")}>{p.winPercentage}%</span>
                            <p className="text-[8px] uppercase font-black text-muted-foreground leading-none">Efectividad</p>
                        </div>
                    </CardContent>
                </Card>
            ))}
            {sorted.length === 0 && (
                <div className="text-center py-20 border-2 border-dashed rounded-3xl opacity-30">
                    <p className="font-black uppercase italic">Ningún jugador ha llegado al mínimo de 3 partidos aún.</p>
                </div>
            )}
        </div>
      </div>
    );
  };

  const renderMvpRanking = () => {
    const maxMvps = Math.max(...playerStats.map(p => p.totalMvp), 0);
    const sorted = [...playerStats]
      .filter(p => p.totalMvp > 0)
      .sort((a, b) => b.totalMvp - a.totalMvp || b.powerPoints - a.powerPoints)
      .slice(0, 5);

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
            {sorted.length === 0 && (
                <div className="text-center py-20 border-2 border-dashed rounded-3xl opacity-30">
                    <p className="font-black uppercase italic">Nadie ha sido elegido MVP todavía.</p>
                </div>
            )}
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
    return (
      <div className="space-y-8 max-w-2xl mx-auto">
        <div className="text-center space-y-4">
            <div className="mx-auto w-20 h-20 bg-white/10 rounded-full flex items-center justify-center">
                <LinkIcon className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-4xl font-black italic uppercase tracking-tighter">Mejor Sociedad</h1>
            <p className="text-muted-foreground italic">La química perfecta. Jugadores que se entienden sin mirarse y dominan el campo juntos.</p>
        </div>

        {topChemistry ? (
            <Card className="glass-card border-primary/30 bg-primary/5 p-10 overflow-hidden relative">
                <div className="absolute -bottom-10 -right-10 opacity-5">
                    <Heart className="h-64 w-64 text-primary fill-primary" />
                </div>
                <div className="flex flex-col md:flex-row items-center justify-around gap-10 relative z-10">
                    <div className="flex flex-col items-center gap-4">
                        <Avatar className="h-24 w-24 border-4 border-primary">
                            <AvatarFallback className="text-2xl font-black">{getInitials(topChemistry.player1.name)}</AvatarFallback>
                        </Avatar>
                        <span className="font-black text-xl italic uppercase tracking-tighter">{topChemistry.player1.name}</span>
                    </div>
                    <div className="flex flex-col items-center">
                        <Zap className="h-12 w-12 text-primary animate-pulse" />
                        <span className="text-4xl font-black italic text-white mt-2">+{topChemistry.wins}V</span>
                        <span className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">Imbatibles</span>
                    </div>
                    <div className="flex flex-col items-center gap-4">
                        <Avatar className="h-24 w-24 border-4 border-primary">
                            <AvatarFallback className="text-2xl font-black">{getInitials(topChemistry.player2.name)}</AvatarFallback>
                        </Avatar>
                        <span className="font-black text-xl italic uppercase tracking-tighter">{topChemistry.player2.name}</span>
                    </div>
                </div>
                <div className="mt-12 p-4 bg-black/40 rounded-2xl border border-white/5 text-center">
                    <p className="text-xs font-bold text-muted-foreground uppercase">Han disputado <span className="text-white">{topChemistry.matches} encuentros</span> como aliados en el mismo equipo.</p>
                </div>
            </Card>
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
    </div>
  );
}
