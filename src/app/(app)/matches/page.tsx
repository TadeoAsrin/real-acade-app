
'use client';

import * as React from 'react';
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ArrowRight, CalendarIcon, Plus, Loader2, Trash2, Pencil, Camera, MessageSquare, Flame, Newspaper } from "lucide-react";
import Link from "next/link";
import { useCollection, useMemoFirebase, useFirestore, useUser, useDoc, deleteDocumentNonBlocking } from "@/firebase";
import { collection, query, orderBy, doc } from "firebase/firestore";
import type { Match } from "@/lib/definitions";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { format, isFuture, isToday, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";

interface MatchCardProps {
  match: Match;
  isAdmin: boolean;
  onDelete: (id: string) => void;
}

const MatchCard = ({ match, isAdmin, onDelete }: MatchCardProps) => {
  const date = parseISO(match.date);
  const hasScore = match.teamAScore > 0 || match.teamBScore > 0;
  const isMatchToday = isToday(date);
  const isUpcoming = !hasScore && (isFuture(date) || isMatchToday);
  const isCompleted = hasScore || (!isFuture(date) && !isToday(date));
  const teamAWon = match.teamAScore > match.teamBScore;
  const teamBWon = match.teamBScore > match.teamAScore;
  const draw = match.teamAScore === match.teamBScore && isCompleted && hasScore;

  return (
    <Card className="competition-card border-l-4 border-l-primary/30 hover:border-l-primary transition-all group relative bg-black/20 hover-lift backdrop-blur-sm shadow-2xl">
      <CardContent className="p-0">
        <div className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <Link href={`/matches/${match.id}`} className="flex-1">
            <div className="flex flex-col md:flex-row md:items-center gap-6">
              <div className="flex items-center gap-4 min-w-[180px]">
                  <div className={cn(
                    "p-3 rounded-xl shrink-0 shadow-lg",
                    isMatchToday ? "bg-orange-500 text-white animate-pulse" : "bg-white/5 text-muted-foreground"
                  )}>
                      {isMatchToday ? <Flame className="h-5 w-5" /> : <CalendarIcon className="h-5 w-5" />}
                  </div>
                  <div className="flex flex-col min-w-0">
                      <span className="font-black text-white uppercase italic tracking-tighter truncate text-lg">
                        {format(date, "eeee d", { locale: es })}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-black font-oswald">
                            {format(date, "MMMM yyyy", { locale: es })}
                        </span>
                        {isMatchToday && <Badge className="h-3 text-[7px] bg-orange-500 uppercase p-1 rounded-none font-black italic shadow-lg">¡Hoy!</Badge>}
                      </div>
                  </div>
              </div>

              {!isUpcoming ? (
                <div className="flex items-center justify-center flex-1 gap-8 md:gap-12 py-2 md:py-0">
                  <div className="flex flex-col items-center gap-1">
                    <span className={cn(
                      "text-[10px] font-black uppercase tracking-[0.2em] font-oswald",
                      (draw || teamAWon) ? "text-primary" : "text-muted-foreground/30"
                    )}>AZUL</span>
                    <span className={cn(
                      "text-5xl font-bebas transition-all italic",
                      teamAWon ? "text-primary drop-shadow-[0_0_15px_rgba(59,130,246,0.5)] scale-110" : "text-primary/40"
                    )}>{match.teamAScore}</span>
                  </div>
                  
                  <div className="text-xl font-light text-muted-foreground/10 italic">—</div>
                  
                  <div className="flex flex-col items-center gap-1">
                    <span className={cn(
                      "text-[10px] font-black uppercase tracking-[0.2em] font-oswald",
                      (draw || teamBWon) ? "text-accent" : "text-muted-foreground/30"
                    )}>ROJO</span>
                    <span className={cn(
                      "text-5xl font-bebas transition-all italic",
                      teamBWon ? "text-accent drop-shadow-[0_0_15px_rgba(244,63,94,0.5)] scale-110" : "text-accent/40"
                    )}>{match.teamBScore}</span>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center py-2 md:py-0">
                  <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary font-oswald mb-1">PRÓXIMO DESAFÍO</span>
                  <span className="text-3xl font-bebas italic text-white tracking-widest">{format(date, "HH:mm")} HS</span>
                </div>
              )}

              <div className="flex items-center gap-3 md:ml-auto">
                {match.photos && match.photos.length > 0 && (
                  <Badge variant="outline" className="h-8 w-8 rounded-full p-0 flex items-center justify-center bg-primary/5 border-primary/20 text-primary shadow-sm">
                    <Camera className="h-4 w-4" />
                  </Badge>
                )}
                {match.aiSummary && (
                  <Badge variant="outline" className="h-8 w-8 rounded-full p-0 flex items-center justify-center bg-emerald-500/5 border-emerald-500/20 text-emerald-500 shadow-sm">
                    <MessageSquare className="h-4 w-4" />
                  </Badge>
                )}
              </div>
            </div>
          </Link>

          <div className="flex items-center gap-2">
              {isAdmin && (
                <>
                  <Button variant="ghost" size="icon" asChild className="text-muted-foreground hover:text-primary transition-colors">
                    <Link href={`/matches/${match.id}/edit`}><Pencil className="h-4 w-4" /></Link>
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive transition-colors">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="bg-surface-900 border-white/10 text-white">
                      <AlertDialogHeader>
                        <AlertDialogTitle className="font-bebas text-3xl tracking-widest text-destructive italic">¿ELIMINAR JORNADA?</AlertDialogTitle>
                        <AlertDialogDescription className="font-oswald uppercase text-[10px] tracking-widest text-muted-foreground/60">Esta acción borrará la crónica y las estadísticas de Real Acade para siempre.</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel className="bg-white/5 border-white/10 text-white font-bebas tracking-widest rounded-none h-12">CANCELAR</AlertDialogCancel>
                        <AlertDialogAction onClick={() => onDelete(match.id)} className="bg-destructive text-white font-bebas tracking-widest rounded-none h-12 px-8 shadow-lg shadow-destructive/20">BORRAR HISTORIAL</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </>
              )}
              <Button asChild className="h-12 px-6 font-bebas text-xl tracking-widest bg-white text-black hover:bg-white/90 rounded-none transition-all group hover:px-8 shadow-xl">
                <Link href={`/matches/${match.id}`} className="flex items-center gap-3">
                  {isUpcoming ? "VER INFO" : "VER CRÓNICA"} <ArrowRight className="h-5 w-5" />
                </Link>
              </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default function MatchesPage() {
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();

  const matchesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'matches'), orderBy('date', 'desc'));
  }, [firestore]);

  const adminRoleRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'roles_admin', user.uid);
  }, [firestore, user]);

  const { data: matchesData, isLoading } = useCollection<Match>(matchesQuery);
  const { data: adminRole } = useDoc<{isAdmin: boolean}>(adminRoleRef);
  
  const isAdmin = !!adminRole?.isAdmin;

  const handleDeleteMatch = (matchId: string) => {
    if (!firestore) return;
    const matchRef = doc(firestore, 'matches', matchId);
    deleteDocumentNonBlocking(matchRef);
    toast({ title: "Jornada Eliminada", description: "El registro ha sido borrado de la base oficial." });
  };

  if (isLoading) return <div className="flex h-[50vh] items-center justify-center"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>;

  const matches = matchesData || [];
  const upcomingMatches = matches.filter(m => {
    const date = parseISO(m.date);
    const hasScore = m.teamAScore > 0 || m.teamBScore > 0;
    return !hasScore && (isFuture(date) || isToday(date));
  }).reverse();

  const pastMatches = matches.filter(m => {
    const date = parseISO(m.date);
    const hasScore = m.teamAScore > 0 || m.teamBScore > 0;
    return hasScore || (!isFuture(date) && !isToday(date));
  });

  return (
    <div className="flex flex-col gap-10 max-w-5xl mx-auto pb-20">
      {/* 1. CINEMATIC HEADER */}
      <section className="cinematic-banner p-8 md:p-12 flex flex-col md:flex-row justify-between items-center gap-8">
        <div className="absolute inset-0 bg-black/40 pointer-events-none" />
        <div className="relative z-10 space-y-4 text-center md:text-left">
          <div className="flex items-center justify-center md:justify-start gap-3">
            <Badge className="bg-primary text-primary-foreground font-bebas tracking-widest px-3 py-1 text-sm rounded-none shadow-lg shadow-primary/20">EDICIÓN ESPECIAL</Badge>
            <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em] font-oswald">REGISTRO HISTÓRICO</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-bebas text-white tracking-wider leading-none uppercase">HISTORIAL DE BATALLAS</h1>
          <p className="text-lg md:text-xl text-muted-foreground font-lora italic max-w-2xl">La crónica de cada gota de sudor dejada en el campo de Real Acade.</p>
        </div>

        {isAdmin && (
          <div className="relative z-10">
            <Button asChild size="lg" className="h-16 px-10 font-bebas text-2xl tracking-[0.2em] bg-white text-black hover:bg-white/90 shadow-[0_0_40px_rgba(255,255,255,0.25)] rounded-none transition-all group hover:px-12">
              <Link href="/matches/new" className="flex items-center">
                <Plus className="mr-3 h-6 w-6" /> NUEVO PARTIDO
              </Link>
            </Button>
          </div>
        )}
      </section>

      <div className="space-y-12 relative">
        <div className="absolute left-[34px] md:left-[42px] top-4 bottom-0 w-0.5 bg-gradient-to-b from-primary/50 via-muted/20 to-transparent hidden md:block opacity-20" />

        {upcomingMatches.length > 0 && (
          <section className="space-y-6">
            <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-primary flex items-center gap-3 relative z-10 font-oswald">
              <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
              PRÓXIMOS DESAFÍOS
            </h2>
            <div className="grid grid-cols-1 gap-4">
              {upcomingMatches.map(match => (
                <MatchCard key={match.id} match={match} isAdmin={isAdmin} onDelete={handleDeleteMatch} />
              ))}
            </div>
          </section>
        )}

        <section className="space-y-6">
          <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground/40 relative z-10 font-oswald px-1">MEMORIA DEL CLUB</h2>
          <div className="grid grid-cols-1 gap-6">
            {pastMatches.map((match) => (
              <MatchCard key={match.id} match={match} isAdmin={isAdmin} onDelete={handleDeleteMatch} />
            ))}
          </div>
          {pastMatches.length === 0 && upcomingMatches.length === 0 && (
              <div className="text-center py-32 border-2 border-dashed border-white/5 rounded-[2rem] opacity-20">
                  <Newspaper className="h-16 w-16 mx-auto mb-6 opacity-50" />
                  <p className="font-bebas text-3xl tracking-widest uppercase italic">Sin registros históricos aún</p>
              </div>
          )}
        </section>
      </div>
    </div>
  );
}
