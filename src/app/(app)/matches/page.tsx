
'use client';

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ArrowRight, CalendarIcon, Plus, Loader2 } from "lucide-react";
import Link from "next/link";
import { useCollection, useMemoFirebase, useFirestore, useUser, useDoc } from "@/firebase";
import { collection, query, orderBy } from "firebase/firestore";
import type { Match } from "@/lib/definitions";

export default function MatchesPage() {
  const firestore = useFirestore();
  const { user } = useUser();

  const matchesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'matches'), orderBy('date', 'desc'));
  }, [firestore]);

  const { data: matchesData, isLoading } = useCollection<Match>(matchesQuery);
  
  // Verificamos si el usuario es admin
  const adminRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return collection(firestore, 'roles_admin').withConverter({
        fromFirestore: (snapshot) => snapshot.data(),
        toFirestore: (data) => data,
    });
  }, [firestore, user]);
  
  const { data: adminRole } = useCollection<{isAdmin: boolean}>(adminRef);
  const isAdmin = adminRole?.find(r => r.id === user?.uid)?.isAdmin;

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
            <Card key={match.id} className="overflow-hidden border-l-4 border-l-primary/30 hover:border-l-primary transition-all group">
              <CardContent className="p-0">
                <Link href={`/matches/${match.id}`}>
                  <div className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
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
                          "text-4xl font-black",
                          teamAWon ? "text-primary scale-110" : "text-white/80"
                        )}>{match.teamAScore}</span>
                      </div>
                      
                      <div className="text-xl font-light text-muted-foreground/30 italic">VS</div>
                      
                      <div className="flex flex-col items-center gap-1">
                        <span className={cn(
                          "text-xs font-bold uppercase tracking-widest",
                          (draw || teamBWon) ? "text-accent" : "text-muted-foreground/50"
                        )}>Rojo</span>
                        <span className={cn(
                          "text-4xl font-black",
                          teamBWon ? "text-accent scale-110" : "text-white/80"
                        )}>{match.teamBScore}</span>
                      </div>
                    </div>

                    <div className="flex justify-end items-center">
                        <div className="h-10 w-10 rounded-full border flex items-center justify-center group-hover:bg-primary group-hover:border-primary group-hover:text-primary-foreground transition-colors">
                            <ArrowRight className="h-5 w-5" />
                        </div>
                    </div>
                  </div>
                </Link>
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
