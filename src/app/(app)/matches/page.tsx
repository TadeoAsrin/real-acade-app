'use client';

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ArrowRight, CalendarIcon, Plus, Loader2, Trash2, Pencil } from "lucide-react";
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
  
  const isAdmin = adminRole?.isAdmin;

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

  const allMatches = matchesData || [];

  return (
    <div className="flex flex-col gap-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white">Historial de Partidos</h1>
            <p className="text-muted-foreground">Registro de todos los encuentros disputados.</p>
          </div>
          {isAdmin && (
            <Button asChild>
                <Link href="/matches/new"><Plus className="mr-2 h-4 w-4" /> Cargar Partido</Link>
            </Button>
          )}
      </div>

      <div className="grid grid-cols-1 gap-6">
        {allMatches.map((match) => {
          const teamAWon = match.teamAScore > match.teamBScore;
          const teamBWon = match.teamBScore > match.teamAScore;
          const draw = match.teamAScore === match.teamBScore;

          return (
            <Card key={match.id} className="overflow-hidden border-l-4 border-l-primary/30 hover:border-l-primary transition-all group relative">
              <CardContent className="p-0">
                <div className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <Link href={`/matches/${match.id}`} className="flex-1">
                    <div className="flex flex-col md:flex-row md:items-center gap-6">
                      <div className="flex items-center gap-4">
                          <div className="p-3 bg-muted rounded-full">
                              <CalendarIcon className="h-5 w-5 text-muted-foreground" />
                          </div>
                          <div className="flex flex-col">
                              <span className="font-bold text-white">
                                {new Date(match.date).toLocaleDateString('es-ES', { 
                                  weekday: 'long', 
                                  day: 'numeric', 
                                  month: 'long' 
                                })}
                              </span>
                              <span className="text-xs text-muted-foreground uppercase tracking-widest">
                                  {new Date(match.date).getFullYear()}
                              </span>
                          </div>
                      </div>

                      <div className="flex items-center justify-center flex-1 gap-8 md:gap-12">
                        <div className="flex flex-col items-center gap-1">
                          <span className={cn(
                            "text-xs font-bold uppercase tracking-widest",
                            (draw || teamAWon) ? "text-primary" : "text-muted-foreground/50"
                          )}>Azul</span>
                          <span className={cn(
                            "text-4xl font-black transition-all",
                            "text-primary",
                            teamAWon ? "scale-110 drop-shadow-[0_0_8px_rgba(var(--primary),0.5)]" : "opacity-80"
                          )}>{match.teamAScore}</span>
                        </div>
                        
                        <div className="text-xl font-light text-muted-foreground/30 italic">VS</div>
                        
                        <div className="flex flex-col items-center gap-1">
                          <span className={cn(
                            "text-xs font-bold uppercase tracking-widest",
                            (draw || teamBWon) ? "text-accent" : "text-muted-foreground/50"
                          )}>Rojo</span>
                          <span className={cn(
                            "text-4xl font-black transition-all",
                            "text-accent",
                            teamBWon ? "scale-110 drop-shadow-[0_0_8px_rgba(var(--accent),0.5)]" : "opacity-80"
                          )}>{match.teamBScore}</span>
                        </div>
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
                                  Esta acción no se puede deshacer. Se borrarán todos los datos y votos asociados.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDeleteMatch(match.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                  Eliminar permanentemente
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </>
                      )}
                      <Button variant="outline" size="icon" asChild className="group-hover:bg-primary group-hover:border-primary group-hover:text-primary-foreground">
                        <Link href={`/matches/${match.id}`}><ArrowRight className="h-5 w-5" /></Link>
                      </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
        {allMatches.length === 0 && (
            <div className="text-center py-12 border-2 border-dashed rounded-lg">
                <p className="text-muted-foreground">No hay partidos registrados aún.</p>
            </div>
        )}
      </div>
    </div>
  );
}