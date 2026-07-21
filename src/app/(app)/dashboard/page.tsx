'use client';

import * as React from 'react';
import { useFirestore, useCollection, useMemoFirebase, useDoc } from '@/firebase';
import { collection, query, orderBy, where, doc } from 'firebase/firestore';
import type { Player, Match, AppSettings } from '@/lib/definitions';
import { PowerRanking } from '@/components/dashboard/power-ranking';
import { GoalsChart } from '@/components/dashboard/goals-chart';
import { FieldView } from '@/components/dashboard/field-view';
import { MatchNewsModal } from '@/components/dashboard/match-news-modal';
import { LayoutDashboard, Loader2, History, Star } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

export default function DashboardPage() {
  const firestore = useFirestore();

  const settingsRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, 'app_settings', 'global');
  }, [firestore]);

  const { data: settings, isLoading: settingsLoading } = useDoc<AppSettings>(settingsRef);
  const activeSeasonId = settings?.activeSeasonId;

  const matchesRef = useMemoFirebase(() => {
    if (!firestore || !activeSeasonId) return null;
    return query(
      collection(firestore, 'matches'), 
      where('seasonId', '==', activeSeasonId),
      orderBy('date', 'desc')
    );
  }, [firestore, activeSeasonId]);

  const playersRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'players'), orderBy('name', 'asc'));
  }, [firestore]);

  const { data: matches, isLoading: matchesLoading } = useCollection<Match>(matchesRef);
  const { data: players, isLoading: playersLoading } = useCollection<Player>(playersRef);

  const lastMatch = matches?.[0];
  const isLoading = settingsLoading || matchesLoading || playersLoading;

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="font-bebas text-xl tracking-widest text-muted-foreground uppercase">Sincronizando con el vestuario...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-4 lg:p-8 animate-in fade-in duration-700">
      <div className="space-y-1">
        <h2 className="text-4xl lg:text-7xl font-black uppercase tracking-tighter italic text-white flex items-center gap-4">
          <LayoutDashboard className="h-8 w-8 lg:h-14 lg:w-14 text-primary shrink-0" />
          RESUMEN DE TEMPORADA
        </h2>
        <p className="text-[10px] lg:text-xs font-black uppercase tracking-[0.4em] text-primary/60 ml-1">
          ESTADÍSTICAS OFICIALES • REAL ACADE
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {lastMatch ? (
            <FieldView 
              team={lastMatch.teamAScore >= lastMatch.teamBScore ? 'Azul' : 'Rojo'}
              players={players?.filter(p => [...lastMatch.teamAPlayers, ...lastMatch.teamBPlayers].some(s => s.playerId === p.id)) || []}
              date={lastMatch.date}
            />
          ) : (
            <Card className="competition-card flex flex-col items-center justify-center py-20 text-center border-dashed border-white/10">
                <History className="h-12 w-12 text-muted-foreground/20 mb-4" />
                <CardTitle className="text-muted-foreground font-bebas tracking-widest uppercase">Sin partidos registrados</CardTitle>
                <CardDescription className="text-[10px] uppercase font-bold">Carga el primer encuentro de la temporada.</CardDescription>
            </Card>
          )}
          <GoalsChart matches={matches || []} />
        </div>

        <div className="space-y-8">
          <PowerRanking players={players || []} matches={matches || []} />
          <Card className="competition-card bg-primary/5 border-primary/20">
            <CardHeader>
              <CardTitle className="text-lg font-bebas tracking-widest flex items-center gap-2">
                <Star className="h-5 w-5 text-primary" />
                SISTEMA DE ÉLITE
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground leading-relaxed italic">
                Bienvenido al Panel de Control. Aquí puedes seguir tu rendimiento, ver las crónicas de la IA y analizar el Power Ranking en tiempo real.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {lastMatch && players && (
        <MatchNewsModal match={lastMatch} allPlayers={players} />
      )}
    </div>
  );
}
