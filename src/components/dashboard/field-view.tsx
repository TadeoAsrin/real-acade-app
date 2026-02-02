'use client';

import * as React from 'react';
import { Player } from '@/lib/definitions';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { cn } from '@/lib/utils';

interface FieldViewProps {
  team: 'Amigos de Martes' | 'Resto del Mundo';
  players: Player[];
}

const positionCoordinates: { [key: string]: { top: string; left: string; transform: string } } = {
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

type PlayerPosition = { x: number; y: number }; // in percentages
type PlayerPositions = { [playerId: string]: PlayerPosition };
type DraggingState = {
  id: string;
  offsetX: number; // offset from element's center to mouse pos
  offsetY: number;
};

export function FieldView({ team, players }: FieldViewProps) {
  const teamPlayers = players.filter((p) => p.team === team);
  const fieldRef = React.useRef<HTMLDivElement>(null);
  const playerRefs = React.useRef<{ [key: string]: HTMLDivElement | null }>({});

  const [playerPositions, setPlayerPositions] = React.useState<PlayerPositions>(() => {
    const initialPositions: PlayerPositions = {};
    teamPlayers.forEach((player) => {
      const positionKey = playerPositionMap[player.id];
      if (positionKey) {
        const coords = positionCoordinates[positionKey];
        // Store initial percentages for center
        initialPositions[player.id] = {
          x: parseFloat(coords.left),
          y: parseFloat(coords.top),
        };
      }
    });
    return initialPositions;
  });

  const [draggingPlayer, setDraggingPlayer] = React.useState<DraggingState | null>(null);

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>, playerId: string) => {
    e.preventDefault();
    const playerElement = playerRefs.current[playerId];
    if (!playerElement) return;

    const playerRect = playerElement.getBoundingClientRect();
    
    // Calculate offset from the center of the element to the mouse position
    const offsetX = e.clientX - (playerRect.left + playerRect.width / 2);
    const offsetY = e.clientY - (playerRect.top + playerRect.height / 2);

    setDraggingPlayer({ id: playerId, offsetX, offsetY });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!draggingPlayer || !fieldRef.current) return;
    
    e.preventDefault();
    const fieldRect = fieldRef.current.getBoundingClientRect();
    const playerElement = playerRefs.current[draggingPlayer.id];
    if (!playerElement) return;
    
    const playerRect = playerElement.getBoundingClientRect();

    // Calculate new center position in pixels relative to the field
    let newCenterX = e.clientX - fieldRect.left - draggingPlayer.offsetX;
    let newCenterY = e.clientY - fieldRect.top - draggingPlayer.offsetY;
    
    // Constrain center within field boundaries
    newCenterX = Math.max(playerRect.width / 2, Math.min(newCenterX, fieldRect.width - playerRect.width / 2));
    newCenterY = Math.max(playerRect.height / 2, Math.min(newCenterY, fieldRect.height - playerRect.height / 2));

    // Convert to percentage for styling
    const xPercent = (newCenterX / fieldRect.width) * 100;
    const yPercent = (newCenterY / fieldRect.height) * 100;

    setPlayerPositions((prev) => ({
      ...prev,
      [draggingPlayer.id]: { x: xPercent, y: yPercent },
    }));
  };

  const handleMouseUpOrLeave = () => {
    setDraggingPlayer(null);
  };

  return (
    <Card>
        <CardHeader>
            <CardTitle>{team}</CardTitle>
        </CardHeader>
        <CardContent>
            <div
                ref={fieldRef}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUpOrLeave}
                onMouseLeave={handleMouseUpOrLeave}
                className={cn(
                    "relative mx-auto h-[500px] w-full max-w-sm rounded-lg bg-green-800/70 border-4 border-white/30 overflow-hidden touch-none select-none",
                    draggingPlayer ? "cursor-grabbing" : "cursor-grab"
                )}
            >
                {/* Field Markings */}
                <div className="absolute top-1/2 left-1/2 h-32 w-32 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white/30"></div>
                <div className="absolute top-1/2 left-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/30"></div>
                <div className="absolute top-1/2 left-0 h-[2px] w-full -translate-y-1/2 bg-white/30"></div>
                <div className="absolute top-0 left-1/2 h-24 w-3/4 -translate-x-1/2 border-x-2 border-b-2 border-white/30 rounded-b-lg"></div>
                <div className="absolute bottom-0 left-1/2 h-24 w-3/4 -translate-x-1/2 border-x-2 border-t-2 border-white/30 rounded-t-lg"></div>
                
                <TooltipProvider>
                    {teamPlayers.map((player) => {
                        const position = playerPositions[player.id];
                        if (!position) return null;

                        return (
                            <Tooltip key={player.id}>
                                <TooltipTrigger asChild>
                                    <div
                                        ref={(el) => (playerRefs.current[player.id] = el)}
                                        onMouseDown={(e) => handleMouseDown(e, player.id)}
                                        className="absolute transition-transform hover:scale-110 hover:z-10"
                                        style={{
                                            top: `${position.y}%`,
                                            left: `${position.x}%`,
                                            transform: 'translate(-50%, -50%)',
                                        }}
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
