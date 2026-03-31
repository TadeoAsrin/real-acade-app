'use client';

import * as React from 'react';
import { useParams } from "next/navigation";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Player, Match } from "@/lib/definitions";
import { Star, Loader2, Share2, Pencil, ChevronLeft, Trophy, Goal, Sparkles, Crown, Newspaper, ArrowRight, PlayCircle } from "lucide-react";
import { useDoc, useCollection, useMemoFirebase, useFirestore, useUser } from "@/firebase";
import { doc, collection, query, orderBy } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { MatchAiSummary } from '@/components/matches/match-ai-summary';

export default function MatchDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const firestore = useFirestore();
  const { user } = useUser();

  const matchRef = useMemoFirebase(() => {
    if (!firestore || !id) return null;
    return doc(firestore, 'matches', id);
  }, [firestore, id]);

  const playersRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'players');
  }, [firestore]);

  const matchesRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'matches'), orderBy('date', 'asc'));
  }, [firestore]);

  const adminRoleRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'roles_admin', user.uid);
  }, [firestore, user]);

  const { data: match, isLoading: matchLoading } = useDoc<Match>(matchRef);
  const { data: players, isLoading: playersLoading } = useCollection<Player>(playersRef);
  const { data: allMatches, isLoading: allMatchesLoading } = useCollection<Match>(matchesRef);
  const { data: adminRole } = useDoc<{isAdmin: boolean}>(adminRoleRef);

  const allPlayers = players || [];
  
  const matchNumber = React.useMemo(() => {
    if (!allMatches || !id) return 0;
    const index = allMatches.findIndex(m => m.id === id);
    return index !== -1 ? index + 1 : 0;
  }, [allMatches, id]);

  const mvpPlayer = React.useMemo(() => {
    if (!match || !allPlayers.length) return null;
    const allStats = [...(match.teamAPlayers || []), ...(match.teamBPlayers || [])];
    // Detección robusta: acepta booleanos puros, strings "true" o números truthy
    const stat = allStats.find(s => 
      s.isMvp === true || 
      String(s.isMvp) === "true" || 
      (s as any).isMvp === 1
    );
    return allPlayers.find(p => p.id === stat?.playerId);
  }, [match, allPlayers]);

  const bestGoalPlayer = React.useMemo(() => {
    if (!match || !allPlayers.length) return null;
    const allStats = [...(match.teamAPlayers || []), ...(match.teamBPlayers || [])];
    // Detección robusta: acepta booleanos puros, strings "true" o números truthy
    const stat = allStats.find(s => 
      s.hasBestGoal === true || 
      String(s.hasBestGoal) === "true" || 
      (s as any).hasBestGoal === 1
    );
    return allPlayers.find(p => p.id === stat?.playerId);
  }, [match, allPlayers]);

  if (matchLoading || playersLoading || allMatchesLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!match) return <div className="text-center py-12 font-bebas text-2xl uppercase opacity-20">Partido no encontrado.</div>;

  const date = parseISO(match.date);

  const aiInput = {
    date: match.date,
    teamAScore: match.teamAScore,
    teamBScore: match.teamBScore,
    teamAPlayers: match.teamAPlayers.map(s => ({ name: allPlayers.find(p => p.id === s.playerId)?.name || '?', goals: s.goals })),
    teamBPlayers: match.teamBPlayers.map(s => ({ name: allPlayers.find(p => p.id === s.playerId)?.name || '?', goals: s.goals })),
    mvpName: mvpPlayer?.name,
    bestGoalName: bestGoalPlayer?.name,
  };

  return (
    <div className="max-w-4xl mx-auto pb-20 space-y-10 px-4 md:px-0">
      
      {/* 1. MATCH HERO */}
      <section className="flex flex-col items-center text-center gap-6 pt-6">
        <Link href="/matches" className="flex items-center gap-2 text-[10px] font-black uppercase text-muted-foreground hover:text-primary transition-colors font-oswald tracking-[0.3em]">
          <ChevronLeft className="h-3 w-3" /> VOLVER AL HISTORIAL
        </Link>
        
        <div className="space-y-1">
          <p className="text-primary font-bebas text-2xl tracking-[0.2em] uppercase">JORNADA {matchNumber}</p>
          <p className="text-xs font-bold text-muted-foreground/60 uppercase tracking-[0.2em] font-oswald">
            {format(date, "eeee d MMMM", { locale: es })}
          </p>
        </div>
        
        <div className="flex items-center justify-center gap-8 md:gap-16 bg-black/40 backdrop-blur-md p-8 md:p-12 rounded-[2rem] border border-white/5 w-full max-w-2xl shadow-2xl">
          <div className="flex flex-col items-center">
            <span className="text-7xl md:text-9xl font-bebas text-primary leading-none drop-shadow-[0_0_20px_rgba(59,130,246,0.4)]">
              {match.teamAScore}
            </span>
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-primary font-oswald mt-2">AZUL</span>
          </div>
          <div className="text-4xl md:text-6xl font-light text-muted-foreground/10 italic font-oswald">—</div>
          <div className="flex flex-col items-center">
            <span className="text-7xl md:text-9xl font-bebas text-accent leading-none drop-shadow-[0_0_20px_rgba(244,63,94,0.4)]">
              {match.teamBScore}
            </span>
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-accent font-oswald mt-2">ROJO</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button variant="outline" size="sm" className="h-9 border-white/10 rounded-full font-oswald text-[10px] tracking-widest uppercase hover:bg-primary/10 hover:text-primary transition-all">
            <Share2 className="h-3 w-3 mr-2" /> Compartir
          </Button>
          {match.videoUrl && (
            <Button asChild size="sm" className="h-9 rounded-full font-oswald text-[10px] tracking-widest uppercase bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-900/20">
              <a href={match.videoUrl} target="_blank" rel="noopener noreferrer">
                <PlayCircle className="h-3 w-3 mr-2" /> Ver Repetición
              </a>
            </Button>
          )}
          {adminRole?.isAdmin && (
            <Button variant="outline" size="sm" className="h-9 border-white/10 rounded-full font-oswald text-[10px] tracking-widest uppercase hover:bg-yellow-500/10 hover:text-yellow-500 transition-all" asChild>
              <Link href={`/matches/${id}/edit`}><Pencil className="h-3 w-3 mr-2" /> Editar</Link>
            </Button>
          )}
        </div>
      </section>

      {/* 2. MATCH STATS */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="competition-card border-none bg-gradient-to-br from-yellow-500/10 to-transparent">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="bg-yellow-500/20 p-3 rounded-2xl">
              <Crown className="h-6 w-6 text-yellow-500" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-yellow-500/60 font-oswald">👑 MVP</p>
              <p className="text-xl font-bebas text-white uppercase tracking-wider">{mvpPlayer?.name || "N/A"}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="competition-card border-none bg-gradient-to-br from-orange-500/10 to-transparent">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="bg-orange-500/20 p-3 rounded-2xl">
              <Sparkles className="h-6 w-6 text-orange-500" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-orange-500/60 font-oswald">🎯 GOL DE LA FECHA</p>
              <p className="text-xl font-bebas text-white uppercase tracking-wider">{bestGoalPlayer?.name || "N/A"}</p>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* 3. GOALS SECTION */}
      <section className="space-y-6">
        <div className="flex items-center gap-4">
          <h2 className="text-xs font-black uppercase tracking-[0.4em] text-muted-foreground/40 font-oswald whitespace-nowrap">GOLES DEL PARTIDO</h2>
          <div className="h-px w-full bg-white/5" />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-primary/20 pb-2">
              <span className="font-bebas text-xl text-primary tracking-widest">EQUIPO AZUL</span>
              <span className="font-bebas text-xl text-primary">{match.teamAScore}</span>
            </div>
            <div className="space-y-3">
              {match.teamAPlayers.filter(p => p.goals > 0).length > 0 ? (
                match.teamAPlayers.filter(p => p.goals > 0).map(p => (
                  <div key={p.playerId} className="flex items-center justify-between group bg-white/5 p-3 rounded-xl border border-transparent hover:border-primary/20 transition-all">
                    <div className="flex items-center gap-3">
                      <Goal className="h-4 w-4 text-primary/40 group-hover:text-primary transition-colors" />
                      <span className="text-sm font-bold text-white/80 uppercase tracking-tight font-oswald">
                        {allPlayers.find(pl => pl.id === p.playerId)?.name}
                      </span>
                    </div>
                    <span className="font-bebas text-2xl text-primary italic">x{p.goals}</span>
                  </div>
                ))
              ) : <p className="text-[10px] italic text-muted-foreground/30 uppercase tracking-widest">Sin goleadores individuales</p>}
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-accent/20 pb-2">
              <span className="font-bebas text-xl text-accent tracking-widest">EQUIPO ROJO</span>
              <span className="font-bebas text-xl text-accent">{match.teamBScore}</span>
            </div>
            <div className="space-y-3">
              {match.teamBPlayers.filter(p => p.goals > 0).length > 0 ? (
                match.teamBPlayers.filter(p => p.goals > 0).map(p => (
                  <div key={p.playerId} className="flex items-center justify-between group bg-white/5 p-3 rounded-xl border border-transparent hover:border-accent/20 transition-all">
                    <div className="flex items-center gap-3">
                      <Goal className="h-4 w-4 text-accent/40 group-hover:text-accent transition-colors" />
                      <span className="text-sm font-bold text-white/80 uppercase tracking-tight font-oswald">
                        {allPlayers.find(pl => pl.id === p.playerId)?.name}
                      </span>
                    </div>
                    <span className="font-bebas text-2xl text-accent italic">x{p.goals}</span>
                  </div>
                ))
              ) : <p className="text-[10px] italic text-muted-foreground/30 uppercase tracking-widest">Sin goleadores individuales</p>}
            </div>
          </div>
        </div>
      </section>

      {/* 4. AI CRÓNICA INTEGRADA */}
      <section className="pt-6">
        <MatchAiSummary matchId={id} matchData={aiInput} />
      </section>

      {/* 5. MATCH CONTENT / TAPA DEL DIARIO */}
      <section className="pt-10">
        <Card className="competition-card group overflow-hidden border-none bg-gradient-to-r from-primary/20 via-background to-accent/20 hover:scale-[1.02] transition-transform duration-500 shadow-2xl">
          <CardContent className="p-0">
            <div className="p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-8 relative">
              <div className="absolute inset-0 bg-black/40 pointer-events-none" />
              
              <div className="relative z-10 space-y-4 text-center md:text-left flex-1">
                <div className="flex items-center justify-center md:justify-start gap-3">
                  <Badge className="bg-primary text-primary-foreground font-bebas tracking-widest px-3 py-1 text-sm rounded-none">EDICIÓN ESPECIAL</Badge>
                  <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] font-oswald">LA VOZ DEL PUEBLO</span>
                </div>
                <h2 className="text-4xl md:text-6xl font-bebas text-white tracking-wider leading-[0.9]">
                  {match.aiSummary?.title || "CRÓNICA DE LA BATALLA"}
                </h2>
                <p className="text-lg text-muted-foreground font-lora italic max-w-xl">
                  {match.aiSummary?.subtitle || "Los detalles de la jornada analizados por nuestra redacción."}
                </p>
              </div>

              <div className="relative z-10">
                <Button asChild size="lg" className="h-16 px-10 font-bebas text-2xl tracking-[0.2em] bg-white text-black hover:bg-white/90 shadow-[0_0_30px_rgba(255,255,255,0.2)] rounded-none group-hover:px-12 transition-all">
                  <Link href={`/dashboard?gaceta=${match.id}`} className="flex items-center gap-3">
                    <Newspaper className="h-6 w-6" /> TAPA DEL DIARIO <ArrowRight className="h-6 w-6" />
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

    </div>
  );
}
