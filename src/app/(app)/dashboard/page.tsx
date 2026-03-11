'use client';

import * as React from 'react';
import { useSearchParams } from 'next/navigation';
import { useCollection, useMemoFirebase, useFirestore } from "@/firebase";
import { collection, query, orderBy } from "firebase/firestore";
import type { Match, Player } from "@/lib/definitions";
import { Loader2, Newspaper, ArrowRight } from "lucide-react";
import { FieldView } from "@/components/dashboard/field-view";
import { PowerRanking } from "@/components/dashboard/power-ranking";
import { GoalsChart } from "@/components/dashboard/goals-chart";
import { MatchNewsModal } from "@/components/dashboard/match-news-modal";
import { MatchAiSummary } from "@/components/matches/match-ai-summary";
import { Button } from "@/components/ui/button";
import Link from "next/link";

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

  // Logic for the news modal (La Voz del Pueblo)
  const forcedMatch = gacetaMatchId ? allMatches.find(m => m.id === gacetaMatchId) : null;
  const matchForModal = forcedMatch || lastMatch;

  // Find winners for the last match to show in the field view
  const lastMatchMvpId = lastMatch?.teamAPlayers.find(p => p.isMvp)?.playerId || lastMatch?.teamBPlayers.find(p => p.isMvp)?.playerId;

  return (
    <div className="flex flex-col gap-8 max-w-7xl mx-auto pb-20">
      {matchForModal && (
        <MatchNewsModal 
          match={matchForModal} 
          allPlayers={allPlayers} 
          forceOpen={!!forcedMatch} 
        />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Last Match Coverage */}
        <div className="lg:col-span-8 space-y-8">
          {lastMatch ? (
            <>
              <div className="flex items-center justify-between px-1">
                <div className="space-y-1">
                  <h2 className="text-2xl font-black italic uppercase tracking-tighter">Última Jornada</h2>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Análisis táctico y crónicas oficiales</p>
                </div>
                <Button asChild variant="outline" className="border-primary/20 bg-primary/5 text-primary hover:bg-primary/10 font-black uppercase italic gap-2">
                  <Link href={`/dashboard?gaceta=${lastMatch.id}`}>
                    <Newspaper className="h-4 w-4" /> TAPA DEL DIARIO
                  </Link>
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FieldView 
                  team="Azul" 
                  players={allPlayers.filter(p => lastMatch.teamAPlayers.some(tp => tp.playerId === p.id))}
                  topScorerId={lastMatchMvpId}
                  date={lastMatch.date}
                />
                <FieldView 
                  team="Rojo" 
                  players={allPlayers.filter(p => lastMatch.teamBPlayers.some(tp => tp.playerId === p.id))}
                  topScorerId={lastMatchMvpId}
                  date={lastMatch.date}
                />
              </div>

              <MatchAiSummary 
                matchId={lastMatch.id} 
                matchData={{
                  date: lastMatch.date,
                  teamAScore: lastMatch.teamAScore,
                  teamBScore: lastMatch.teamBScore,
                  teamAPlayers: lastMatch.teamAPlayers.map(p => ({ name: allPlayers.find(pl => pl.id === p.playerId)?.name || '?', goals: p.goals })),
                  teamBPlayers: lastMatch.teamBPlayers.map(p => ({ name: allPlayers.find(pl => pl.id === p.playerId)?.name || '?', goals: p.goals })),
                  mvpName: allPlayers.find(p => p.id === lastMatchMvpId)?.name
                }} 
              />
            </>
          ) : (
            <div className="h-60 flex flex-col items-center justify-center border-2 border-dashed rounded-3xl opacity-20">
              <p className="font-bold uppercase italic">Sin partidos registrados</p>
            </div>
          )}
          
          <GoalsChart matches={allMatches} />
        </div>

        {/* Right Column: Global Stats */}
        <div className="lg:col-span-4 space-y-8">
          <PowerRanking players={allPlayers} matches={allMatches} />
          
          {/* Quick Access to Stats */}
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'Sociedades', href: '/pulse/partnership', color: 'bg-blue-500' },
              { label: 'Goleadores', href: '/standings?tab=goleadores', color: 'bg-yellow-500' },
              { label: 'Efectividad', href: '/pulse/influencer', color: 'bg-emerald-500' },
              { label: 'Asistencia', href: '/pulse/attendance', color: 'bg-purple-500' },
            ].map((item) => (
              <Link key={item.href} href={item.href}>
                <div className="p-4 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 transition-all group">
                  <p className="text-[10px] font-black uppercase text-muted-foreground group-hover:text-white transition-colors">{item.label}</p>
                  <div className="flex items-center justify-between mt-2">
                    <div className={`h-1 w-8 rounded-full ${item.color}`} />
                    <ArrowRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-all translate-x-[-10px] group-hover:translate-x-0" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
