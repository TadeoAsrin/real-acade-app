"use client";

import * as React from 'react';
import { useCollection, useMemoFirebase, useFirestore } from "@/firebase";
import { collection, query, orderBy, where } from "firebase/firestore";
import type { Match, Player, AggregatedPlayerStats } from "@/lib/definitions";
import {
  Loader2,
  Flame,
  Target,
  Star,
  Skull,
  Droplets,
  ShieldCheck,
  Brain,
  ArrowRight,
  Crown,
  Trophy,
  Users,
  CalendarDays
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { calculateAggregatedStats, getTopScorerRecord } from "@/lib/data";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getInitials, cn } from "@/lib/utils";
import { PublishedPrevia } from '@/components/previa/published-previa';
import { useSeason } from '@/context/season-context';
import type { LucideIcon } from 'lucide-react';

interface EliteListCardProps {
  title: string;
  icon: LucideIcon;
  players: AggregatedPlayerStats[];
  valueFn: (p: AggregatedPlayerStats) => string | number;
  label: string;
  colorClass: string;
  href: string;
}

function EliteListCard({ title, icon: Icon, players, valueFn, label, colorClass, href }: EliteListCardProps) {
  return (
    <Link href={href} className="group h-full block">
      <div className="bg-[#111827] rounded-2xl p-4 md:p-6 border border-white/[0.06] flex flex-col h-full hover:border-white/15 transition-all hover-lift relative overflow-hidden">
        <div className={cn("flex items-center gap-2 mb-4 md:mb-6", colorClass)}>
          <Icon className="h-4 w-4" />
          <span className="text-[10px] font-semibold uppercase tracking-[0.14em]">{title}</span>
        </div>

        <div className="space-y-3 md:space-y-4 flex-1">
          {players.map((player, idx) => {
            const isFirst = idx === 0;
            return (
              <div key={player.playerId} className={cn(
                "grid grid-cols-[auto_auto_minmax(0,1fr)_auto] items-center gap-x-2 md:gap-x-2.5",
                isFirst ? "pb-3 md:pb-4 border-b border-white/[0.06] mb-3 md:mb-4" : ""
              )}>
                <span className={cn(
                  "text-sm font-bold tabular-nums w-6 shrink-0",
                  isFirst ? colorClass : "text-muted-foreground/40"
                )}>#{idx + 1}</span>

                <div className="relative shrink-0">
                  <Avatar className={cn(
                    isFirst ? "h-9 w-9 md:h-10 md:w-10 border" : "h-7 w-7 md:h-8 md:w-8 border",
                    isFirst ? colorClass.replace('text-', 'border-').concat('/40') : "border-white/10"
                  )}>
                    <AvatarFallback className="bg-white/5 text-white font-bold text-[10px] flex items-center justify-center leading-none">
                      {player.jerseyNumber ?? getInitials(player.name)}
                    </AvatarFallback>
                  </Avatar>
                  {isFirst && (
                    <div className={cn("absolute -top-1 -right-1 rounded-full p-0.5 border-2 border-[#111827]", colorClass.replace('text-', 'bg-'))}>
                      <Star className="h-2 w-2 text-black" />
                    </div>
                  )}
                </div>

                <div className="min-w-0 pr-1">
                  <span className={cn(
                    "font-semibold uppercase block tracking-tight whitespace-nowrap overflow-hidden text-ellipsis",
                    isFirst ? "text-sm text-white" : "text-[10px] text-muted-foreground"
                  )}>{player.name.split(' ')[0]}</span>
                  {isFirst && (
                    <p className="text-[7px] font-medium text-muted-foreground uppercase tracking-[0.08em] leading-tight mt-1 truncate">
                      {player.position || 'Comodín'}
                    </p>
                  )}
                </div>

                <div className="text-right shrink-0 pl-1 whitespace-nowrap">
                  <span className={cn(
                    "font-bold tabular-nums tracking-tight",
                    isFirst ? "text-xl md:text-2xl" : "text-lg md:text-xl text-white/60",
                    isFirst ? colorClass : ""
                  )}>{valueFn(player)}</span>
                  <span className="text-[7px] font-semibold uppercase text-muted-foreground/40 ml-1 tracking-[0.08em]">{label}</span>
                </div>
              </div>
            );
          })}

          {players.length === 0 && (
            <div className="flex flex-col items-center justify-center py-8 opacity-20">
              <Icon className="h-8 w-8 mb-2" />
              <p className="text-[8px] font-semibold uppercase tracking-[0.14em] text-center">Esperando Cracks</p>
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
  const firestore = useFirestore();
  const { selectedSeasonId, loading: seasonLoading } = useSeason();

  const playersQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'players'), orderBy('name', 'asc'));
  }, [firestore]);

  const matchesQuery = useMemoFirebase(() => {
    if (!firestore || !selectedSeasonId) {
      console.log(`[FIRESTORE DIAGNOSTIC] Dashboard: Skipping matchesQuery because firestore=${!!firestore}, selectedSeasonId=${selectedSeasonId}`);
      return null;
    }
    return query(collection(firestore, 'matches'), where('seasonId', '==', selectedSeasonId));
  }, [firestore, selectedSeasonId]);

  const { data: playersData, isLoading: playersLoading } = useCollection<Player>(playersQuery);
  const { data: matchesDataRaw, isLoading: matchesLoading } = useCollection<Match>(matchesQuery);

  const allMatches = React.useMemo(() => {
    if (!matchesDataRaw) return [];
    return [...matchesDataRaw].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [matchesDataRaw]);

  const playedMatches = React.useMemo(() => allMatches.filter(m => m.teamAScore > 0 || m.teamBScore > 0), [allMatches]);
  const lastMatch = playedMatches[0];

  if (seasonLoading || (playersLoading && !playersData)) {
    return (
      <div className="flex h-[80vh] flex-col items-center justify-center gap-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="text-sm font-semibold tracking-wide text-muted-foreground uppercase animate-pulse">Sincronizando Real Acade...</p>
      </div>
    );
  }

  const allPlayers = playersData || [];
  const stats = calculateAggregatedStats(allPlayers, allMatches);

  const MIN_PARTICIPATION_RATE = 0.30;
  const minimumEligibleMatches = Math.max(1, Math.ceil(playedMatches.length * MIN_PARTICIPATION_RATE));

  const topInfluential = [...stats]
    .filter(p => p.matchesPlayed >= minimumEligibleMatches)
    .sort((a, b) => b.winPercentage - a.winPercentage || b.matchesPlayed - a.matchesPlayed)
    .slice(0, 3);

  const topScorers = [...stats]
    .filter(p => p.totalGoals > 0)
    .sort((a, b) => b.totalGoals - a.totalGoals || b.goalsPerMatch - a.goalsPerMatch)
    .slice(0, 3);

  const topStreaks = [...stats]
    .filter(p => p.matchesPlayed >= 1)
    .sort((a, b) => b.bestStreak - a.bestStreak || b.totalGoals - a.totalGoals)
    .slice(0, 3);

  const topPodium = stats
    .filter(p => p.matchesPlayed >= 1)
    .sort((a, b) => (b.wins * 3 + b.draws) - (a.wins * 3 + a.draws) || b.efficiency - a.efficiency || b.goalDifference - a.goalDifference)
    .slice(0, 3);

  const maxMvpCount = stats.length > 0 ? Math.max(...stats.map(p => p.totalMvp), 0) : 0;
  const recordGoalsInMatch = allMatches.length > 0 ? Math.max(...allMatches.map(m => m.teamAScore + m.teamBScore), 0) : 0;
  const { maxGoals: individualRecord, holders: recordHolders } = getTopScorerRecord(allMatches, allPlayers);
  const recordHolderText = recordHolders.length === 0 ? "SIN REGISTROS" : recordHolders.length > 1 ? `${recordHolders[0].name.split(' ')[0]} +${recordHolders.length - 1}` : `HITO: ${recordHolders[0].name.split(' ')[0].toUpperCase()}`;

  const totalPossibleMatches = playedMatches.length;
  const topAttendance = stats.length > 0 ? Math.max(...stats.map(p => p.matchesPlayed), 0) : 0;
  const attendanceValue = totalPossibleMatches > 0 ? `${Math.round((topAttendance / totalPossibleMatches) * 100)}%` : "0%";
  const topAttendancePlayers = stats.filter(p => p.matchesPlayed === topAttendance && p.matchesPlayed > 0);
  const attendanceText = topAttendancePlayers.length === 0 ? "SIN REGISTROS" : `LÍDER: ${topAttendancePlayers[0].name.split(' ')[0].toUpperCase()}${topAttendancePlayers.length > 1 ? ` +${topAttendancePlayers.length - 1}` : ''}`;

  const ordenDeMando = [...stats]
    .filter(p => p.isActive)
    .sort((a, b) => b.captaincyPriorityScore - a.captaincyPriorityScore || b.matchesPlayed - a.matchesPlayed)
    .slice(0, 2);

  return (
    <div className="flex flex-col gap-6 md:gap-10 max-w-7xl mx-auto pb-20 p-4 lg:p-8">
      <div className="fixed inset-0 bg-dot-pattern pointer-events-none opacity-20 z-0" />

      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6">
        <div className="space-y-2">
          <h2 className="text-3xl md:text-4xl lg:text-6xl font-extrabold uppercase tracking-[-0.045em] text-white leading-none">REAL ACADE</h2>
          <p className="text-[9px] lg:text-[11px] font-semibold uppercase tracking-[0.16em] text-primary/65 ml-1">DASHBOARD ESTRATÉGICO</p>
        </div>
      </div>

      <PublishedPrevia />

      {lastMatch && (
        <section className="relative z-10 overflow-hidden rounded-2xl border border-white/[0.08] bg-[#111827]">
          <div className="relative flex min-h-[168px] flex-col items-center justify-center px-5 py-6 text-center md:px-7">
            <div className="mb-4 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
              <span className="text-white/55">Último partido</span>
              {lastMatch.matchNumber && <><span className="text-white/20">·</span><span>Fecha {lastMatch.matchNumber}</span></>}
              <span className="text-white/20">·</span>
              <span className="flex items-center gap-1.5"><CalendarDays className="h-3 w-3" />{new Date(lastMatch.date).toLocaleDateString('es-AR', { timeZone: 'America/Argentina/Cordoba' })}</span>
            </div>

            <div className="flex items-center justify-center gap-4 md:gap-7">
              <div className="flex items-baseline gap-2.5">
                <span className="text-xs font-black uppercase tracking-[0.14em] text-blue-400">Azul</span>
                <span className="text-4xl font-black tabular-nums text-blue-400 md:text-5xl">{lastMatch.teamAScore}</span>
              </div>
              <span className="text-2xl font-light text-white/20">—</span>
              <div className="flex items-baseline gap-2.5">
                <span className="text-4xl font-black tabular-nums text-red-400 md:text-5xl">{lastMatch.teamBScore}</span>
                <span className="text-xs font-black uppercase tracking-[0.14em] text-red-400">Rojo</span>
              </div>
            </div>

            <p className="mt-3 text-xs font-semibold text-slate-400">
              {lastMatch.teamAScore === lastMatch.teamBScore ? 'Partido terminado en empate' : `Ganó ${lastMatch.teamAScore > lastMatch.teamBScore ? 'Azul' : 'Rojo'}`}
            </p>

            <Button asChild variant="ghost" className="mt-4 h-8 border border-white/[0.08] bg-white/[0.025] px-3 text-[11px] font-semibold text-slate-300 hover:bg-white/[0.06] hover:text-white md:absolute md:right-6 md:top-1/2 md:mt-0 md:-translate-y-1/2">
              <Link href={`/matches/${lastMatch.id}`}>Ver partido <ArrowRight className="ml-2 h-3.5 w-3.5" /></Link>
            </Button>
          </div>
        </section>
      )}

      {playedMatches.length > 0 && (
        <>
          <section className="space-y-4 relative z-10">
            <div className="flex items-center gap-3 px-1">
              <ShieldCheck className="h-4 w-4 text-emerald-500" />
              <h2 className="section-kicker text-emerald-500">ORDEN DE MANDO</h2>
              <div className="h-px flex-1 bg-emerald-500/10" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
              {ordenDeMando.map((p, idx) => (
                <Link key={p.playerId} href="/hierarchy" className="group">
                  <div className="bg-[#111827] border border-white/[0.06] rounded-2xl p-4 md:p-5 flex items-center justify-between transition-all hover:border-emerald-500/25 hover:bg-emerald-500/[0.025]">
                    <div className="flex items-center gap-3 md:gap-4">
                      <div className="relative">
                        <Avatar className="h-10 w-10 md:h-12 md:w-12 border border-emerald-500/25">
                          <AvatarFallback className="bg-emerald-500/[0.06] text-emerald-400 font-bold flex items-center justify-center leading-none">{p.jerseyNumber ?? getInitials(p.name)}</AvatarFallback>
                        </Avatar>
                        <div className="absolute -bottom-1 -right-1 bg-emerald-500 rounded-full p-1 shadow-lg ring-2 ring-[#111827]">
                          <Crown className="h-2.5 w-2.5 text-black" />
                        </div>
                      </div>
                      <div>
                        <p className="text-[8px] font-semibold text-emerald-500/60 uppercase tracking-[0.1em] mb-1">CANDIDATO #{idx + 1}</p>
                        <h3 className="text-base md:text-lg font-semibold uppercase text-white group-hover:text-emerald-400 transition-colors leading-none tracking-tight">{p.name}</h3>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-2xl md:text-3xl font-bold tabular-nums text-white leading-none">{p.matchesSinceLastCaptain}</span>
                      <p className="text-[7px] md:text-[8px] font-medium text-muted-foreground/40 uppercase tracking-[0.08em] mt-1">PJ SIN BRAZALETE</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>

          <section className="space-y-4 md:space-y-6 relative z-10">
            <h2 className="section-kicker px-1">ESTRELLAS DE LA ACADEMIA</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
              <EliteListCard title="MÁS INFLUYENTE" icon={Brain} players={topInfluential} valueFn={(p) => `${p.winPercentage}%`} label="WR" colorClass="text-primary" href="/standings" />
              <EliteListCard title="PICHICHI" icon={Target} players={topScorers} valueFn={(p) => p.totalGoals} label="GF" colorClass="text-yellow-500" href="/standings" />
              <EliteListCard title="MEJOR RACHA" icon={Flame} players={topStreaks} valueFn={(p) => p.bestStreak} label="WINS" colorClass="text-orange-500" href="/standings" />
              <EliteListCard title="EL PODIO OFICIAL" icon={Trophy} players={topPodium} valueFn={(p) => p.wins * 3 + p.draws} label="PTS" colorClass="text-yellow-500" href="/standings" />
            </div>
          </section>

          <section className="space-y-4 md:space-y-6 relative z-10">
            <h2 className="section-kicker px-1">PULSO DE LA COMPETICIÓN</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
              <Link href="/standings" className="bg-[#111827] p-5 md:p-8 rounded-2xl border border-white/[0.06] text-center flex flex-col items-center gap-2 md:gap-3 hover-lift">
                <Star className="h-5 w-5 md:h-6 md:w-6 text-yellow-500" />
                <span className="text-4xl md:text-5xl font-bold tabular-nums leading-none text-white">{maxMvpCount}</span>
                <div className="space-y-1">
                  <p className="text-[9px] md:text-[10px] font-semibold uppercase text-white tracking-[0.08em]">REYES MVP</p>
                  <p className="text-[8px] md:text-[10px] font-medium uppercase text-yellow-500/60">RÉCORD PREMIOS</p>
                </div>
              </Link>
              <div className="bg-[#111827] p-5 md:p-8 rounded-2xl border border-white/[0.06] text-center flex flex-col items-center gap-2 md:gap-3 hover-lift">
                <Flame className="h-5 w-5 md:h-6 md:w-6 text-orange-500" />
                <span className="text-4xl md:text-5xl font-bold tabular-nums leading-none text-white">{recordGoalsInMatch}</span>
                <div className="space-y-1">
                  <p className="text-[9px] md:text-[10px] font-semibold uppercase text-white tracking-[0.08em]">RÉCORD GOLES</p>
                  <p className="text-[8px] md:text-[10px] font-medium uppercase text-orange-500/60">EN UN PARTIDO</p>
                </div>
              </div>
              <Link href="/standings" className="bg-[#111827] p-5 md:p-8 rounded-2xl border border-white/[0.06] text-center flex flex-col items-center gap-2 md:gap-3 hover-lift">
                <Target className="h-5 w-5 md:h-6 md:w-6 text-primary" />
                <span className="text-4xl md:text-5xl font-bold tabular-nums leading-none text-white">{individualRecord}</span>
                <div className="space-y-1">
                  <p className="text-[9px] md:text-[10px] font-semibold uppercase text-white tracking-[0.08em]">ARTILLERO SUPREMO</p>
                  <p className="text-[9px] md:text-[11px] font-semibold uppercase text-primary truncate max-w-[120px] md:max-w-[140px]">{recordHolderText}</p>
                </div>
              </Link>
              <Link href="/attendance" className="bg-[#111827] p-5 md:p-8 rounded-2xl border border-white/[0.06] text-center flex flex-col items-center gap-2 md:gap-3 hover-lift">
                <Users className="h-5 w-5 md:h-6 md:w-6 text-emerald-500" />
                <span className="text-4xl md:text-5xl font-bold tabular-nums leading-none text-white">{attendanceValue}</span>
                <div className="space-y-1">
                  <p className="text-[9px] md:text-[10px] font-semibold uppercase text-white tracking-[0.08em]">INFALTABLES</p>
                  <p className="text-[9px] md:text-[11px] font-semibold uppercase text-emerald-500 truncate max-w-[120px] md:max-w-[140px]">{attendanceText}</p>
                </div>
              </Link>
            </div>
          </section>

          <section className="space-y-6 relative z-10 hidden md:block">
            <div className="flex items-center justify-between px-1">
              <h2 className="section-kicker">SALA DE HUMILDAD</h2>
              <Badge variant="outline" className="text-[7px] font-semibold uppercase tracking-[0.08em] border-white/[0.06] text-muted-foreground/40 rounded-lg">FILTRO: MÍNIMO 1 PJ</Badge>
            </div>

            <div className="bg-black/20 backdrop-blur-sm rounded-3xl overflow-hidden border border-white/[0.06]">
              <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-white/[0.06] items-start">
                <div className="p-8 space-y-6">
                  <div className="flex items-center justify-between group">
                    <div className="flex items-center gap-2 text-red-500/60 group-hover:text-red-500 transition-colors">
                      <Skull className="h-4 w-4" />
                      <span className="text-[10px] font-semibold uppercase tracking-[0.08em]">IMÁN DE DERROTAS</span>
                    </div>
                    <Badge variant="outline" className="text-[6px] font-semibold bg-red-500/5 text-red-500/40 border-none uppercase px-1.5 py-0 rounded-md">RATIO DE VULNERABILIDAD</Badge>
                  </div>
                  <div className="space-y-5">
                    {stats.filter(p => p.matchesPlayed >= 1).sort((a, b) => b.lossPercentage - a.lossPercentage).slice(0, 3).map(p => (
                      <div key={p.playerId} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex flex-col">
                            <Link href={`/players/${p.playerId}`} className="text-xs font-semibold uppercase hover:text-red-500 transition-colors leading-none text-white">{p.name}</Link>
                            <span className="text-[7px] font-medium text-muted-foreground/40 uppercase tracking-[0.08em] mt-1">{p.wins}V - {p.draws}E - {p.losses}D</span>
                          </div>
                          <div className="text-right">
                            <span className="text-xl font-bold tabular-nums text-red-500/80">{p.lossPercentage}%</span>
                            <p className="text-[6px] font-semibold uppercase text-red-500/30 tracking-[0.08em]">CAÍDA</p>
                          </div>
                        </div>
                        <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                          <div className="h-full bg-red-900/40" style={{ width: `${p.lossPercentage}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-8 space-y-6">
                  <div className="flex items-center justify-between group">
                    <div className="flex items-center gap-2 text-blue-400/60 group-hover:text-blue-400 transition-colors">
                      <Droplets className="h-4 w-4" />
                      <span className="text-[10px] font-semibold uppercase tracking-[0.08em]">PÓLVORA MOJADA</span>
                    </div>
                    <Badge variant="outline" className="text-[6px] font-semibold bg-blue-400/5 text-blue-400/40 border-none uppercase px-1.5 py-0 rounded-md">SOLO ROLES OFENSIVOS</Badge>
                  </div>
                  <div className="space-y-4">
                    {stats.filter(p => (p.position === 'Mediocampista' || p.position === 'Delantero') && p.matchesPlayed >= 1).sort((a, b) => a.goalsPerMatch - b.goalsPerMatch).slice(0, 3).map(p => (
                      <div key={p.playerId} className="flex items-center justify-between bg-white/[0.035] p-3 rounded-xl border border-transparent hover:border-blue-400/10 transition-all">
                        <div className="flex flex-col">
                          <Link href={`/players/${p.playerId}`} className="text-xs font-semibold uppercase hover:text-blue-400 transition-colors text-white">{p.name}</Link>
                          <span className="text-[7px] font-medium text-muted-foreground/40 uppercase tracking-[0.08em]">{p.totalGoals} GOLES EN {p.matchesPlayed} PJ</span>
                        </div>
                        <div className="text-right">
                          <span className="text-xl font-bold tabular-nums text-blue-400/80">{p.goalsPerMatch}</span>
                          <p className="text-[6px] font-semibold uppercase text-blue-400/30 tracking-[0.08em]">G/PJ</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>
        </>
      )}
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