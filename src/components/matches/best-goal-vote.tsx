
"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Award, CheckCircle2 } from "lucide-react";
import type { Player } from "@/lib/definitions";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";
import { Label } from "../ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { useFirestore, useUser, useDoc, useCollection, useMemoFirebase } from "@/firebase";
import { doc, setDoc, collection } from "firebase/firestore";

interface GoalVoterProps {
  matchId: string;
  scorers: (Player & { goals: number })[];
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

  const handleSubmit = async () => {
    if (!selectedPlayer || !firestore || !user) return;
    setIsLoading(true);
    try {
      await setDoc(doc(firestore, 'matches', matchId, 'votes', user.uid), {
        votedPlayerId: selectedPlayer
      });
      toast({
        title: "Voto Registrado",
        description: "Tu voto ha sido guardado correctamente.",
      });
    } catch (error) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo registrar tu voto.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getVoteCount = (playerId: string) => {
    return allVotes?.filter(v => v.votedPlayerId === playerId).length || 0;
  };

  if (scorers.length === 0) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Votar por el Mejor Gol</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground">No hubo goles en este partido.</p>
            </CardContent>
        </Card>
    );
  }

  if (myVote) {
    return (
      <Card className="border-green-500/20 bg-green-500/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-500" />
            Voto Enviado
          </CardTitle>
          <CardDescription>
            Ya has participado en la elección del mejor gol.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            {scorers.map(scorer => {
                const count = getVoteCount(scorer.id);
                const isMyVote = myVote.votedPlayerId === scorer.id;
                return (
                    <div key={scorer.id} className={cn(
                        "flex items-center justify-between p-3 rounded-md border",
                        isMyVote ? "border-green-500 bg-green-500/10" : "bg-muted/50"
                    )}>
                        <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                                <AvatarImage src={scorer.avatar} alt={scorer.name} />
                                <AvatarFallback>{scorer.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <span className="font-medium">{scorer.name}</span>
                        </div>
                        <span className="font-bold text-lg">{count}</span>
                    </div>
                );
            })}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Votar por el Mejor Gol</CardTitle>
        <CardDescription>
          Elige el jugador que crees que marcó el mejor gol del partido.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <RadioGroup value={selectedPlayer} onValueChange={setSelectedPlayer} className="gap-4">
          {scorers.map(scorer => (
            <div key={scorer.id} className="flex items-center space-x-3">
                <RadioGroupItem value={scorer.id} id={`player-${scorer.id}`} />
                <Label htmlFor={`player-${scorer.id}`} className="flex flex-1 items-center gap-3 cursor-pointer rounded-md border p-3 hover:bg-accent/50 transition-colors">
                <Avatar className="h-10 w-10">
                    <AvatarImage src={scorer.avatar} alt={scorer.name} />
                    <AvatarFallback>{scorer.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                    <span className="font-medium">{scorer.name}</span>
                    <span className="text-sm text-muted-foreground">{scorer.goals} {scorer.goals > 1 ? 'goles' : 'gol'}</span>
                    </div>
                </Label>
            </div>
          ))}
        </RadioGroup>

        <div className="flex justify-end pt-4">
          <Button onClick={handleSubmit} disabled={isLoading || !selectedPlayer}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <Award className="mr-2 h-4 w-4" />
            Enviar Voto
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
