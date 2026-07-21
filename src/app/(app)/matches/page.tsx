
'use client';

import * as React from 'react';
import { useFirestore, useCollection, useMemoFirebase, useDoc, useUser } from '@/firebase';
import { collection, query, orderBy, where, doc } from 'firebase/firestore';
import type { Match, AppSettings } from '@/lib/definitions';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Goal, Calendar, ChevronRight, Trophy, Info } from 'lucide-react';
import Link from 'next/link';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';

export default function MatchesPage() {
  const firestore = useFirestore();
  const { user } = useUser();

  const settingsRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, 'app_settings', 'global');
  }, [firestore]);

  const { data: settings } = useDoc<AppSettings>(settingsRef);
  const activeSeasonId = settings?.activeSeasonId;

  const adminRoleRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'roles_admin', user.uid);
  }, [firestore, user]);

  const { data: adminRole } = useDoc<{isAdmin: boolean}>(adminRoleRef);
  const isAdmin = adminRole?.isAdmin;

  const matchesRef = useMemoFirebase(() => {
    if (!firestore || !activeSeasonId) return null;
    return query(
      collection(firestore, 'matches'), 
      where('seasonId', '==', activeSeasonId),
      orderBy('date', 'desc')
    );
  }, [firestore, activeSeasonId]);

  const { data: matches, isLoading } = useCollection<Match>(matchesRef);

  return (
    <div className="space-y-8 p-4 lg:p-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <h2 className="text-4xl lg:text-7xl font-black uppercase tracking-tighter italic text-white flex items-center gap-4">
            <Goal className="h-8 w-8 lg:h-14 lg:w-14 text-primary shrink-0" />
            HISTORIAL OFICIAL
          </h2>
          <p className="text-[10px] lg:text-xs font-black uppercase tracking-[0.3em] text-primary/60 ml-1">
            REGISTRO DE BATALLAS • TEMPORADA {activeSeasonId?.substring(0, 8) || '...'}
          </p>
        </div>
        {isAdmin && (
          <Button asChild size="lg" className="h-14 px-8 font-bebas text-xl tracking-widest shadow-lg shadow-primary/20">
            <Link href="/matches/new">
              <Plus className="h-5 w-5 mr-2" />
              REGISTRAR PARTIDO
            </Link>
          </Button>
        )}
      </div>

      {!activeSeasonId && !isLoading && (
        <Card className="competition-card border-orange-500/20 bg-orange-500/5 text-center py-12">
          <Info className="h-12 w-12 text-orange-500 mx-auto mb-4" />
          <CardTitle className="text-orange-500 font-bebas tracking-widest">TEMPORADA NO ACTIVA</CardTitle>
          <CardDescription className="uppercase text-[10px] font-bold">Contacta al administrador para inicializar el ciclo.</CardDescription>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-6">
        {matches?.map((match) => (
          <Link key={match.id} href={`/matches/${match.id}`}>
            <Card className="competition-card official-table-row hover-lift overflow-hidden group">
              <div className="flex flex-col md:flex-row">
                <div className="flex-1 p-6 md:p-8 flex items-center justify-between">
                  <div className="flex flex-col items-center gap-1 w-24">
                    <span className="text-4xl md:text-6xl font-bebas text-primary drop-shadow-[0_0_15px_rgba(59,130,246,0.3)]">{match.teamAScore}</span>
                    <span className="text-[10px] font-black uppercase tracking-widest text-primary/60">AZUL</span>
                  </div>
                  
                  <div className="flex flex-col items-center gap-3">
                    <div className="flex items-center gap-2 text-muted-foreground/40 font-black text-[10px] uppercase tracking-widest">
                       <Calendar className="h-3 w-3" />
                       {format(parseISO(match.date), "dd MMM yyyy", { locale: es })}
                    </div>
                    <div className="h-px w-20 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                    <div className="text-xs font-bebas tracking-[0.4em] text-muted-foreground/20">VERSUS</div>
                  </div>

                  <div className="flex flex-col items-center gap-1 w-24">
                    <span className="text-4xl md:text-6xl font-bebas text-accent drop-shadow-[0_0_15px_rgba(244,63,94,0.3)]">{match.teamBScore}</span>
                    <span className="text-[10px] font-black uppercase tracking-widest text-accent/60">ROJO</span>
                  </div>
                </div>
                
                <div className="bg-white/5 md:w-48 p-6 flex flex-col justify-center gap-4 border-t md:border-t-0 md:border-l border-white/5">
                  <div className="space-y-1">
                     <p className="text-[8px] font-black uppercase text-muted-foreground tracking-widest">CRÓNICA IA</p>
                     <p className="text-[10px] font-bold italic line-clamp-2 text-white/80">
                       {match.aiSummary?.title || "En redacción..."}
                     </p>
                  </div>
                  <Button variant="ghost" size="sm" className="w-full justify-between text-[10px] font-black uppercase tracking-widest hover:bg-white/10">
                    VER FICHA <ChevronRight className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </Card>
          </Link>
        ))}

        {matches?.length === 0 && !isLoading && (
          <div className="text-center py-20 bg-white/5 rounded-3xl border border-dashed border-white/10">
            <Trophy className="h-12 w-12 text-muted-foreground/20 mx-auto mb-4" />
            <p className="font-bebas text-2xl tracking-widest text-muted-foreground uppercase">Aún no hay batallas registradas</p>
          </div>
        )}
      </div>
    </div>
  );
}
