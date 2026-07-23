"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Award, CheckCircle2, LogIn, Target, Sparkles } from "lucide-react";
import type { Player } from "@/lib/definitions";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";
import { Label } from "../ui/label";
import { Avatar, AvatarFallback } from "../ui/avatar";
import { useFirestore, useUser, useDoc, useCollection, useMemoFirebase, setDocumentNonBlocking } from "@/firebase";
import { doc, collection } from "firebase/firestore";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface GoalVoterProps {
  matchId: string;
  scorers: (Player & { goals: number; hasBestGoal?: boolean })[];
}

export function BestGoalVote({ matchId, scorers }: GoalVoterProps) {
  const [selectedPlayer, setSelectedPlayer] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user } = useUser();

  const userVoteRef = useMemoFirebase(() => {
    if (!firestore || !matchId || !user) return null;
    return doc(firestore, 'matches', matchId, 'votes', user.uid);
  }, [firestore, matchId, user]);

  const allVotesRef = useMemoFirebase(() => {
    if (!firestore || !matchId) return null;
    return collection(firestore, 'matches', matchId, 'votes');
  }, [firestore, matchId]);

  const { data: myVote } = useDoc<{votedPlayerId: string}>(userVoteRef);
  const { data: allVotes } = useCollection<{votedPlayerId: string}>(allVotesRef);

  // Check if there is already a manual winner selected by admin
  const manualWinner = scorers.find(s => s.hasBestGoal === true);

  const handleSubmit = async () => {
    if (!selectedPlayer || !firestore || !user || !userVoteRef) return;
    setIsLoading(true);
    try {
      setDocumentNonBlocking(userVoteRef, {
        votedPlayerId: selectedPlayer
      }, { merge: true });
      
      toast({
        title: "Voto Registrado",
        description: "Tu voto ha sido guardado correctamente.",
      });
    } catch (error) {
      // Handled centrally
    } finally {
      setIsLoading(false);
    }
  };

  const getVoteCount = (playerId: string) => {
    return allVotes?.filter(v => v.votedPlayerId === playerId).length || 0;
  };

  if (scorers.length === 0) {
    return (
        <Card className="competition-card opacity-50">
            <CardHeader>
                <CardTitle className="text-lg font-black uppercase italic">Mejor Gol</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-xs text-muted-foreground italic">No hubo goles en este partido.</p>
            </CardContent>
        </Card>
    );
  }

  // IF ADMIN ALREADY CHOSE A WINNER, SHOW HONOR CARD
  if (manualWinner) {
    return (
      <Card className="competition-card border-orange-500/40 bg-gradient-to-br from-orange-500/10 to-transparent">
        <CardHeader className="text-center pb-2">
          <div className="flex justify-center mb-2">
            <div className="bg-orange-500 p-2 rounded-full shadow-lg shadow-orange-500/20">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
          </div>
          <CardTitle className="text-xl font-black uppercase italic tracking-tighter text-orange-500">
            LA JOYA DEL PARTIDO
          </CardTitle>
          <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
            ELEGIDO POR LA ACADEMIA
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center pt-4">
          <Avatar className="h-20 w-20 border-4 border-orange-500 shadow-2xl mb-4">
            <AvatarFallback className="bg-surface-900 text-2xl font-bebas text-orange-500">
              {manualWinner.name.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <h3 className="text-2xl font-bebas tracking-widest text-white">{manualWinner.name.toUpperCase()}</h3>
          <div className="flex items-center gap-2 mt-2 bg-orange-500/20 px-4 py-1 rounded-full border border-orange-500/30">
             <Target className="h-3 w-3 text-orange-500" />
             <span className="text-[10px] font-black uppercase text-orange-500 tracking-widest">GOL DE ÉLITE</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!user) {
    return (
      <Card className="competition-card border-primary/20 bg-primary/5">
        <CardHeader>
          <CardTitle className="text-lg font-black uppercase italic">Elección del Mejor Gol</CardTitle>
          <CardDescription className="text-[10px] uppercase font-bold text-muted-foreground/60">
            SOLO PARA MIEMBROS OFICIALES
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4 py-6">
          <LogIn className="h-10 w-10 text-primary/40 mb-2" />
          <p className="text-xs text-center text-muted-foreground max-w-[200px]">
            Inicia sesión para participar en la votación.
          </p>
          <Button asChild className="w-full font-black uppercase italic">
            <Link href="/login">Acceder al Club</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (myVote) {
    return (
      <Card className="competition-card border-emerald-500/20 bg-emerald-500/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-emerald-500 text-lg font-black uppercase italic">
            <CheckCircle2 className="h-5 w-5" />
            Voto Registrado
          </CardTitle>
          <CardDescription className="text-[10px] uppercase font-bold text-emerald-500/60">
            ELECCIÓN POPULAR EN CURSO
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            {scorers.map(scorer => {
                const count = getVoteCount(scorer.id);
                const isMyVote = myVote.votedPlayerId === scorer.id;
                return (
                    <div key={scorer.id} className={cn(
                        "flex items-center justify-between p-3 rounded-xl border transition-all",
                        isMyVote ? "border-emerald-500 bg-emerald-500/10 shadow-lg" : "bg-white/5 border-transparent"
                    )}>
                        <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                                <AvatarFallback className="text-[10px] font-black">{scorer.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <span className={cn("font-bold text-sm", isMyVote ? "text-emerald-500" : "text-white")}>{scorer.name}</span>
                        </div>
                        <div className="flex flex-col items-end">
                            <span className={cn("font-bebas text-xl leading-none", isMyVote ? "text-emerald-500" : "text-white")}>{count}</span>
                            <span className="text-[7px] font-black uppercase text-muted-foreground/40">VOTOS</span>
                        </div>
                    </div>
                );
            })}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="competition-card">
      <CardHeader>
        <CardTitle className="text-lg font-black uppercase italic">Votar Mejor Gol</CardTitle>
        <CardDescription className="text-[10px] uppercase font-bold text-muted-foreground/60">
          TU VOTO DECIDE LA JOYA DE LA FECHA
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <RadioGroup value={selectedPlayer} onValueChange={setSelectedPlayer} className="gap-4">
          {scorers.map(scorer => (
            <div key={scorer.id} className="flex items-center space-x-3">
                <RadioGroupItem value={scorer.id} id={`player-${scorer.id}`} />
                <Label htmlFor={`player-${scorer.id}`} className="flex flex-1 items-center gap-3 cursor-pointer rounded-xl border border-white/5 p-4 hover:bg-accent/10 transition-colors">
                <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-muted font-black">{scorer.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                    <span className="font-black uppercase italic text-sm">{scorer.name}</span>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase">{scorer.goals} {scorer.goals > 1 ? 'goles marcados' : 'gol marcado'}</span>
                    </div>
                </Label>
            </div>
          ))}
        </RadioGroup>

        <div className="flex justify-end pt-4">
          <Button onClick={handleSubmit} disabled={isLoading || !selectedPlayer} className="w-full h-12 font-black uppercase italic shadow-lg shadow-primary/20">
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <Award className="mr-2 h-4 w-4" />
            Confirmar Voto
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
