"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Award } from "lucide-react";
import type { Player } from "@/lib/definitions";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";
import { Label } from "../ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";

interface GoalVoterProps {
  scorers: (Player & { goals: number })[];
}

export function BestGoalVote({ scorers }: GoalVoterProps) {
  const [selectedPlayer, setSelectedPlayer] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!selectedPlayer) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Por favor, selecciona un jugador.",
      });
      return;
    }
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsLoading(false);
    console.log("Voted for player:", selectedPlayer);
    toast({
      title: "Voto Enviado",
      description: "Gracias por votar por el mejor gol del partido.",
    });
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
