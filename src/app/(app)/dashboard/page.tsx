'use client';

import * as React from 'react';
import { calculateAggregatedStats } from "@/lib/data";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Loader2, Trophy, Flame, Target, Crown, ChevronRight, Calendar, Newspaper, Zap, Swords } from "lucide-react";
import Link from "next/link";
import { useCollection, useMemoFirebase, useFirestore } from "@/firebase";
import { collection, query, orderBy } from "firebase/firestore";
import type { Match, Player } from "@/lib/definitions";
import { getInitials, cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";

export default function DashboardPage() {
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
  
  if (allMatches.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] text-center p-6 gap-6">
        <Trophy className="h-20 w-20 text-muted-foreground/20" />
        <h1 className="text-3xl font-bold">¡BIENVENIDO A REAL ACADE!</h1>
        <p className="text-muted-foreground">Todavía no hay partidos registrados en la temporada.</p>
        <Button asChild size="lg">
          <Link href="/matches/new">CARGAR PRIMER PARTIDO</Link>
        </Button>
      </div>
    );
  }

  const lastMatch = allMatches[0];
  const playerStats = calculateAggregatedStats(allPlayers, allMatches);
  const topRanking = [...playerStats].sort((a, b) => b.totalGoals - a.totalGoals).slice(0, 5);

  // Highlights from latest match
  const mvpId = lastMatch.teamAPlayers.find(p => p.isMvp)?.playerId || lastMatch.teamBPlayers.find(p => p.isMvp)?.playerId;
  const bestGoalId = lastMatch.teamAPlayers.find(p => p.hasBestGoal)?.playerId || lastMatch.teamBPlayers.find(p => p.hasBestGoal)?.playerId;
  
  const mvpName = allPlayers.find(p => p.id === mvpId)?.name;
  const bestGoalName = allPlayers.find(p => p.id === bestGoalId)?.name;

  // Tightest match logic
  const tightestMatch = [...allMatches]
    .filter(m => m.teamAScore > 0 || m.teamBScore > 0)
    .sort((a, b) => Math.abs(a.teamAScore - a.teamBScore) - Math.abs(b.teamAScore - b.teamBScore))[0];

  return (
    <div className="flex flex-col gap-10 max-w-5xl mx-auto pb-20">
      
      {/* 1️⃣ MATCH OF THE DAY (Hero Section) */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 px-1">
          <Flame className="h-5 w-5 text-orange-500" />
          <h2 className="text-sm font-black uppercase tracking-widest text-muted-foreground">PARTIDO DE HOY</h2>
        </div>
        <Card className="competition-card sports-gradient border-none relative group hover:scale-[1.01] transition-transform duration-300">
          <CardContent className="p-8 md:p-12 flex flex-col items-center gap-8 text-white">
            <div className="flex items-center gap-2 bg-black/20 px-4 py-1.5 rounded-full backdrop-blur-md">
              <span className="text-[10px] font-black tracking-widest uppercase opacity-80">
                {format(parseISO(lastMatch.date), "eeee d 'de' MMMM", { locale: es })}
              </span>
            </div>
            
            <div className="flex items-center justify-center gap-8 md:gap-16 w-full">
              <div className="flex flex-col items-center gap-3 flex-1 text-right">
                <div className="h-16 w-16 md:h-20 md:w-20 rounded-full bg-white/10 flex items-center justify-center border border-white/20 shadow-2xl">
                  <span className="text-2xl font-black italic">AZ</span>
                </div>
                <span className="text-xl md:text-3xl font-bold tracking-tighter uppercase italic">AZUL</span>
              </div>

              <div className="flex items-center gap-4 md:gap-8">
                <span className="text-6xl md:text-8xl font-black score-display drop-shadow-[0_0_20px_rgba(255,255,255,0.3)]">{lastMatch.teamAScore}</span>
                <span className="text-2xl md:text-4xl font-light opacity-30 italic">—</span>
                <span className="text-6xl md:text-8xl font-black score-display drop-shadow-[0_0_20px_rgba(255,255,255,0.3)]">{lastMatch.teamBScore}</span>
              </div>

              <div className="flex flex-col items-center gap-3 flex-1 text-left">
                <div className="h-16 w-16 md:h-20 md:w-20 rounded-full bg-white/10 flex items-center justify-center border border-white/20 shadow-2xl">
                  <span className="text-2xl font-black italic">RO</span>
                </div>
                <span className="text-xl md:text-3xl font-bold tracking-tighter uppercase italic">ROJO</span>
              </div>
            </div>

            <Button asChild variant="secondary" className="h-12 px-10 font-bold uppercase tracking-widest rounded-full bg-white text-blue-700 hover:bg-white/90">
              <Link href={`/matches/${lastMatch.id}`}>VER PARTIDO</Link>
            </Button>
          </CardContent>
        </Card>
      </section>

      <div className="sports-separator">
        <span>────────</span>
        <Zap className="h-4 w-4" />
        <span>────────</span>
      </div>

      {/* 2️⃣ HIGHLIGHTS OF THE WEEK */}
      <section className="space-y-6">
        <div className="flex items-center gap-2 px-1">
          <Zap className="h-5 w-5 text-yellow-500" />
          <h2 className="text-sm font-black uppercase tracking-widest text-muted-foreground">LO MEJOR DE LA FECHA</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="competition-card hover-lift">
            <CardContent className="p-6 flex flex-col items-center text-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-yellow-500/10 flex items-center justify-center">
                <Crown className="h-6 w-6 text-yellow-500" />
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">MVP</p>
                <p className="text-lg font-bold italic uppercase">{mvpName || 'N/A'}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="competition-card goal-gradient border-none hover-lift">
            <CardContent className="p-6 flex flex-col items-center text-center gap-4 text-white">
              <div className="h-12 w-12 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-md">
                <Target className="h-6 w-6 text-white" />
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-black uppercase opacity-70 tracking-widest">GOL DE LA FECHA</p>
                <p className="text-lg font-bold italic uppercase">{bestGoalName || 'N/A'}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="competition-card hover-lift">
            <CardContent className="p-6 flex flex-col items-center text-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Swords className="h-6 w-6 text-primary" />
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">PARTIDO MÁS PAREJO</p>
                <p className="text-lg font-bold italic uppercase">
                  {tightestMatch ? `${tightestMatch.teamAScore}-${tightestMatch.teamBScore}` : 'N/A'}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* 3️⃣ RANKING PREVIEW */}
      <section className="space-y-6">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            <h2 className="text-sm font-black uppercase tracking-widest text-muted-foreground">RANKING</h2>
          </div>
          <Button variant="link" asChild className="text-primary font-bold uppercase text-[10px] tracking-widest">
            <Link href="/standings">VER TABLA COMPLETA</Link>
          </Button>
        </div>
        <Card className="competition-card p-2">
          <div className="divide-y divide-white/5">
            {topRanking.map((player, index) => (
              <Link key={player.playerId} href={`/players/${player.playerId}`}>
                <div className="p-4 flex items-center justify-between hover:bg-white/5 transition-colors rounded-lg group">
                  <div className="flex items-center gap-4">
                    <span className={cn(
                      "w-8 text-center font-black italic text-xl",
                      index === 0 ? "text-yellow-500" : index === 1 ? "text-gray-400" : index === 2 ? "text-amber-700" : "text-muted-foreground/30"
                    )}>
                      {index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : `${index + 1}`}
                    </span>
                    <Avatar className="h-10 w-10 border-2 border-white/5">
                      <AvatarFallback className="bg-surface-900 font-bold">{getInitials(player.name)}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <span className="font-bold uppercase italic tracking-tighter group-hover:text-primary transition-colors">{player.name}</span>
                      <span className="text-[8px] font-black text-muted-foreground uppercase">{player.position || 'COMODÍN'}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xl font-black italic">{player.totalGoals}</span>
                    <p className="text-[8px] font-black text-muted-foreground uppercase">GOLES</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </Card>
      </section>

      {/* 4️⃣ RECENT MATCHES */}
      <section className="space-y-6">
        <div className="flex items-center gap-2 px-1">
          <Calendar className="h-5 w-5 text-primary" />
          <h2 className="text-sm font-black uppercase tracking-widest text-muted-foreground">ÚLTIMOS PARTIDOS</h2>
        </div>
        <div className="space-y-3">
          {allMatches.slice(1, 6).map((match) => (
            <Link key={match.id} href={`/matches/${match.id}`}>
              <Card className="competition-card hover:border-primary/20 transition-all">
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4 text-[10px] font-black text-muted-foreground uppercase w-32">
                    {format(parseISO(match.date), "dd MMM", { locale: es })}
                  </div>
                  <div className="flex-1 flex items-center justify-center gap-6">
                    <span className="font-bold text-sm uppercase italic w-20 text-right">AZUL</span>
                    <div className="bg-surface-900 px-4 py-1.5 rounded-md border border-white/5 flex items-center gap-3 font-black text-xl italic min-w-[100px] justify-center">
                      <span className="text-primary">{match.teamAScore}</span>
                      <span className="opacity-20">—</span>
                      <span className="text-accent">{match.teamBScore}</span>
                    </div>
                    <span className="font-bold text-sm uppercase italic w-20 text-left">ROJO</span>
                  </div>
                  <div className="w-32 flex justify-end">
                    <ChevronRight className="h-4 w-4 text-muted-foreground/30" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>

    </div>
  );
}
