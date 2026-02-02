"use client";

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Button } from "../ui/button";
import { Slider } from "../ui/slider";
import type { Player } from "@/lib/definitions";
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

type PlayerRatings = { [playerId: string]: number };

export function PlayerRating({ players }: { players: Player[] }) {
    const [ratings, setRatings] = useState<PlayerRatings>({});
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();

    // In a real app, this would come from an auth context
    const currentUserId = '1';

    const handleRatingChange = (playerId: string, value: number[]) => {
        setRatings(prev => ({ ...prev, [playerId]: value[0] }));
    };

    const handleSubmit = async () => {
        setIsLoading(true);
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1500));
        setIsLoading(false);
        console.log("Submitted ratings:", ratings);
        toast({
            title: "Calificaciones Enviadas",
            description: "Gracias por calificar a los jugadores.",
        });
    };
    
    const playersToRate = players.filter(p => p.id !== currentUserId);

    return (
        <Card>
            <CardHeader>
                <CardTitle>Calificar Jugadores</CardTitle>
                <CardDescription>
                    Califica el rendimiento de cada jugador del 1 al 10.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {playersToRate.map(player => (
                    <div key={player.id} className="grid grid-cols-1 gap-4 md:grid-cols-4 md:items-center">
                        <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10">
                                <AvatarImage src={player.avatar} alt={player.name} />
                                <AvatarFallback>{player.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <span className="font-medium">{player.name}</span>
                        </div>
                        <div className="col-span-1 md:col-span-2 flex items-center gap-4">
                           <Slider
                                value={[ratings[player.id] || 5]}
                                onValueChange={(value) => handleRatingChange(player.id, value)}
                                max={10}
                                min={1}
                                step={1}
                            />
                        </div>
                         <div className="flex items-center justify-end">
                            <span className="text-lg font-bold w-8 text-center text-primary">{ratings[player.id] || '-'}</span>
                         </div>
                    </div>
                ))}

                <div className="flex justify-end pt-4">
                    <Button onClick={handleSubmit} disabled={isLoading || Object.keys(ratings).length === 0}>
                         {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Enviar Calificaciones
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}
