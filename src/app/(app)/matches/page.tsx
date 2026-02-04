
'use client';

import * as React from 'react';
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ArrowRight, CalendarIcon, Plus, Loader2, Trash2, Pencil, Camera, MessageSquare, Flame } from "lucide-react";
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
  const isCompleted = match.teamAScore > 0 || match.teamBScore > 0 || !isFuture(date);
  const isUpcoming = isFuture(date) && !isToday(date);
  const isMatchToday = isToday(date);
  
  const teamAWon = match.teamAScore > match.teamBScore;
  const teamBWon = match.teamBScore > match.teamAScore;
  const draw = match.teamAScore === match.teamBScore && isCompleted;

  return (
    <Card className="overflow-hidden border-l-4 border-l-primary/30 hover:border-l-primary transition-all group relative glass-card">
      <CardContent className="p-0">
        <div className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <Link href={`/matches/${match.id}`} className="flex-1">
            <div className="flex flex-col md:flex-row md:items-center gap-6">
              <div className="flex items-center gap-4 min-w-[180px]">
                  <div className={cn(
                    "p-3 rounded-xl",
                    isMatchToday ? "bg-orange-500 text-white animate-pulse" : "bg-muted text-muted-foreground"
                  )}>
                      {isMatchToday ? <Flame className="h-5 w-5" /> : <CalendarIcon className="h-5 w-5" />}
                  </div>
                  <div className="flex flex-col">
                      <span className="font-black text-white uppercase italic tracking-tighter">
                        {format(date, "eeee d", { locale: es })}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
                            {format(date, "MMMM yyyy", { locale: es })}
                        </span>
                        {isMatchToday && <Badge className="h-3 text-[7px] bg-orange-500 uppercase p-1">¡Hoy!</Badge>}
                      </div>
                  </div>
              </div>

              {!isUpcoming ? (
                <div className="flex items-center justify-center flex-1 gap-8 md:gap-12 py-2 md:py-0">
                  <div className="flex flex-col items-center gap-1">
                    <span className={cn(
                      "text-[10px] font-black uppercase tracking-[0.2em]",
                      (draw || teamAWon) ? "text-primary" : "text-muted-foreground/30"
                    )}>Azul</span>
                    <span className={cn(
                      "text-4xl font-black transition-all italic",
                      "text-primary",
                      teamAWon ? "scale-110 drop-shadow-[0_0_10px_rgba(59,130,246,0.5)]" : "opacity-40"
                    )}>{match.teamAScore}</span>
                  </div>
                  
                  <div className="text-xl font-light text-muted-foreground/20 italic">VS</div>
                  
                  <div className="flex flex-col items-center gap-1">
                    <span className={cn(
                      "text-[10px] font-black uppercase tracking-[0.2em]",
                      (draw || teamBWon) ? "text-accent" : "text-muted-foreground/30"
                    )}>Rojo</span>
                    <span className={cn(
                      "text-4xl font-black transition-all italic",
                      "text-accent",
                      teamBWon ? "scale-110 drop-shadow-[0_0_10px_rgba(244,63,94,0.5)]" : "opacity-40"
                    )}>{match.teamBScore}</span>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center py-2 md:py-0">
                  <span className="text-xs font-black uppercase tracking-widest text-primary mb-1">Próximo Desafío</span>
                  <span className="text-2xl font-black italic">{format(date, "HH:mm")} HS</span>
                </div>
              )}

              <div className="flex items-center gap-3 md:ml-auto">
                {match.photos && match.photos.length > 0 && (
                  <Badge variant="outline" className="h-7 w-7 rounded-full p-0 flex items-center justify-center bg-primary/10 border-primary/20 text-primary">
                    <Camera className="h-3 w-3" />
                  </Badge>
                )}
                {match.aiSummary && (
                  <Badge variant="outline" className="h-7 w-7 rounded-full p-0 flex items-center justify-center bg-emerald-500/10 border-emerald-500/20 text-emerald-500">
                    <MessageSquare className="h-3 w-3" />
                  </Badge>
                )}
              </div>
            </div>
          </Link>

          <div className="flex items-center gap-2">
              {isAdmin && (
                <>
                  <Button variant="ghost" size="icon" asChild className="text-muted-foreground hover:text-primary">
                    <Link href={`/matches/${match.id}/edit`}><Pencil className="h-4 w-4" /></Link>
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>¿Eliminar este partido?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Esta acción borrará la crónica y las estadísticas para siempre.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={() => onDelete(match.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                          Eliminar
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </>
              )}
              <Button variant="outline" className="group-hover:bg-primary group-hover:border-primary group-hover:text-primary-foreground rounded-xl font-black uppercase italic text-xs gap-2">
                <Link href={`/matches/${match.id}`} className="flex items-center gap-2">
                  {isUpcoming ? "Ver Info" : "Ver Crónica"} <ArrowRight className="h-3.5 w-3.5" />
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
    toast({
      title: "Partido Eliminado",
      description: "El registro ha sido borrado permanentemente.",
    });
  };

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const matches = matchesData || [];
  const futureMatches = matches.filter(m => isFuture(parseISO(m.date)));
  const pastMatches = matches.filter(m => !isFuture(parseISO(m.date)));

  return (
    <div className="flex flex-col gap-10 max-w-5xl mx-auto pb-20">
      <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-black tracking-tighter text-white uppercase italic">Timeline Temporada</h1>
            <p className="text-muted-foreground">El registro cronológico de la mística de Real Acade.</p>
          </div>
          {isAdmin && (
            <Button asChild className="font-black uppercase italic shadow-lg shadow-primary/20">
                <Link href="/matches/new"><Plus className="mr-2 h-4 w-4" /> Nuevo Partido</Link>
            </Button>
          )}
      </div>

      <div className="space-y-12 relative">
        {/* Timeline vertical line */}
        <div className="absolute left-[34px] md:left-[42px] top-4 bottom-0 w-0.5 bg-gradient-to-b from-primary/50 via-muted/20 to-transparent hidden md:block" />

        {futureMatches.length > 0 && (
          <section className="space-y-6">
            <h2 className="text-xs font-black uppercase tracking-[0.3em] text-primary flex items-center gap-2 relative z-10">
              <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
              Próximos Desafíos
            </h2>
            <div className="grid grid-cols-1 gap-4">
              {futureMatches.map(match => (
                <MatchCard 
                  key={match.id} 
                  match={match} 
                  isAdmin={isAdmin} 
                  onDelete={handleDeleteMatch} 
                />
              ))}
            </div>
          </section>
        )}

        <section className="space-y-6">
          <h2 className="text-xs font-black uppercase tracking-[0.3em] text-muted-foreground/50 relative z-10">Historial de Batallas</h2>
          <div className="grid grid-cols-1 gap-6">
            {pastMatches.map((match) => (
              <MatchCard 
                key={match.id} 
                match={match} 
                isAdmin={isAdmin} 
                onDelete={handleDeleteMatch} 
              />
            ))}
          </div>
          {pastMatches.length === 0 && futureMatches.length === 0 && (
              <div className="text-center py-20 border-2 border-dashed rounded-3xl opacity-20">
                  <CalendarIcon className="h-12 w-12 mx-auto mb-4" />
                  <p className="font-bold uppercase italic tracking-widest">Sin registros aún</p>
              </div>
          )}
        </section>
      </div>
    </div>
  );
}
