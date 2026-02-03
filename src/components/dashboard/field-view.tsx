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
import { Trophy } from 'lucide-react';

interface FieldViewProps {
  team: 'Azul' | 'Rojo';
  players: Player[];
  topScorerId?: string;
}

// Posiciones iniciales tácticas para Fútbol 7
const positionCoordinates: { [key: string]: { top: string; left: string } } = {
  GK: { top: '8%', left: '50%' },
  DEF_L: { top: '25%', left: '25%' },
  DEF_R: { top: '25%', left: '75%' },
  MID_C: { top: '45%', left: '50%' },
  MID_L: { top: '65%', left: '20%' },
  MID_R: { top: '65%', left: '80%' },
  FWD: { top: '85%', left: '50%' },
};

export function FieldView({ team, players, topScorerId }: FieldViewProps) {
  const fieldRef = React.useRef<HTMLDivElement>(null);
  const [playerPositions, setPlayerPositions] = React.useState<{ [key: string]: { x: number; y: number } }>({});
  const [draggingPlayer, setDraggingPlayer] = React.useState<{ id: string; startX: number; startY: number } | null>(null);

  // Inicializar posiciones
  React.useEffect(() => {
    const initialPositions: { [key: string]: { x: number; y: number } } = {};
    const coordsKeys = Object.keys(positionCoordinates);
    players.forEach((player, index) => {
      const coords = positionCoordinates[coordsKeys[index % coordsKeys.length]];
      initialPositions[player.id] = {
        x: parseFloat(coords.left),
        y: parseFloat(coords.top),
      };
    });
    setPlayerPositions(initialPositions);
  }, [players]);

  const handlePointerDown = (e: React.PointerEvent, playerId: string) => {
    e.preventDefault();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setDraggingPlayer({ 
      id: playerId, 
      startX: e.clientX - rect.left - rect.width / 2,
      startY: e.clientY - rect.top - rect.height / 2
    });
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!draggingPlayer || !fieldRef.current) return;
    
    const fieldRect = fieldRef.current.getBoundingClientRect();
    let newX = ((e.clientX - fieldRect.left - draggingPlayer.startX) / fieldRect.width) * 100;
    let newY = ((e.clientY - fieldRect.top - draggingPlayer.startY) / fieldRect.height) * 100;
    
    newX = Math.max(5, Math.min(95, newX));
    newY = Math.max(5, Math.min(95, newY));

    setPlayerPositions((prev) => ({
      ...prev,
      [draggingPlayer.id]: { x: newX, y: newY },
    }));
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (draggingPlayer) {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
      setDraggingPlayer(null);
    }
  };

  return (
    <Card className="glass-card overflow-hidden border-white/5 bg-black/20">
      <CardHeader className="pb-4">
        <CardTitle className={cn(
          "text-lg font-black uppercase tracking-tighter italic", 
          team === 'Azul' ? 'text-primary' : 'text-accent'
        )}>
          Último Partido {team}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        <div
          ref={fieldRef}
          onPointerMove={handlePointerMove}
          className={cn(
            "relative mx-auto h-[480px] w-full rounded-2xl border-[4px] border-white/10 overflow-hidden touch-none select-none shadow-2xl",
            "bg-gradient-to-b from-emerald-800 to-emerald-950",
            draggingPlayer ? "cursor-grabbing" : "cursor-default"
          )}
          style={{
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
              repeating-linear-gradient(0deg, rgba(255,255,255,0.01) 0px, rgba(255,255,255,0.01) 40px, transparent 40px, transparent 80px)
            `,
            backgroundSize: '100% 100%, 100% 80px'
          }}
        >
          <div className="absolute inset-4 border border-white/20 rounded-lg pointer-events-none" />
          <div className="absolute top-1/2 left-1/2 h-20 w-20 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/20" />
          <div className="absolute top-1/2 left-1/2 h-1 w-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/30" />
          <div className="absolute top-4 left-1/2 h-20 w-40 -translate-x-1/2 border border-t-0 border-white/20 rounded-b-md" />
          <div className="absolute bottom-4 left-1/2 h-20 w-40 -translate-x-1/2 border border-b-0 border-white/20 rounded-t-md" />

          <TooltipProvider>
            {players.map((player) => {
              const pos = playerPositions[player.id];
              if (!pos) return null;
              const isDragging = draggingPlayer?.id === player.id;
              const isPichichi = player.id === topScorerId;

              return (
                <div
                  key={player.id}
                  onPointerDown={(e) => handlePointerDown(e, player.id)}
                  onPointerUp={handlePointerUp}
                  className={cn(
                    "absolute transition-shadow duration-200 z-10",
                    isDragging ? "scale-110 z-50 cursor-grabbing" : "cursor-grab hover:scale-105"
                  )}
                  style={{
                    top: `${pos.y}%`,
                    left: `${pos.x}%`,
                    transform: 'translate(-50%, -50%)',
                  }}
                >
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex flex-col items-center gap-1">
                        <div className="relative">
                          <Avatar className={cn(
                            "h-11 w-11 border-[2.5px] shadow-[0_4px_10px_rgba(0,0,0,0.5)] ring-2 ring-black/40 transition-all",
                            isPichichi 
                              ? "border-yellow-500 shadow-yellow-500/40 ring-yellow-500/20" 
                              : team === 'Azul' 
                                ? "border-primary bg-primary/20 shadow-primary/10" 
                                : "border-accent bg-accent/20 shadow-accent/10",
                            isDragging && "ring-white/40"
                          )}>
                            <AvatarImage src={player.avatar} alt={player.name} className="object-cover" />
                            <AvatarFallback className="bg-muted text-[10px] font-black">{player.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          
                          {isPichichi && (
                            <div className="absolute -top-1.5 -right-1.5 bg-yellow-500 rounded-full p-0.5 shadow-md border border-white/20">
                              <Trophy className="h-2.5 w-2.5 text-black" />
                            </div>
                          )}
                        </div>
                        
                        <div className={cn(
                          "backdrop-blur-md border border-white/10 rounded-full px-2 py-0.5 shadow-lg",
                          isPichichi ? "bg-yellow-500/90" : "bg-black/70"
                        )}>
                          <p className={cn(
                            "text-[9px] font-black uppercase tracking-tighter",
                            isPichichi ? "text-black" : "text-white"
                          )}>
                            {player.name.split(' ')[0]}
                          </p>
                        </div>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="bg-black border-white/20 text-white font-bold text-xs">
                      {player.name} {isPichichi && ' (Pichichi)'}
                    </TooltipContent>
                  </Tooltip>
                </div>
              );
            })}
          </TooltipProvider>
        </div>
      </CardContent>
    </Card>
  );
}
