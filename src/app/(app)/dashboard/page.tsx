
"use client";

import * as React from 'react';
import { useSearchParams } from 'next/navigation';
import { useCollection, useMemoFirebase, useFirestore } from "@/firebase";
import { collection, query, orderBy } from "firebase/firestore";
import type { Match, Player } from "@/lib/definitions";
import { Loader2, Newspaper, ArrowRight, Trophy, Zap, Flame, Target, Users, Link as LinkIcon, Crown, Star, Skull, ShieldAlert, Droplets, Info, Brain } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { calculateAggregatedStats, getChemistryRankings } from "@/lib/data";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getInitials, cn } from "@/lib/utils";
import { MatchNewsModal } from '@/components/dashboard/match-news-modal';

function DashboardContent() {
  const searchParams = useSearchParams();
  const gacetaMatchId = searchParams.get('gaceta');
  const firestore = useFirestore();

  const playersQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'players'), orderBy('name', 'asc'));
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
  const playedMatches = allMatches.filter(m => m.teamAScore > 0 || m.teamBScore > 0);
  const lastMatch = playedMatches[0];
  const stats = calculateAggregatedStats(allPlayers, allMatches);

  // 1. Pichichi Stats
  const pichichiRanking = [...stats].sort((a, b) => b.totalGoals - a.totalGoals || b.goalsPerMatch - a.goalsPerMatch);
  const topScorer = pichichiRanking[0];
  const otherScorers = pichichiRanking.slice(1, 5);

  // 2. Influence Stats
  const influenceRanking = [...stats]
    .filter(p => p.matchesPlayed >= 2)
    .sort((a, b) => b.winPercentage - a.winPercentage || b.matchesPlayed - a.matchesPlayed);
  const mostInfluential = influenceRanking[0];
  const otherInfluential = influenceRanking.slice(1, 3);

  // 3. On Fire (Power Ranking)
  const topPower = [...stats].sort((a, b) => b.powerPoints - a.powerPoints).slice(0, 5);

  // 4. Pulso de la Competición
  const maxMvpCount = stats.length > 0 ? Math.max(...stats.map(p => p.totalMvp), 0) : 0;
  const recordGoalsInMatch = allMatches.length > 0 ? Math.max(...allMatches.map(m => m.teamAScore + m.teamBScore), 0) : 0;
  
  const chemistry = getChemistryRankings(allPlayers, allMatches, 1);
  const topPair = chemistry[0];
  const societyText = topPair 
    ? `${topPair.player1.name.split(' ')[0]} + ${topPair.player2.name.split(' ')[0]}` 
    : "SIN DUPLAS";
  const societyValue = topPair ? `${topPair.winRate}%` : "0%";

  const totalPossibleMatches = playedMatches.length;
  const topAttendance = stats.length > 0 ? Math.max(...stats.map(p => p.matchesPlayed), 0) : 0;
  const attendanceValue = totalPossibleMatches > 0 ? `${Math.round((topAttendance / totalPossibleMatches) * 100)}%` : "0%";

  // 5. Sala de Humildad
  const filteredForHumility = stats.filter(p => p.matchesPlayed >= 2);
  const imanDerrotas = [...filteredForHumility].sort((a, b) => b.losses - a.losses || b.matchesPlayed - a.matchesPlayed).slice(0, 3);
  const deudaMando = [...filteredForHumility].filter(p => p.totalCaptaincies === 0).sort((a, b) => b.matchesPlayed - a.matchesPlayed).slice(0, 3);
  const polvoraMojada = [...filteredForHumility]
    .filter(p => p.position === 'Mediocampista' || p.position === 'Delantero')
    .sort((a, b) => a.goalsPerMatch - b.goalsPerMatch || a.totalGoals - b.totalGoals)
    .slice(0, 3);

  const forcedMatch = gacetaMatchId ? allMatches.find(m => m.id === gacetaMatchId) : null;
  const matchForModal = forcedMatch || (lastMatch?.aiSummary ? lastMatch : null);

  return (
    <div className="flex flex-col gap-10 max-w-7xl mx-auto pb-20">
      {matchForModal && (
        <MatchNewsModal 
          match={matchForModal} 
          allPlayers={allPlayers} 
          forceOpen={!!forcedMatch} 
        />
      )}

      {/* 1. HERO SECTION */}
      {lastMatch && (
        <section>
          <div className="relative overflow-hidden rounded-[2rem] bg-[#111827] border border-white/5 shadow-2xl p-8 md:p-12">
            <div className="absolute top-0 right-0 p-8 opacity-5">
              <Newspaper className="h-40 w-40" />
            </div>
            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-8 space-y-6">
                <div className="flex items-center gap-3">
                  <Badge className="bg-primary text-white font-bold text-[10px] tracking-widest px-3 py-1 uppercase rounded-full">NUEVA EDICIÓN</Badge>
                  <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                    {new Date(lastMatch.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })}
                  </span>
                </div>
                <h1 className="text-4xl md:text-6xl font-black italic uppercase leading-[0.9] tracking-tighter">
                  {lastMatch.aiSummary?.title || "CRÓNICA DE LA JORNADA"}
                </h1>
                <p className="text-lg text-muted-foreground font-medium italic max-w-2xl">
                  {lastMatch.aiSummary?.subtitle || "Exhibición de fútbol y mística en el último encuentro del club."}
                </p>
                <div className="flex flex-wrap gap-4 pt-4">
                  <Button asChild size="lg" className="bg-primary hover:bg-primary/90 text-white font-black uppercase italic px-10 h-14 text-sm rounded-xl">
                    <Link href={`/dashboard?gaceta=${lastMatch.id}`}>LEER GACETA</Link>
                  </Button>
                  <Button asChild variant="outline" size="lg" className="border-white/10 hover:bg-white/5 font-black uppercase italic px-10 h-14 text-sm rounded-xl">
                    <Link href={`/matches/${lastMatch.id}`}>FICHA TÉCNICA</Link>
                  </Button>
                </div>
              </div>
              
              <div className="lg:col-span-4 flex justify-center lg:justify-end">
                <div className="bg-[#0b1220] p-8 rounded-3xl border border-white/10 shadow-inner text-center space-y-4 min-w-[240px]">
                  <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest font-oswald">RESULTADO</p>
                  <div className="flex items-center justify-center gap-6">
                    <div className="flex flex-col items-center">
                      <span className="text-6xl font-black italic text-primary leading-none drop-shadow-[0_0_15px_rgba(59,130,246,0.3)] font-bebas">{lastMatch.teamAScore}</span>
                      <span className="text-[8px] font-bold text-primary/60 uppercase mt-2">AZUL</span>
                    </div>
                    <div className="h-10 w-[1px] bg-white/10" />
                    <div className="flex flex-col items-center">
                      <span className="text-6xl font-black italic text-accent leading-none drop-shadow-[0_0_15px_rgba(244,63,94,0.3)] font-bebas">{lastMatch.teamBScore}</span>
                      <span className="text-[8px] font-bold text-accent/60 uppercase mt-2">ROJO</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 2. ESTRELLAS DE LA ACADEMIA */}
      <section className="space-y-6">
        <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground/40 px-1 font-oswald">ESTRELLAS DE LA ACADEMIA</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* 1. Carrera por el Pichichi */}
          <div className="bg-[#111827] rounded-2xl p-8 border border-white/5 flex flex-col h-full">
            <div className="flex items-center gap-2 text-yellow-500 mb-6">
              <Trophy className="h-4 w-4" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] font-oswald">CARRERA POR EL PICHICHI</span>
            </div>
            
            {topScorer && (
              <div className="space-y-6 flex-1">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <Avatar className="h-16 w-16 border-2 border-white/10">
                      <AvatarFallback className="bg-white/5 text-white font-black text-xl">{getInitials(topScorer.name)}</AvatarFallback>
                    </Avatar>
                    <div className="absolute -top-1 -right-1 bg-yellow-500 rounded-full p-1 border-2 border-[#111827]">
                      <Crown className="h-3 w-3 text-black" />
                    </div>
                  </div>
                  <div>
                    <Link href={`/players/${topScorer.playerId}`} className="text-3xl font-black italic uppercase leading-none hover:text-yellow-500 transition-colors">{topScorer.name}</Link>
                    <p className="text-[10px] font-bold text-yellow-500/60 uppercase mt-1">LÍDER ACTUAL</p>
                  </div>
                </div>

                <div className="flex items-baseline gap-2">
                  <span className="text-6xl font-black italic leading-none font-bebas">{topScorer.totalGoals}</span>
                  <span className="text-[10px] font-black uppercase text-muted-foreground tracking-widest font-oswald">GOLES TOTALES</span>
                </div>

                <div className="bg-white/5 rounded-xl p-4 flex gap-8">
                  <div>
                    <p className="text-[8px] font-black text-yellow-500 uppercase tracking-widest mb-1 font-oswald">PROMEDIO</p>
                    <p className="text-xl font-black italic font-bebas">{topScorer.goalsPerMatch} G/PJ</p>
                  </div>
                  <div>
                    <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest mb-1 font-oswald">PARTIDOS</p>
                    <p className="text-xl font-black italic font-bebas">{topScorer.matchesPlayed} PJ</p>
                  </div>
                </div>

                <div className="space-y-3 pt-4">
                  {otherScorers.map((p, idx) => (
                    <div key={p.playerId} className="flex items-center justify-between group">
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] font-black text-muted-foreground/30 w-4 font-oswald">#{idx + 2}</span>
                        <Link href={`/players/${p.playerId}`} className="text-xs font-bold uppercase hover:text-yellow-500 transition-colors">{p.name}</Link>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-[9px] font-bold text-muted-foreground/40 font-oswald">{p.goalsPerMatch} G/PJ</span>
                        <span className="text-sm font-black italic font-bebas">{p.totalGoals}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <Button asChild variant="link" className="mt-8 text-[10px] font-black uppercase tracking-widest text-yellow-500 p-0 h-auto self-center font-oswald">
              <Link href="/standings?tab=goleadores" className="flex items-center gap-2">VER RANKING COMPLETO <ArrowRight className="h-3 w-3" /></Link>
            </Button>
          </div>

          {/* 2. Jugador más Influyente */}
          <div className="bg-[#111827] rounded-2xl p-8 border border-white/5 flex flex-col h-full">
            <div className="flex items-center gap-2 text-primary mb-6">
              <Brain className="h-4 w-4" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] font-oswald">JUGADOR MÁS INFLUYENTE</span>
            </div>

            {mostInfluential && (
              <div className="space-y-6 flex-1">
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16 border-2 border-white/10">
                    <AvatarFallback className="bg-white/5 text-primary font-black text-xl">{getInitials(mostInfluential.name)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <Link href={`/players/${mostInfluential.playerId}`} className="text-3xl font-black italic uppercase leading-none hover:text-primary transition-colors">{mostInfluential.name}</Link>
                    <p className="text-[10px] font-bold text-primary/60 uppercase mt-1">FACTOR DE VICTORIA</p>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-7xl font-black italic leading-none font-bebas text-primary">{mostInfluential.winPercentage}%</span>
                  <div className="text-right">
                    <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest font-oswald mb-1">RÉCORD V-E-D</p>
                    <p className="text-lg font-black italic font-bebas">{mostInfluential.wins}V - {mostInfluential.draws}E - {mostInfluential.losses}D</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-primary" style={{ width: `${mostInfluential.winPercentage}%` }} />
                  </div>
                  <div className="flex items-center gap-2 text-[8px] font-black uppercase text-primary/60 tracking-widest font-oswald italic">
                    <Zap className="h-2 w-2 fill-primary" /> CONSISTENCIA EN {mostInfluential.matchesPlayed} PARTIDOS
                  </div>
                </div>

                <div className="space-y-3 pt-6 border-t border-white/5">
                  {otherInfluential.map((p, idx) => (
                    <div key={p.playerId} className="flex items-center justify-between group">
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] font-black text-muted-foreground/30 w-4 font-oswald">#{idx + 2}</span>
                        <Link href={`/players/${p.playerId}`} className="text-xs font-bold uppercase hover:text-primary transition-colors">{p.name}</Link>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="text-sm font-black italic font-bebas text-primary/80">{p.winPercentage}%</span>
                        <span className="text-[7px] font-bold text-muted-foreground/30 uppercase font-oswald">{p.wins}V - {p.draws}E - {p.losses}D ({p.matchesPlayed} PJ)</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 3. On Fire (Power Ranking) */}
          <div className="bg-[#111827] rounded-2xl p-8 border border-white/5 flex flex-col h-full">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-orange-500">
                <Flame className="h-4 w-4" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] font-oswald">ON FIRE</span>
              </div>
              <Info className="h-3 w-3 text-white/20" />
            </div>
            <p className="text-[8px] font-black uppercase text-muted-foreground/40 tracking-widest font-oswald mb-6">TOP 5 RENDIMIENTO GLOBAL</p>

            <div className="space-y-3 flex-1">
              {topPower.map((p, idx) => (
                <div 
                  key={p.playerId} 
                  className={cn(
                    "bg-white/5 rounded-xl p-3 border border-transparent transition-all flex items-center justify-between",
                    idx === 0 && "border-orange-500/20 bg-orange-500/5"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Avatar className="h-10 w-10 border border-white/10">
                        <AvatarFallback className="text-[10px] font-black">{getInitials(p.name)}</AvatarFallback>
                      </Avatar>
                      <div className="absolute -top-1 -left-1 bg-black w-4 h-4 rounded-full flex items-center justify-center border border-white/10 shadow-lg">
                        <span className="text-[8px] font-black text-white font-oswald">{idx + 1}</span>
                      </div>
                    </div>
                    <div>
                      <Link href={`/players/${p.playerId}`} className="text-xs font-black uppercase italic leading-none hover:text-orange-500 transition-colors">{p.name}</Link>
                      <p className="text-[7px] font-bold text-muted-foreground uppercase mt-1 tracking-widest font-oswald">{p.position || 'COMODÍN'}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xl font-black italic font-bebas text-orange-500 leading-none">{p.powerPoints}</span>
                    <p className="text-[7px] font-bold text-muted-foreground/40 uppercase font-oswald">PTS</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 3. PULSO DE LA COMPETICIÓN */}
      <section className="space-y-6">
        <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground/40 px-1 font-oswald">PULSO DE LA COMPETICIÓN</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link href="/pulse/mvp" className="bg-[#111827] p-8 rounded-2xl border border-white/5 text-center flex flex-col items-center gap-3 hover:border-yellow-500/20 transition-all hover-lift">
            <Star className="h-6 w-6 text-yellow-500" />
            <span className="text-5xl font-black italic font-bebas leading-none">{maxMvpCount}</span>
            <div className="space-y-0.5">
              <p className="text-[10px] font-black uppercase text-white font-oswald tracking-widest">REYES MVP</p>
              <p className="text-[8px] font-bold text-muted-foreground/40 uppercase font-oswald">RÉCORD PREMIOS</p>
            </div>
          </Link>
          <Link href="/pulse/league" className="bg-[#111827] p-8 rounded-2xl border border-white/5 text-center flex flex-col items-center gap-3 hover:border-orange-500/20 transition-all hover-lift">
            <Flame className="h-6 w-6 text-orange-500" />
            <span className="text-5xl font-black italic font-bebas leading-none">{recordGoalsInMatch}</span>
            <div className="space-y-0.5">
              <p className="text-[10px] font-black uppercase text-white font-oswald tracking-widest">RÉCORD GOLES</p>
              <p className="text-[8px] font-bold text-muted-foreground/40 uppercase font-oswald">EN UN PARTIDO</p>
            </div>
          </Link>
          <Link href="/pulse/partnership" className="bg-[#111827] p-8 rounded-2xl border border-white/5 text-center flex flex-col items-center gap-3 hover:border-primary/20 transition-all hover-lift">
            <LinkIcon className="h-6 w-6 text-primary" />
            <span className="text-5xl font-black italic font-bebas leading-none">{societyValue}</span>
            <div className="space-y-0.5">
              <p className="text-[10px] font-black uppercase text-white font-oswald tracking-widest">SOCIEDAD IDEAL</p>
              <p className="text-[8px] font-bold text-muted-foreground/40 uppercase font-oswald truncate max-w-[120px]">{societyText}</p>
            </div>
          </Link>
          <Link href="/pulse/attendance" className="bg-[#111827] p-8 rounded-2xl border border-white/5 text-center flex flex-col items-center gap-3 hover:border-emerald-500/20 transition-all hover-lift">
            <Users className="h-6 w-6 text-emerald-500" />
            <span className="text-5xl font-black italic font-bebas leading-none">{attendanceValue}</span>
            <div className="space-y-0.5">
              <p className="text-[10px] font-black uppercase text-white font-oswald tracking-widest">INFALTABLES</p>
              <p className="text-[8px] font-bold text-muted-foreground/40 uppercase font-oswald">ASISTENCIA</p>
            </div>
          </Link>
        </div>
      </section>

      {/* 4. SALA DE HUMILDAD */}
      <section className="space-y-6">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground/40 font-oswald">SALA DE HUMILDAD</h2>
          <Badge variant="outline" className="text-[7px] font-black uppercase tracking-widest border-white/5 text-muted-foreground/40 font-oswald">FILTRO: MÍNIMO 2 PJ</Badge>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Imán de Derrotas */}
          <Link href="/pulse/iman-derrotas" className="bg-[#111827]/40 rounded-2xl p-6 border border-white/5 space-y-6 hover:border-red-500/20 transition-all hover-lift">
            <div className="flex items-center gap-2 text-red-500/60">
              <Skull className="h-4 w-4" />
              <span className="text-[10px] font-black uppercase tracking-widest font-oswald">IMÁN DE DERROTAS</span>
            </div>
            <div className="space-y-4">
              {imanDerrotas.map(p => (
                <div key={p.playerId} className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-xs font-bold uppercase hover:text-red-500 transition-colors">{p.name}</span>
                    <span className="text-[7px] font-bold text-muted-foreground/40 uppercase tracking-widest font-oswald">{p.wins}V - {p.draws}E - {p.losses}D ({p.matchesPlayed} PJ)</span>
                  </div>
                  <span className="text-xl font-black italic text-red-500/80 font-bebas">{p.losses}</span>
                </div>
              ))}
            </div>
          </Link>

          {/* Deuda de Mando */}
          <Link href="/pulse/deuda-mando" className="bg-[#111827]/40 rounded-2xl p-6 border border-white/5 space-y-6 hover:border-orange-500/20 transition-all hover-lift">
            <div className="flex items-center gap-2 text-orange-500/60">
              <ShieldAlert className="h-4 w-4" />
              <span className="text-[10px] font-black uppercase tracking-widest font-oswald">DEUDA DE MANDO</span>
            </div>
            <div className="space-y-4">
              {deudaMando.map(p => (
                <div key={p.playerId} className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-xs font-bold uppercase hover:text-orange-500 transition-colors">{p.name}</span>
                    <span className="text-[7px] font-bold text-muted-foreground/40 uppercase tracking-widest font-oswald">PJ SIN BRAZALETE</span>
                  </div>
                  <span className="text-xl font-black italic text-orange-500/80 font-bebas">{p.matchesPlayed}</span>
                </div>
              ))}
            </div>
          </Link>

          {/* Pólvora Mojada */}
          <Link href="/pulse/polvora" className="bg-[#111827]/40 rounded-2xl p-6 border border-white/5 space-y-6 hover:border-blue-400/20 transition-all hover-lift">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-blue-400/60">
                <Droplets className="h-4 w-4" />
                <span className="text-[10px] font-black uppercase tracking-widest font-oswald">PÓLVORA MOJADA</span>
              </div>
              <Badge variant="outline" className="text-[6px] font-black bg-blue-400/5 text-blue-400/40 border-none uppercase px-1.5 py-0 font-oswald">SOLO ROLES OFENSIVOS</Badge>
            </div>
            <div className="space-y-4">
              {polvoraMojada.map(p => (
                <div key={p.playerId} className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-xs font-bold uppercase hover:text-blue-400 transition-colors">{p.name}</span>
                    <span className="text-[7px] font-bold text-muted-foreground/40 uppercase tracking-widest font-oswald">{p.totalGoals} GOLES EN {p.matchesPlayed} PJ</span>
                  </div>
                  <span className="text-xl font-black italic text-blue-400/80 font-bebas">{p.goalsPerMatch}</span>
                </div>
              ))}
            </div>
          </Link>
        </div>
      </section>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <React.Suspense fallback={<div className="flex h-[50vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}>
      <DashboardContent />
    </React.Suspense>
  );
}
