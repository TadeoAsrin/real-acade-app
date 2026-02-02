
'use client';

import { Player } from '@/lib/definitions';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

interface FieldViewProps {
  team: 'Amigos de Martes' | 'Resto del Mundo';
  players: Player[];
}

const positionCoordinates = {
  GK: { top: '5%', left: '50%', transform: 'translateX(-50%)' },
  DEF_L: { top: '25%', left: '20%', transform: 'translateX(-50%)' },
  DEF_R: { top: '25%', left: '80%', transform: 'translateX(-50%)' },
  MID_C: { top: '50%', left: '50%', transform: 'translateX(-50%)' },
  MID_L: { top: '55%', left: '25%', transform: 'translateX(-50%)' },
  MID_R: { top: '55%', left: '75%', transform: 'translateX(-50%)' },
  FWD: { top: '80%', left: '50%', transform: 'translateX(-50%)' },
};

// This is a simplified mapping. A more robust solution would be needed
// for dynamic formations or more players.
const playerPositionMap: { [key: string]: keyof typeof positionCoordinates } = {
  // Amigos de Martes
  '1': 'FWD',   // Leandro
  '2': 'MID_L', // Matias
  '3': 'MID_R', // Juan
  '4': 'MID_C', // Diego
  '5': 'DEF_L', // Facundo
  '6': 'DEF_R', // Sergio
  '7': 'GK',    // Pablo
  // Resto del Mundo
  '8': 'FWD',   // Carlos
  '9': 'MID_L', // Jorge
  '10': 'MID_R',// Ricardo
  '11': 'MID_C',// Fernando
  '12': 'DEF_L',// Andres
  '13': 'DEF_R',// Luis
  '14': 'GK',   // Miguel
};


export function FieldView({ team, players }: FieldViewProps) {
  const teamPlayers = players.filter((p) => p.team === team);

  return (
    <Card>
        <CardHeader>
            <CardTitle>{team}</CardTitle>
        </CardHeader>
        <CardContent>
            <div className="relative mx-auto h-[500px] w-full max-w-sm rounded-lg bg-green-800/70 border-4 border-white/30 overflow-hidden">
                {/* Field Markings */}
                <div className="absolute top-1/2 left-1/2 h-32 w-32 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white/30"></div>
                <div className="absolute top-1/2 left-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/30"></div>
                <div className="absolute top-1/2 left-0 h-[2px] w-full -translate-y-1/2 bg-white/30"></div>
                <div className="absolute top-0 left-1/2 h-24 w-3/4 -translate-x-1/2 border-x-2 border-b-2 border-white/30 rounded-b-lg"></div>
                <div className="absolute bottom-0 left-1/2 h-24 w-3/4 -translate-x-1/2 border-x-2 border-t-2 border-white/30 rounded-t-lg"></div>
                
                <TooltipProvider>
                    {teamPlayers.map((player) => {
                        const positionKey = playerPositionMap[player.id];
                        if (!positionKey) return null;

                        const coords = positionCoordinates[positionKey];
                        return (
                            <Tooltip key={player.id}>
                                <TooltipTrigger asChild>
                                    <div
                                        className="absolute transition-transform hover:scale-110 hover:z-10"
                                        style={{ top: coords.top, left: coords.left, transform: coords.transform }}
                                    >
                                        <Avatar className="h-12 w-12 border-2 border-white shadow-lg">
                                            <AvatarImage src={player.avatar} alt={player.name} />
                                            <AvatarFallback>{player.name.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                        <p className="mt-1 text-center text-xs font-semibold text-white bg-black/50 rounded-full px-1.5 py-0.5">
                                            {player.name.split(' ')[0]}
                                        </p>
                                    </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p className="font-bold">{player.name}</p>
                                    <p className="text-muted-foreground">{player.positionName}</p>
                                </TooltipContent>
                            </Tooltip>
                        );
                    })}
                </TooltipProvider>
            </div>
        </CardContent>
    </Card>
  );
}
