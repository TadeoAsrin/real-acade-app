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
  team: 'Azul' | 'Rojo';
  players: Player[];
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

export function FieldView({ team, players }: FieldViewProps) {
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
    // Guardamos el punto relativo donde se hizo click dentro del avatar para evitar el "salto"
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
    
    // Calculamos la nueva posición en porcentaje relativa al campo
    let newX = ((e.clientX - fieldRect.left - draggingPlayer.startX) / fieldRect.width) * 100;
    let newY = ((e.clientY - fieldRect.top - draggingPlayer.startY) / fieldRect.height) * 100;
    
    // Límites para que no se salgan del campo
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
          "text-xl font-black uppercase tracking-tighter italic", 
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
            "relative mx-auto h-[540px] w-full rounded-2xl border-[6px] border-white/10 overflow-hidden touch-none select-none shadow-2xl",
            "bg-gradient-to-b from-emerald-800 to-emerald-950",
            draggingPlayer ? "cursor-grabbing" : "cursor-default"
          )}
          style={{
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px),
              repeating-linear-gradient(0deg, rgba(255,255,255,0.02) 0px, rgba(255,255,255,0.02) 40px, transparent 40px, transparent 80px)
            `,
            backgroundSize: '100% 100%, 100% 80px'
          }}
        >
          {/* Líneas de cal profesionales */}
          <div className="absolute inset-4 border-2 border-white/30 rounded-lg pointer-events-none" />
          
          {/* Círculo Central */}
          <div className="absolute top-1/2 left-1/2 h-28 w-28 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white/30" />
          <div className="absolute top-1/2 left-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/50" />
          
          {/* Área Superior (Portería A) */}
          <div className="absolute top-4 left-1/2 h-24 w-48 -translate-x-1/2 border-2 border-t-0 border-white/30 rounded-b-md" />
          <div className="absolute top-4 left-1/2 h-10 w-24 -translate-x-1/2 border-2 border-t-0 border-white/20 rounded-b-sm" />
          
          {/* Área Inferior (Portería B) */}
          <div className="absolute bottom-4 left-1/2 h-24 w-48 -translate-x-1/2 border-2 border-b-0 border-white/30 rounded-t-md" />
          <div className="absolute bottom-4 left-1/2 h-10 w-24 -translate-x-1/2 border-2 border-b-0 border-white/20 rounded-t-sm" />

          {/* Sombra interna del campo */}
          <div className="absolute inset-0 shadow-[inner_0_0_100px_rgba(0,0,0,0.4)] pointer-events-none" />
          
          <TooltipProvider>
            {players.map((player) => {
              const pos = playerPositions[player.id];
              if (!pos) return null;
              const isDragging = draggingPlayer?.id === player.id;

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
                      <div className="flex flex-col items-center gap-1.5">
                        <div className="relative">
                          <Avatar className={cn(
                            "h-14 w-14 border-[3px] shadow-[0_10px_20px_rgba(0,0,0,0.4)] ring-4 ring-black/30 transition-all",
                            team === 'Azul' 
                              ? "border-primary bg-primary/20 shadow-primary/20" 
                              : "border-accent bg-accent/20 shadow-accent/20",
                            isDragging && "ring-white/50"
                          )}>
                            <AvatarImage src={player.avatar} alt={player.name} className="object-cover" />
                            <AvatarFallback className="bg-muted text-xs font-black">{player.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          
                          {/* Pequeño destello superior */}
                          <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-transparent via-white/10 to-white/20 pointer-events-none" />
                        </div>
                        
                        <div className="bg-black/80 backdrop-blur-md border border-white/10 rounded-full px-3 py-0.5 shadow-xl">
                          <p className="text-[10px] font-black text-white uppercase tracking-tighter">
                            {player.name.split(' ')[0]}
                          </p>
                        </div>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="bg-black border-white/20 text-white font-bold">
                      {player.name}
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
