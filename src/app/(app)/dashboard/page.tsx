"use client";

import * as React from 'react';
import { useSearchParams } from 'next/navigation';
import { useCollection, useMemoFirebase, useFirestore } from "@/firebase";
import { collection, query, orderBy } from "firebase/firestore";
import type { Match, Player } from "@/lib/definitions";
import { Loader2, Newspaper, ArrowRight, Trophy, Zap, Flame, Target, Users, Link as LinkIcon, Crown, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { calculateAggregatedStats } from "@/lib/data";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getInitials, cn } from "@/lib/utils";
import { MatchNewsModal } from '@/components/dashboard/match-news-modal';

export default function DashboardPage() {
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
  const lastMatch = allMatches[0];
  const stats = calculateAggregatedStats(allPlayers, allMatches);

  // Stats for the visual cards
  const topScorer = [...stats].sort((a, b) => b.totalGoals - a.totalGoals)[0];
  const mostInfluential = [...stats].filter(p => p.matchesPlayed >= 3).sort((a, b) => b.winPercentage - a.winPercentage)[0];
  const topPower = [...stats].sort((a, b) => b.powerPoints - a.powerPoints).slice(0, 5);

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

      {/* 1. HERO SECTION - NEWS CARD */}
      <section>
        {lastMatch ? (
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
                  <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">FINAL SCORE</p>
                  <div className="flex items-center justify-center gap-6">
                    <div className="flex flex-col items-center">
                      <span className="text-6xl font-black italic text-primary leading-none">{lastMatch.teamAScore}</span>
                      <span className="text-[8px] font-bold text-primary/60 uppercase mt-2">AZUL</span>
                    </div>
                    <div className="h-10 w-[1px] bg-white/10" />
                    <div className="flex flex-col items-center">
                      <span className="text-6xl font-black italic text-accent leading-none">{lastMatch.teamBScore}</span>
                      <span className="text-[8px] font-bold text-accent/60 uppercase mt-2">ROJO</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="h-60 rounded-3xl border-2 border-dashed border-white/5 flex items-center justify-center italic opacity-20">
            Sin partidos registrados
          </div>
        )}
      </section>

      {/* 2. ESTRELLAS DE LA ACADEMIA */}
      <section className="space-y-6">
        <h2 className="text-xs font-black uppercase tracking-[0.3em] text-muted-foreground/40 px-1">ESTRELLAS DE LA ACADEMIA</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Pichichi */}
          <div className="bg-[#111827] rounded-3xl p-8 border border-white/5 relative overflow-hidden group">
            <div className="absolute -top-4 -right-4 opacity-5 group-hover:scale-110 transition-transform duration-500">
              <Target className="h-32 w-32" />
            </div>
            <div className="space-y-6 relative z-10">
              <div className="flex items-center gap-2 text-yellow-500">
                <Trophy className="h-4 w-4" />
                <span className="text-[10px] font-black uppercase tracking-widest">CARRERA POR EL PICHICHI</span>
              </div>
              {topScorer && (
                <>
                  <div className="flex items-center gap-4">
                    <Avatar className="h-16 w-16 border-2 border-yellow-500/20">
                      <AvatarFallback className="bg-yellow-500/10 text-yellow-500 font-black text-xl">{getInitials(topScorer.name)}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <span className="text-2xl font-black italic uppercase leading-none">{topScorer.name}</span>
                      <span className="text-[10px] font-bold text-muted-foreground mt-1 uppercase">LÍDER ACTUAL</span>
                    </div>
                  </div>
                  <div className="flex items-end gap-2">
                    <span className="text-6xl font-black italic leading-none">{topScorer.totalGoals}</span>
                    <span className="text-sm font-black uppercase text-muted-foreground pb-1 tracking-widest">GOLES TOTALES</span>
                  </div>
                  <div className="pt-4 grid grid-cols-2 gap-4">
                    <div className="bg-[#0b1220] p-3 rounded-xl border border-white/5 text-center">
                      <p className="text-[8px] font-bold text-muted-foreground uppercase">PROMEDIO</p>
                      <p className="text-lg font-black italic">{topScorer.goalsPerMatch} G/PJ</p>
                    </div>
                    <div className="bg-[#0b1220] p-3 rounded-xl border border-white/5 text-center">
                      <p className="text-[8px] font-bold text-muted-foreground uppercase">PARTIDOS</p>
                      <p className="text-lg font-black italic">{topScorer.matchesPlayed} PJ</p>
                    </div>
                  </div>
                </>
              )}
              <Button asChild variant="link" className="text-[10px] font-black uppercase tracking-widest text-primary p-0 h-auto">
                <Link href="/standings?tab=goleadores" className="flex items-center gap-2">VER RANKING COMPLETO <ArrowRight className="h-3 w-3" /></Link>
              </Button>
            </div>
          </div>

          {/* Influencial */}
          <div className="bg-[#111827] rounded-3xl p-8 border border-white/5 relative overflow-hidden group">
            <div className="absolute -top-4 -right-4 opacity-5 group-hover:scale-110 transition-transform duration-500">
              <Zap className="h-32 w-32 text-primary" />
            </div>
            <div className="space-y-6 relative z-10">
              <div className="flex items-center gap-2 text-primary">
                <Users className="h-4 w-4" />
                <span className="text-[10px] font-black uppercase tracking-widest">JUGADOR MÁS INFLUYENTE</span>
              </div>
              {mostInfluential && (
                <>
                  <div className="flex items-center gap-4">
                    <Avatar className="h-16 w-16 border-2 border-primary/20">
                      <AvatarFallback className="bg-primary/10 text-primary font-black text-xl">{getInitials(mostInfluential.name)}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <span className="text-2xl font-black italic uppercase leading-none">{mostInfluential.name}</span>
                      <span className="text-[10px] font-bold text-muted-foreground mt-1 uppercase">FACTOR DE VICTORIA</span>
                    </div>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-6xl font-black italic leading-none text-primary">{mostInfluential.winPercentage}%</span>
                    <div className="flex items-center gap-2 mt-4 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                      <span>RÉCORD: {mostInfluential.wins}V - {mostInfluential.draws}E - {mostInfluential.losses}D</span>
                    </div>
                  </div>
                  <div className="pt-6">
                    <div className="h-1.5 w-full bg-[#0b1220] rounded-full overflow-hidden">
                      <div className="h-full bg-primary" style={{ width: `${mostInfluential.winPercentage}%` }} />
                    </div>
                    <p className="text-[8px] font-bold text-muted-foreground mt-2 uppercase">CONSISTENCIA EN {mostInfluential.matchesPlayed} PARTIDOS</p>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* On Fire (Ranking) */}
          <div className="bg-[#111827] rounded-3xl p-8 border border-white/5">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2 text-orange-500">
                <Flame className="h-4 w-4" />
                <span className="text-[10px] font-black uppercase tracking-widest">ON FIRE</span>
              </div>
            </div>
            <div className="space-y-4">
              {topPower.map((p, i) => (
                <div key={p.playerId} className="flex items-center justify-between group">
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-black text-muted-foreground/30 w-4">{i + 1}</span>
                    <Avatar className="h-8 w-8 border border-white/5">
                      <AvatarFallback className="text-[8px] font-bold">{getInitials(p.name)}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <Link href={`/players/${p.playerId}`} className="text-xs font-black uppercase tracking-tight group-hover:text-orange-500 transition-colors">{p.name}</Link>
                      <span className="text-[7px] font-bold text-muted-foreground uppercase tracking-widest">{p.position || 'COMODÍN'}</span>
                    </div>
                  </div>
                  <span className="text-lg font-black italic text-orange-500">{p.powerPoints}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 3. PULSO DE LA COMPETICIÓN */}
      <section className="space-y-6">
        <h2 className="text-xs font-black uppercase tracking-[0.3em] text-muted-foreground/40 px-1">PULSO DE LA COMPETICIÓN</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-[#111827] p-6 rounded-2xl border border-white/5 text-center flex flex-col items-center gap-2">
            <Star className="h-5 w-5 text-yellow-500" />
            <span className="text-3xl font-black italic">{stats.reduce((acc, p) => acc + p.totalMvp, 0)}</span>
            <span className="text-[8px] font-black uppercase text-muted-foreground tracking-widest">REYES MVP</span>
          </div>
          <div className="bg-[#111827] p-6 rounded-2xl border border-white/5 text-center flex flex-col items-center gap-2">
            <Flame className="h-5 w-5 text-orange-500" />
            <span className="text-3xl font-black italic">{Math.max(...allMatches.map(m => m.teamAScore + m.teamBScore), 0)}</span>
            <span className="text-[8px] font-black uppercase text-muted-foreground tracking-widest">RÉCORD GOLES</span>
          </div>
          <div className="bg-[#111827] p-6 rounded-2xl border border-white/5 text-center flex flex-col items-center gap-2">
            <LinkIcon className="h-5 w-5 text-primary" />
            <span className="text-3xl font-black italic">100%</span>
            <span className="text-[8px] font-black uppercase text-muted-foreground tracking-widest">SOCIEDAD IDEAL</span>
          </div>
          <div className="bg-[#111827] p-6 rounded-2xl border border-white/5 text-center flex flex-col items-center gap-2">
            <Users className="h-5 w-5 text-emerald-500" />
            <span className="text-3xl font-black italic">100%</span>
            <span className="text-[8px] font-black uppercase text-muted-foreground tracking-widest">INFALTABLES</span>
          </div>
        </div>
      </section>
    </div>
  );
}
