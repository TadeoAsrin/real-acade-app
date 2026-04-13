"use client";

import * as React from 'react';
import { useSearchParams } from 'next/navigation';
import { useCollection, useMemoFirebase, useFirestore } from "@/firebase";
import { collection, query, orderBy } from "firebase/firestore";
import type { Match, Player, AggregatedPlayerStats } from "@/lib/definitions";
import { 
  Loader2, 
  Newspaper, 
  Trophy, 
  Flame, 
  Target, 
  Users, 
  Link as LinkIcon, 
  Crown, 
  Star, 
  Skull, 
  Droplets, 
  FileText, 
  ShieldCheck, 
  Zap, 
  Brain, 
  TrendingUp,
  ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Link from "next/link";
import { calculateAggregatedStats, getChemistryRankings } from "@/lib/data";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getInitials, cn } from "@/lib/utils";
import { MatchNewsModal } from '@/components/dashboard/match-news-modal';

function HighlightCard({ 
  title, 
  player, 
  icon: Icon, 
  statLabel, 
  statValue, 
  colorClass,
  extraInfo,
  href
}: { 
  title: string, 
  player: AggregatedPlayerStats | undefined, 
  icon: any, 
  statLabel: string, 
  statValue: string | number,
  colorClass: string,
  extraInfo?: React.ReactNode,
  href: string
}) {
  if (!player) return null;

  return (
    <Link href={href} className="group h-full block">
      <div className="bg-[#111827] rounded-2xl p-6 border border-white/5 flex flex-col h-full hover:border-white/20 transition-all hover-lift relative overflow-hidden">
        <div className={cn("flex items-center gap-2 mb-6", colorClass)}>
          <Icon className="h-4 w-4" />
          <span className="text-[10px] font-black uppercase tracking-[0.2em] font-oswald">{title}</span>
        </div>
        
        <div className="flex items-center gap-4 mb-6">
          <div className="relative">
            <Avatar className="h-14 w-14 border-2 border-white/10 group-hover:border-white/20 transition-colors">
              <AvatarFallback className="bg-white/5 text-white font-black text-lg">{getInitials(player.name)}</AvatarFallback>
            </Avatar>
            <div className={cn("absolute -top-1 -right-1 rounded-full p-1 border-2 border-[#111827]", colorClass.replace('text-', 'bg-'))}>
              <Star className="h-2 w-2 text-black" />
            </div>
          </div>
          <div className="min-w-0">
            <span className="text-xl font-black italic uppercase leading-none truncate block text-white">{player.name}</span>
            <p className="text-[8px] font-bold text-muted-foreground uppercase mt-1 tracking-widest">{player.position || 'Comodín'}</p>
          </div>
        </div>

        <div className="mt-auto space-y-4">
          <div className="flex items-baseline gap-2">
            <span className="text-5xl font-black italic leading-none font-bebas text-white">{statValue}</span>
            <span className="text-[8px] font-black uppercase text-muted-foreground tracking-widest font-oswald">{statLabel}</span>
          </div>
          {extraInfo}
        </div>

        <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-40 transition-opacity">
          <ArrowRight className="h-4 w-4 text-white" />
        </div>
      </div>
    </Link>
  );
}

function PodiumCard({ topPlayers }: { topPlayers: AggregatedPlayerStats[] }) {
  return (
    <Link href="/standings?tab=oficial" className="group h-full block">
      <div className="bg-[#111827] rounded-2xl p-6 border border-white/5 flex flex-col h-full hover:border-white/20 transition-all hover-lift relative overflow-hidden">
        <div className="flex items-center gap-2 mb-6 text-yellow-500">
          <Trophy className="h-4 w-4" />
          <span className="text-[10px] font-black uppercase tracking-[0.2em] font-oswald">EL PODIO</span>
        </div>
        
        <div className="space-y-4 flex-1">
          {topPlayers.map((player, idx) => (
            <div key={player.playerId} className={cn(
              "flex items-center justify-between",
              idx === 0 ? "pb-3 border-b border-white/5 mb-3" : ""
            )}>
              <div className="flex items-center gap-3 min-w-0">
                <span className={cn(
                  "font-bebas italic text-lg w-4 shrink-0",
                  idx === 0 ? "text-yellow-500" : "text-muted-foreground/40"
                )}>#{idx + 1}</span>
                <Avatar className={cn(
                  idx === 0 ? "h-10 w-10 border-2 border-yellow-500/50" : "h-8 w-8 border border-white/10"
                )}>
                  <AvatarFallback className="bg-white/5 text-white font-black text-[10px]">
                    {getInitials(player.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <span className={cn(
                    "font-black uppercase italic truncate block",
                    idx === 0 ? "text-xs text-white" : "text-[10px] text-muted-foreground"
                  )}>{player.name.split(' ')[0]}</span>
                </div>
              </div>
              <div className="text-right shrink-0 ml-2">
                <span className={cn(
                  "font-bebas italic",
                  idx === 0 ? "text-2xl text-yellow-500" : "text-lg text-white/60"
                )}>{player.wins * 3 + player.draws}</span>
                <span className="text-[8px] font-black uppercase text-muted-foreground/40 ml-1 font-oswald">PTS</span>
              </div>
            </div>
          ))}
          {topPlayers.length === 0 && (
            <div className="flex flex-col items-center justify-center py-4 opacity-20">
              <Trophy className="h-8 w-8 mb-2" />
              <p className="text-[8px] font-black uppercase tracking-widest text-center">Esperando Clasificados</p>
            </div>
          )}
        </div>

        <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-40 transition-opacity">
          <ArrowRight className="h-4 w-4 text-white" />
        </div>
      </div>
    </Link>
  );
}

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
  
  // Estrellas de la Academia
  const leaderboardStats = stats.filter(p => p.matchesPlayed >= 4);
  const mostInfluential = [...leaderboardStats].sort((a, b) => b.influenceScore - a.influenceScore)[0];
  const topScorer = [...leaderboardStats].sort((a, b) => b.totalGoals - a.totalGoals)[0];
  const bestStreak = [...leaderboardStats].sort((a, b) => b.bestStreak - a.bestStreak)[0];

  // El Podio Oficial (Mínimo 6 partidos)
  const officialPodium = stats
    .filter(p => p.matchesPlayed >= 6)
    .sort((a, b) => 
      (b.wins * 3 + b.draws) - (a.wins * 3 + a.draws) || 
      b.efficiency - a.efficiency || 
      b.totalGoals - a.totalGoals
    )
    .slice(0, 3);

  // Orden de Mando
  const ordenDeMando = [...stats]
    .filter(p => p.totalCaptaincies === 0 && p.isActive)
    .sort((a, b) => b.matchesPlayed - a.matchesPlayed)
    .slice(0, 2);

  // Pulso de la Competición
  const maxMvpCount = stats.length > 0 ? Math.max(...stats.map(p => p.totalMvp), 0) : 0;
  const recordGoalsInMatch = allMatches.length > 0 ? Math.max(...allMatches.map(m => m.teamAScore + m.teamBScore), 0) : 0;
  
  // Tridente de Oro
  const chemistry = getChemistryRankings(allPlayers, allMatches, 1);
  const topTrident = chemistry[0];
  const tridentText = topTrident 
    ? `${topTrident.player1.name.split(' ')[0]} + ${topTrident.player2.name.split(' ')[0]} + ${topTrident.player3.name.split(' ')[0]}` 
    : "SIN TRIDENTES";
  const tridentValue = topTrident ? `${topTrident.winRate}%` : "0%";
  
  // Infaltables
  const totalPossibleMatches = playedMatches.length;
  const topAttendance = stats.length > 0 ? Math.max(...stats.map(p => p.matchesPlayed), 0) : 0;
  const attendanceValue = totalPossibleMatches > 0 ? `${Math.round((topAttendance / totalPossibleMatches) * 100)}%` : "0%";
  
  const topAttendancePlayers = stats.filter(p => p.matchesPlayed === topAttendance && p.matchesPlayed > 0);
  const attendanceLeaderName = topAttendancePlayers.length > 0 
    ? topAttendancePlayers[0].name.split(' ')[0].toUpperCase() 
    : "";
  const attendanceOthersCount = topAttendancePlayers.length - 1;
  const attendanceText = topAttendancePlayers.length === 0 
    ? "SIN REGISTROS" 
    : attendanceOthersCount > 0 
      ? `${attendanceLeaderName} +${attendanceOthersCount}` 
      : `LÍDER: ${attendanceLeaderName}`;

  // Sala de Humildad
  const filteredForHumility = stats.filter(p => p.matchesPlayed >= 2);
  const imanDerrotas = [...filteredForHumility].sort((a, b) => b.lossPercentage - a.lossPercentage).slice(0, 3);
  const polvoraMojada = [...filteredForHumility]
    .filter(p => p.position === 'Mediocampista' || p.position === 'Delantero')
    .sort((a, b) => a.goalsPerMatch - b.goalsPerMatch)
    .slice(0, 3);

  const forcedMatch = gacetaMatchId ? allMatches.find(m => m.id === gacetaMatchId) : null;
  const matchForModal = forcedMatch || (lastMatch?.aiSummary ? lastMatch : null);

  return (
    <div className="flex flex-col gap-10 max-w-7xl mx-auto pb-20">
      <div className="fixed inset-0 bg-dot-pattern pointer-events-none opacity-20 z-0" />

      {matchForModal && (
        <MatchNewsModal 
          match={matchForModal} 
          allPlayers={allPlayers} 
          forceOpen={!!forcedMatch} 
        />
      )}

      {/* 1. HERO SECTION */}
      {lastMatch && (
        <section className="relative z-10">
          <div className="cinematic-banner p-8 md:p-16 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="absolute inset-0 bg-black/40 pointer-events-none" />
            <div className="lg:col-span-8 space-y-8 relative z-10">
              <div className="flex items-center gap-3">
                <Badge className="bg-primary text-primary-foreground font-bebas tracking-widest px-4 py-1.5 text-sm rounded-none shadow-lg shadow-primary/20">EDICIÓN ESPECIAL</Badge>
                <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em] font-oswald">
                  {new Date(lastMatch.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
                </span>
              </div>
              <h1 className="text-5xl md:text-[5.5rem] font-bebas text-white tracking-wider leading-[0.85] uppercase">
                {lastMatch.aiSummary?.title || "CRÓNICA DE LA JORNADA"}
              </h1>
              <p className="text-xl md:text-2xl text-muted-foreground font-lora italic max-w-2xl leading-relaxed">
                {lastMatch.aiSummary?.subtitle || "Exhibición de fútbol y mística en el último encuentro del club."}
              </p>
              <div className="flex flex-wrap gap-4 pt-6">
                <Button asChild size="lg" className="h-16 px-10 font-bebas text-2xl tracking-[0.2em] bg-white text-black hover:bg-white/90 shadow-[0_0_40px_rgba(255,255,255,0.25)] rounded-none transition-all group-hover:px-12">
                  <Link href={`/dashboard?gaceta=${lastMatch.id}`} className="flex items-center gap-3">
                    <Newspaper className="h-6 w-6" /> LEER EL DIARIO
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="border-white/10 hover:bg-white/5 font-black uppercase italic px-10 h-16 text-sm rounded-none text-white">
                  <Link href={`/matches/${lastMatch.id}`} className="flex items-center gap-2">
                    <FileText className="h-5 w-5" /> FICHA TÉCNICA
                  </Link>
                </Button>
              </div>
            </div>
            
            <div className="lg:col-span-4 flex justify-center lg:justify-end relative z-10">
              <div className="bg-black/60 backdrop-blur-xl p-10 rounded-none border border-white/10 shadow-[0_30px_60px_rgba(0,0,0,0.5)] text-center space-y-6 min-w-[280px] transform lg:rotate-3 hover:rotate-0 transition-transform duration-700">
                <p className="text-[10px] font-black uppercase text-white/40 tracking-[0.4em] font-oswald">RESULTADO FINAL</p>
                <div className="flex items-center justify-center gap-8">
                  <div className="flex flex-col items-center">
                    <span className="text-8xl font-bebas text-primary leading-none drop-shadow-[0_0_20px_rgba(59,130,246,0.6)]">{lastMatch.teamAScore}</span>
                    <span className="text-[10px] font-black text-primary uppercase mt-3 tracking-widest font-oswald">AZUL</span>
                  </div>
                  <div className="h-16 w-[1px] bg-white/10" />
                  <div className="flex flex-col items-center">
                    <span className="text-8xl font-bebas text-accent leading-none drop-shadow-[0_0_20px_rgba(244,63,94,0.6)]">{lastMatch.teamBScore}</span>
                    <span className="text-[10px] font-black text-accent uppercase mt-3 tracking-widest font-oswald">ROJO</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 2. ORDEN DE MANDO */}
      <section className="space-y-4 relative z-10">
        <div className="flex items-center gap-3 px-1">
          <ShieldCheck className="h-4 w-4 text-emerald-500" />
          <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-500 font-oswald">ORDEN DE MANDO</h2>
          <div className="h-px flex-1 bg-emerald-500/10" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {ordenDeMando.map((p, idx) => (
            <Link key={p.playerId} href="/pulse/deuda-mando" className="group">
              <div className="bg-[#111827] border border-emerald-500/20 rounded-2xl p-5 flex items-center justify-between transition-all hover:bg-emerald-500/5 hover:border-emerald-500/40">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <Avatar className="h-12 w-12 border-2 border-emerald-500/20">
                      <AvatarFallback className="bg-emerald-500/10 text-emerald-500 font-black">{getInitials(p.name)}</AvatarFallback>
                    </Avatar>
                    <div className="absolute -bottom-1 -right-1 bg-emerald-500 rounded-full p-1 shadow-lg ring-2 ring-[#111827]">
                      <Crown className="h-2.5 w-2.5 text-black" />
                    </div>
                  </div>
                  <div>
                    <p className="text-[8px] font-black text-emerald-500/60 uppercase tracking-widest font-oswald mb-0.5">CANDIDATO #{idx + 1}</p>
                    <h3 className="text-xl font-black italic uppercase text-white group-hover:text-emerald-500 transition-colors leading-none">{p.name}</h3>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-3xl font-black italic font-bebas text-white leading-none">{p.matchesPlayed}</span>
                  <p className="text-[8px] font-black text-muted-foreground/40 uppercase tracking-widest font-oswald">PJ SIN BRAZALETE</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* 3. ESTRELLAS DE LA ACADEMIA */}
      <section className="space-y-6 relative z-10">
        <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground/40 px-1 font-oswald">ESTRELLAS DE LA ACADEMIA</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          <HighlightCard 
            title="MÁS INFLUYENTE"
            player={mostInfluential}
            icon={Brain}
            statLabel="FACTOR"
            statValue="TOP"
            colorClass="text-primary"
            href="/pulse/influencer"
            extraInfo={
              <div className="pt-2 border-t border-white/5 flex justify-between items-center">
                <span className="text-[8px] font-bold text-muted-foreground uppercase">{mostInfluential?.matchesPlayed} PJ</span>
                <span className="text-[8px] font-black text-primary uppercase">{mostInfluential?.winPercentage}% WR</span>
              </div>
            }
          />

          <HighlightCard 
            title="PICHICHI"
            player={topScorer}
            icon={Target}
            statLabel="GOLES"
            statValue={topScorer?.totalGoals || 0}
            colorClass="text-yellow-500"
            href="/standings?tab=goleadores"
          />

          <HighlightCard 
            title="MEJOR RACHA"
            player={bestStreak}
            icon={Flame}
            statLabel="WINS"
            statValue={bestStreak?.bestStreak || 0}
            colorClass="text-orange-500"
            href="/standings?tab=general"
          />

          <PodiumCard topPlayers={officialPodium} />

        </div>
      </section>

      {/* 4. PULSO DE LA COMPETICIÓN */}
      <section className="space-y-6 relative z-10">
        <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground/40 px-1 font-oswald">PULSO DE LA COMPETICIÓN</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link href="/pulse/mvp" className="bg-[#111827] p-8 rounded-2xl border border-white/5 text-center flex flex-col items-center gap-3 hover:border-yellow-500/20 transition-all hover-lift">
            <Star className="h-6 w-6 text-yellow-500" />
            <span className="text-5xl font-black italic font-bebas leading-none text-white">{maxMvpCount}</span>
            <div className="space-y-0.5">
              <p className="text-[10px] font-black uppercase text-white font-oswald tracking-widest">REYES MVP</p>
              <p className="text-[8px] font-bold text-muted-foreground/40 uppercase font-oswald">RÉCORD PREMIOS</p>
            </div>
          </Link>
          <Link href="/pulse/league" className="bg-[#111827] p-8 rounded-2xl border border-white/5 text-center flex flex-col items-center gap-3 hover:border-orange-500/20 transition-all hover-lift">
            <Flame className="h-6 w-6 text-orange-500" />
            <span className="text-5xl font-black italic font-bebas leading-none text-white">{recordGoalsInMatch}</span>
            <div className="space-y-0.5">
              <p className="text-[10px] font-black uppercase text-white font-oswald tracking-widest">RÉCORD GOLES</p>
              <p className="text-[8px] font-bold text-muted-foreground/40 uppercase font-oswald">EN UN PARTIDO</p>
            </div>
          </Link>
          <Link href="/pulse/partnership" className="bg-[#111827] p-8 rounded-2xl border border-white/5 text-center flex flex-col items-center gap-3 hover:border-primary/20 transition-all hover-lift">
            <LinkIcon className="h-6 w-6 text-primary" />
            <span className="text-5xl font-black italic font-bebas leading-none text-white">{tridentValue}</span>
            <div className="space-y-0.5">
              <p className="text-[10px] font-black uppercase text-white font-oswald tracking-widest">TRIDENTE DE ORO</p>
              <p className="text-[8px] font-bold text-muted-foreground/40 uppercase font-oswald truncate max-w-[120px]">{tridentText}</p>
            </div>
          </Link>
          <Link href="/pulse/attendance" className="bg-[#111827] p-8 rounded-2xl border border-white/5 text-center flex flex-col items-center gap-3 hover:border-emerald-500/20 transition-all hover-lift">
            <Users className="h-6 w-6 text-emerald-500" />
            <span className="text-5xl font-black italic font-bebas leading-none text-white">{attendanceValue}</span>
            <div className="space-y-0.5">
              <p className="text-[10px] font-black uppercase text-white font-oswald tracking-widest">INFALTABLES</p>
              <p className="text-[8px] font-bold text-muted-foreground/40 uppercase font-oswald truncate max-w-[120px]">{attendanceText}</p>
            </div>
          </Link>
        </div>
      </section>

      {/* 5. SALA DE HUMILDAD */}
      <section className="space-y-6 relative z-10">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground/40 font-oswald">SALA DE HUMILDAD</h2>
          <Badge variant="outline" className="text-[7px] font-black uppercase tracking-widest border-white/5 text-muted-foreground/40 font-oswald">FILTRO: MÍNIMO 2 PJ</Badge>
        </div>
        
        <Card className="competition-card border-none bg-black/20 backdrop-blur-sm overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-white/5 items-start">
            
            <div className="p-8 space-y-6">
              <Link href="/pulse/iman-derrotas" className="flex items-center justify-between group">
                <div className="flex items-center gap-2 text-red-500/60 group-hover:text-red-500 transition-colors">
                  <Skull className="h-4 w-4" />
                  <span className="text-[10px] font-black uppercase tracking-widest font-oswald">IMÁN DE DERROTAS</span>
                </div>
                <Badge variant="outline" className="text-[6px] font-black bg-red-500/5 text-red-500/40 border-none uppercase px-1.5 py-0 font-oswald">RATIO DE VULNERABILIDAD</Badge>
              </Link>
              <div className="space-y-5">
                {imanDerrotas.map(p => (
                  <div key={p.playerId} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col">
                        <Link href={`/players/${p.playerId}`} className="text-xs font-bold uppercase hover:text-red-500 transition-colors leading-none text-white">{p.name}</Link>
                        <span className="text-[7px] font-bold text-muted-foreground/40 uppercase tracking-widest font-oswald mt-1">{p.wins}V - {p.draws}E - {p.losses}D</span>
                      </div>
                      <div className="text-right">
                        <span className="text-xl font-black italic text-red-500/80 font-bebas">{p.lossPercentage}%</span>
                        <p className="text-[6px] font-black uppercase text-red-500/30 font-oswald tracking-widest">CAÍDA</p>
                      </div>
                    </div>
                    <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-red-900/40 transition-all duration-1000 ease-out" 
                        style={{ width: `${p.lossPercentage}%` }} 
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-8 space-y-6">
              <Link href="/pulse/polvora" className="flex items-center justify-between group">
                <div className="flex items-center gap-2 text-blue-400/60 group-hover:text-blue-400 transition-colors">
                  <Droplets className="h-4 w-4" />
                  <span className="text-[10px] font-black uppercase tracking-widest font-oswald">PÓLVORA MOJADA</span>
                </div>
                <Badge variant="outline" className="text-[6px] font-black bg-blue-400/5 text-blue-400/40 border-none uppercase px-1.5 py-0 font-oswald">SOLO ROLES OFENSIVOS</Badge>
              </Link>
              <div className="space-y-4">
                {polvoraMojada.map(p => (
                  <div key={p.playerId} className="flex items-center justify-between bg-white/5 p-3 rounded-xl border border-transparent hover:border-blue-400/10 transition-all">
                    <div className="flex flex-col">
                      <Link href={`/players/${p.playerId}`} className="text-xs font-bold uppercase hover:text-blue-400 transition-colors text-white">{p.name}</Link>
                      <span className="text-[7px] font-bold text-muted-foreground/40 uppercase tracking-widest font-oswald">{p.totalGoals} GOLES EN {p.matchesPlayed} PJ</span>
                    </div>
                    <div className="text-right">
                      <span className="text-xl font-black italic text-blue-400/80 font-bebas">{p.goalsPerMatch}</span>
                      <p className="text-[6px] font-black uppercase text-blue-400/30 font-oswald tracking-widest">G/PJ</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </Card>
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
