'use client';

import * as React from 'react';
import { calculateAggregatedStats, getChemistryRankings, getSpiciestMatch } from "@/lib/data";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Medal, Loader2, Zap, Calendar, Users, Brain, Crown, Link as LinkIcon, Flame, Target, Trophy, TrendingUp, Star, Skull, Ghost, CloudRain, Frown, Droplets, Newspaper, ChevronRight, Sparkles, ArrowRight, Swords, ShieldAlert } from "lucide-react";
import Link from "next/link";
import { PowerRanking } from "@/components/dashboard/power-ranking";
import { MatchNewsModal } from "@/components/dashboard/match-news-modal";
import { useCollection, useMemoFirebase, useFirestore } from "@/firebase";
import { collection, query, orderBy } from "firebase/firestore";
import type { Match, Player } from "@/lib/definitions";
import { getInitials, cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";

export default function DashboardPage() {
  const firestore = useFirestore();
  const [showGacetaManually, setShowGacetaManually] = React.useState(false);

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
  
  if (allMatches.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] text-center p-6 gap-8">
        <div className="relative">
          <Trophy className="h-32 w-32 text-primary relative z-10" />
        </div>
        <div className="space-y-4 max-w-xl">
          <h1 className="text-5xl font-bebas text-white">¡BIENVENIDO A LA ACADEMIA!</h1>
          <p className="text-muted-foreground text-lg font-oswald uppercase tracking-widest">Plataforma oficial de competición Real Acade.</p>
        </div>
        <div className="flex flex-wrap gap-4 justify-center">
          <Button asChild size="lg" className="h-16 px-10 font-bebas text-xl tracking-widest gap-2">
            <Link href="/matches/new">INICIAR TEMPORADA</Link>
          </Button>
        </div>
      </div>
    );
  }

  const playerStats = calculateAggregatedStats(allPlayers, allMatches);
  const lastMatch = allMatches[0];
  const spiciestMatch = getSpiciestMatch(allMatches);
  const chemistryRankings = getChemistryRankings(allPlayers, allMatches, 1);
  const topChemistry = chemistryRankings[0];

  const sortedByGoals = [...playerStats].sort((a, b) => b.totalGoals - a.totalGoals || b.goalsPerMatch - a.goalsPerMatch);
  const topScorer = sortedByGoals[0];
  const runnersUp = sortedByGoals.slice(1, 5); 

  const sortedByInfluence = [...playerStats]
    .filter(p => p.matchesPlayed > 0)
    .sort((a, b) => b.winPercentage - a.winPercentage || b.matchesPlayed - a.matchesPlayed);
  const influencer = sortedByInfluence[0];
  const influencerRunnersUp = sortedByInfluence.slice(1, 3);

  const mvpLeaders = [...playerStats].sort((a, b) => b.totalMvp - a.totalMvp || b.powerPoints - a.powerPoints).slice(0, 3);
  const totalMatches = allMatches.filter(m => m.teamAScore > 0 || m.teamBScore > 0).length;
  const maxAttendanceRate = totalMatches > 0 ? Math.round((Math.max(...playerStats.map(p => p.matchesPlayed)) / totalMatches) * 100) : 0;

  // Sala de Humildad (MÍNIMO 2 PJ)
  const humilityQualified = playerStats.filter(p => p.matchesPlayed >= 2);
  const imanLeaders = [...humilityQualified].sort((a, b) => b.losses - a.losses || b.matchesPlayed - a.matchesPlayed).slice(0, 3);
  const deudaMandoLeaders = [...humilityQualified].filter(p => p.totalCaptaincies === 0).sort((a, b) => b.matchesPlayed - a.matchesPlayed).slice(0, 3);
  const polvoraLeaders = [...humilityQualified]
    .filter(p => p.position === 'Mediocampista' || p.position === 'Delantero')
    .sort((a, b) => a.goalsPerMatch - b.goalsPerMatch || a.totalGoals - b.totalGoals)
    .slice(0, 3);

  return (
    <div className="flex flex-col gap-12 pb-20 max-w-7xl mx-auto">
      
      {lastMatch && (
        <MatchNewsModal 
          match={lastMatch} 
          allPlayers={allPlayers} 
          forceOpen={showGacetaManually} 
          onClose={() => setShowGacetaManually(false)}
        />
      )}

      {/* PORTADA DE LA GACETA */}
      {lastMatch && (
        <Card className="competition-card border-l-8 border-l-primary relative group hover-lift overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-5">
            <Newspaper className="h-40 w-40 text-white" />
          </div>
          <CardContent className="p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-10 relative z-10">
            <div className="flex-1 space-y-6 text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-3">
                <Badge className="bg-primary text-primary-foreground font-bebas tracking-widest px-3 py-1 text-sm">NUEVA EDICIÓN</Badge>
                <span className="text-xs font-black text-muted-foreground uppercase tracking-[0.2em] font-oswald">
                  {format(parseISO(lastMatch.date), "dd MMMM", { locale: es })}
                </span>
              </div>
              <div className="space-y-3">
                <h2 className="text-5xl md:text-7xl font-bebas text-white tracking-wider leading-[0.9]">
                  {lastMatch.aiSummary?.title || "CRÓNICA DEL ÚLTIMO PARTIDO"}
                </h2>
                <p className="text-xl text-muted-foreground font-oswald uppercase tracking-wide italic max-w-2xl">
                  {lastMatch.aiSummary?.subtitle || "Los detalles de la batalla por la gloria en Real Acade."}
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
                <Button size="lg" onClick={() => setShowGacetaManually(true)} className="font-bebas text-xl tracking-widest h-14 px-8">
                  <Newspaper className="h-5 w-5 mr-2" /> LEER GACETA
                </Button>
                <Button asChild variant="secondary" size="lg" className="h-14 px-8 font-bebas text-xl tracking-widest">
                  <Link href={`/matches/${lastMatch.id}`}>FICHA TÉCNICA</Link>
                </Button>
              </div>
            </div>
            
            <div className="flex flex-col items-center gap-4 min-w-[260px] bg-black/40 p-8 rounded-lg border border-white/5 shadow-2xl">
              <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white/40 font-oswald">FINAL SCORE</span>
              <div className="flex items-center gap-8">
                <div className="flex flex-col items-center">
                  <span className="text-6xl font-bebas text-primary">{lastMatch.teamAScore}</span>
                  <span className="text-[10px] font-black uppercase text-primary font-oswald">AZUL</span>
                </div>
                <div className="h-12 w-[1px] bg-white/10" />
                <div className="flex flex-col items-center">
                  <span className="text-6xl font-bebas text-accent">{lastMatch.teamBScore}</span>
                  <span className="text-[10px] font-black uppercase text-accent font-oswald">ROJO</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ESTRELLAS DE LA ACADEMIA */}
      <section className="space-y-6">
        <h2 className="text-xs font-black uppercase tracking-[0.4em] text-muted-foreground/50 px-1 font-oswald">ESTRELLAS DE LA ACADEMIA</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          
          {/* PICHICHI */}
          <Card className="competition-card border-t-4 border-t-yellow-500 bg-gradient-to-b from-yellow-500/5 to-card hover-lift">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-black uppercase tracking-[0.2em] text-yellow-500 flex items-center gap-2 font-oswald">
                <Trophy className="h-4 w-4" /> CARRERA POR EL PICHICHI
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <Link href={topScorer ? `/players/${topScorer.playerId}` : "/players"} className="group block">
                <div className="flex items-center gap-5">
                  <div className="relative">
                    <Avatar className="h-20 w-20 border-4 border-yellow-500/20 group-hover:border-yellow-500 transition-all">
                      <AvatarFallback className="bg-yellow-500/10 text-yellow-500 text-3xl font-bebas">{getInitials(topScorer?.name || "?")}</AvatarFallback>
                    </Avatar>
                    <div className="absolute -top-2 -right-2 bg-yellow-500 text-yellow-foreground p-1 rounded-full"><Crown className="h-4 w-4" /></div>
                  </div>
                  <div>
                    <h3 className="text-4xl font-bebas text-white group-hover:text-yellow-500 transition-colors uppercase leading-none">{topScorer?.name || '-'}</h3>
                    <p className="text-[10px] font-black text-yellow-500/60 uppercase tracking-widest mt-1 font-oswald">LÍDER ACTUAL</p>
                  </div>
                </div>
                <div className="mt-6 flex flex-col gap-1">
                  <div className="flex items-baseline gap-3">
                    <span className="text-6xl font-bebas text-yellow-500 leading-none">{topScorer?.totalGoals || 0}</span>
                    <span className="text-sm font-black text-muted-foreground uppercase tracking-widest font-oswald">GOLES TOTALES</span>
                  </div>
                  {topScorer && (
                    <div className="flex items-center gap-4 mt-2 py-2 px-3 bg-white/5 rounded-lg border border-white/5">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black text-yellow-500 uppercase font-oswald">PROMEDIO</span>
                        <span className="text-xl font-bebas text-white leading-none">{topScorer.goalsPerMatch} G/PJ</span>
                      </div>
                      <div className="h-6 w-[1px] bg-white/10" />
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black text-muted-foreground uppercase font-oswald">PARTIDOS</span>
                        <span className="text-xl font-bebas text-white leading-none">{topScorer.matchesPlayed} PJ</span>
                      </div>
                    </div>
                  )}
                </div>
              </Link>
              <div className="pt-6 border-t border-white/5 space-y-3">
                {runnersUp.map((runner, idx) => (
                  <div key={runner.playerId} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-3">
                      <span className="text-yellow-500/40 font-bebas">#{idx + 2}</span>
                      <span className="font-bold text-muted-foreground">{runner.name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-bold text-muted-foreground/40 font-oswald uppercase">{runner.goalsPerMatch} G/PJ</span>
                      <span className="font-bebas text-xl text-white/80">{runner.totalGoals}</span>
                    </div>
                  </div>
                ))}
              </div>
              <Button asChild variant="ghost" className="w-full text-[10px] font-black uppercase tracking-widest text-yellow-500 hover:bg-yellow-500/5 mt-4 font-oswald">
                <Link href="/standings?tab=goleadores">VER RANKING COMPLETO <ArrowRight className="ml-2 h-3 w-3" /></Link>
              </Button>
            </CardContent>
          </Card>

          {/* INFLUYENTE */}
          <Card className="competition-card border-t-4 border-t-primary bg-gradient-to-b from-primary/5 to-card hover-lift">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-black uppercase tracking-[0.2em] text-primary flex items-center gap-2 font-oswald">
                <Brain className="h-4 w-4" /> JUGADOR MÁS INFLUYENTE
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <Link href="/pulse/influencer" className="block group">
                <div className="flex items-center gap-5">
                  <Avatar className="h-20 w-20 border-4 border-primary/20 group-hover:border-primary transition-all">
                    <AvatarFallback className="bg-primary/10 text-primary text-3xl font-bebas">{getInitials(influencer?.name || "?")}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-4xl font-bebas text-white group-hover:text-primary uppercase leading-none">{influencer?.name || '-'}</h3>
                    <p className="text-[10px] font-black text-primary/60 uppercase tracking-widest mt-1 font-oswald">FACTOR DE VICTORIA</p>
                  </div>
                </div>
                <div className="mt-6 space-y-4">
                  <div className="flex items-baseline justify-between">
                    <span className="text-6xl font-bebas text-primary leading-none">{influencer?.winPercentage || 0}%</span>
                    <div className="text-right">
                      <span className="text-[10px] font-black text-muted-foreground uppercase block font-oswald">RÉCORD V-E-D</span>
                      <span className="text-xl font-bebas text-white">{influencer?.wins}V - {influencer?.draws}E - {influencer?.losses}D</span>
                    </div>
                  </div>
                  <Progress value={influencer?.winPercentage || 0} className="h-2 bg-white/5" />
                  {influencer && (
                    <div className="flex items-center gap-2 text-[10px] font-black uppercase text-primary/60 font-oswald tracking-widest">
                      <TrendingUp className="h-3 w-3" /> CONSISTENCIA EN {influencer.matchesPlayed} PARTIDOS
                    </div>
                  )}
                </div>
              </Link>
              <div className="pt-6 border-t border-white/5 space-y-3">
                {influencerRunnersUp.map((runner, idx) => (
                  <div key={runner.playerId} className="flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="font-bold text-muted-foreground text-sm">#{idx + 2} {runner.name}</span>
                      <span className="text-[8px] font-black text-muted-foreground/40 uppercase tracking-widest">
                        {runner.wins}V - {runner.draws}E - {runner.losses}D ({runner.matchesPlayed} PJ)
                      </span>
                    </div>
                    <span className="font-bebas text-xl text-primary/80">{runner.winPercentage}%</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="lg:col-span-1 h-full">
            <PowerRanking players={allPlayers} matches={allMatches} />
          </div>
        </div>
      </section>

      {/* PULSO DE LA LIGA */}
      <section className="space-y-6">
        <h2 className="text-xs font-black uppercase tracking-[0.4em] text-muted-foreground/50 px-1 font-oswald">PULSO DE LA COMPETICIÓN</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { label: "REYES MVP", value: mvpLeaders[0]?.totalMvp || 0, sub: "Premios", icon: Star, color: "text-yellow-500", href: "/pulse/mvp" },
            { label: "RÉCORD GOLES", value: spiciestMatch ? spiciestMatch.teamAScore + spiciestMatch.teamBScore : 0, sub: "En un partido", icon: Flame, color: "text-orange-500", href: "/pulse/league" },
            { 
              label: "SOCIEDAD IDEAL", 
              value: topChemistry ? `${topChemistry.winRate}%` : "0%", 
              sub: topChemistry ? `${topChemistry.player1.name.split(' ')[0]} + ${topChemistry.player2.name.split(' ')[0]}` : "Analizando...", 
              icon: LinkIcon, 
              color: "text-primary", 
              href: "/pulse/partnership" 
            },
            { label: "INFALTABLES", value: `${maxAttendanceRate}%`, sub: "Asistencia", icon: Users, color: "text-emerald-500", href: "/pulse/attendance" }
          ].map((item, i) => (
            <Link key={i} href={item.href}>
              <Card className="competition-card hover-lift h-full border-b-2 border-transparent hover:border-white/10">
                <CardContent className="p-6 flex flex-col items-center text-center gap-4">
                  <item.icon className={cn("h-8 w-8", item.color)} />
                  <div className="space-y-1">
                    <p className="text-4xl font-bebas text-white uppercase">{item.value}</p>
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground font-oswald">{item.label}</p>
                    <p className="text-[8px] uppercase font-bold text-muted-foreground/40 font-oswald truncate max-w-[140px]">{item.sub}</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {/* SALA DE HUMILDAD */}
      <section className="space-y-6">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-xs font-black uppercase tracking-[0.4em] text-muted-foreground/50 font-oswald">SALA DE HUMILDAD</h2>
          <Badge variant="outline" className="text-[8px] font-black uppercase border-white/10 text-muted-foreground/40">FILTRO: MÍNIMO 2 PJ</Badge>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { 
              label: "IMÁN DE DERROTAS", 
              data: imanLeaders, 
              icon: Skull, 
              valueFn: (p: any) => p.losses, 
              subFn: (p: any) => `${p.wins}V - ${p.draws}E - ${p.losses}D (${p.matchesPlayed} PJ)`,
              href: "/pulse/iman-derrotas" 
            },
            { 
              label: "DEUDA DE MANDO", 
              data: deudaMandoLeaders, 
              icon: ShieldAlert, 
              valueFn: (p: any) => p.matchesPlayed, 
              subFn: () => "PJ SIN BRAZALETE",
              href: "/pulse/deuda-mando" 
            },
            { 
              label: "PÓLVORA MOJADA", 
              data: polvoraLeaders, 
              icon: Droplets, 
              valueFn: (p: any) => p.goalsPerMatch, 
              subFn: (p: any) => `${p.totalGoals} GOLES EN ${p.matchesPlayed} PJ`,
              href: "/pulse/polvora", 
              subLabel: "SOLO ROLES OFENSIVOS" 
            }
          ].map((sec, i) => (
            <Link key={i} href={sec.href}>
              <Card className="competition-card border-t border-white/5 bg-surface-900/50 hover-lift h-full">
                <CardHeader className="pb-4">
                  <CardTitle className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground flex items-center justify-between font-oswald">
                    <div className="flex items-center gap-2">
                      <sec.icon className="h-3 w-3" /> {sec.label}
                    </div>
                    {sec.subLabel && (
                      <span className="text-[7px] font-bold bg-white/5 px-1.5 py-0.5 rounded text-white/40">{sec.subLabel}</span>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {sec.data.length > 0 ? sec.data.map((p, idx) => (
                    <div key={idx} className="flex flex-col gap-1 border-b border-white/5 pb-2 last:border-0 last:pb-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-muted-foreground/60">{p.name}</span>
                        <span className="font-bebas text-xl text-white">
                          {sec.valueFn(p)}
                        </span>
                      </div>
                      <span className="text-[7px] font-black text-muted-foreground/30 uppercase tracking-widest">{sec.subFn(p)}</span>
                    </div>
                  )) : (
                    <p className="text-[10px] italic text-muted-foreground/30 text-center py-4">Sin datos suficientes (Mín. 2 PJ)</p>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
