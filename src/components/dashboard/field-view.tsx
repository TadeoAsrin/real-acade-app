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
import { Trophy, ShieldCheck } from 'lucide-react';

interface FieldViewProps {
  team: 'Azul' | 'Rojo';
  players: Player[];
  topScorerId?: string;
}

// Formación Táctica inicial 1-3-2-1
const formationCoordinates: { top: string; left: string }[] = [
  { top: '12%', left: '50%' }, // Portero
  { top: '35%', left: '20%' }, // Defensor Izquierdo
  { top: '35%', left: '50%' }, // Defensor Central
  { top: '35%', left: '80%' }, // Defensor Derecho
  { top: '65%', left: '35%' }, // Mediocampista Izquierdo
  { top: '65%', left: '65%' }, // Mediocampista Derecho
  { top: '88%', left: '50%' }, // Delantero Centro
];

export function FieldView({ team, players, topScorerId }: FieldViewProps) {
  const fieldRef = React.useRef<HTMLDivElement>(null);
  const [playerPositions, setPlayerPositions] = React.useState<{ [key: string]: { x: number; y: number } }>({});
  const [draggingPlayer, setDraggingPlayer] = React.useState<{ id: string; startX: number; startY: number } | null>(null);

  // Inicializar posiciones
  React.useEffect(() => {
    const initialPositions: { [key: string]: { x: number; y: number } } = {};
    players.forEach((player, index) => {
      if (index < formationCoordinates.length) {
        const coords = formationCoordinates[index];
        initialPositions[player.id] = {
          x: parseFloat(coords.left),
          y: parseFloat(coords.top),
        };
      }
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
    
    // Límites del campo
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

  // Función para determinar si un jugador está en la "Zona de Portero"
  const isPlayerInGKZone = (pos: { x: number; y: number }) => {
    // Definimos el área pequeña como el 22% superior del campo y centralizado
    return pos.y < 22 && pos.x > 30 && pos.x < 70;
  };

  return (
    <Card className="glass-card overflow-hidden border-white/5 bg-black/20 shadow-2xl">
      <CardHeader className="pb-4">
        <CardTitle className={cn(
          "text-lg font-black uppercase tracking-tighter italic flex items-center justify-between", 
          team === 'Azul' ? 'text-primary' : 'text-accent'
        )}>
          <span>Último Partido {team}</span>
          <span className="text-[10px] font-bold text-muted-foreground/50 bg-black/40 px-2 py-0.5 rounded-full not-italic">
            Táctica 1-3-2-1
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        <div
          ref={fieldRef}
          onPointerMove={handlePointerMove}
          className={cn(
            "relative mx-auto h-[540px] w-full rounded-2xl border-[4px] border-white/20 overflow-hidden touch-none select-none",
            "bg-emerald-600 shadow-inner",
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
          {/* Líneas de Cal del Campo */}
          <div className="absolute inset-4 border-2 border-white/30 rounded-lg pointer-events-none" />
          <div className="absolute top-1/2 left-1/2 h-28 w-28 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white/30" />
          <div className="absolute top-1/2 left-0 w-full h-[2px] bg-white/30 -translate-y-1/2" />
          
          {/* Área de Portería (GK Zone Visual) */}
          <div className={cn(
            "absolute top-4 left-1/2 h-24 w-48 -translate-x-1/2 border-2 border-t-0 border-white/40 rounded-b-xl transition-colors duration-300",
            draggingPlayer && isPlayerInGKZone(playerPositions[draggingPlayer.id] || {x:0, y:100}) 
              ? "bg-orange-500/10 border-orange-500/40" 
              : "bg-white/5"
          )} />
          
          {/* Área Grande Inferior */}
          <div className="absolute bottom-4 left-1/2 h-24 w-48 -translate-x-1/2 border-2 border-b-0 border-white/30 rounded-t-xl" />
          
          <TooltipProvider>
            {players.map((player) => {
              const pos = playerPositions[player.id];
              if (!pos) return null;
              
              const isDragging = draggingPlayer?.id === player.id;
              const isPichichi = player.id === topScorerId;
              const isGK = isPlayerInGKZone(pos);

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
                            "h-12 w-12 border-[3px] shadow-2xl ring-2 ring-black/30 transition-all duration-300",
                            isGK 
                              ? "border-orange-500 bg-orange-600/40 scale-105" // Estilo Portero Dinámico
                              : isPichichi 
                                ? "border-yellow-400 shadow-yellow-500/40 ring-yellow-400/20" 
                                : team === 'Azul' 
                                  ? "border-primary bg-primary/20" 
                                  : "border-accent bg-accent/20",
                            isDragging && "ring-white/50 opacity-90"
                          )}>
                            <AvatarImage src={player.avatar} alt={player.name} className="object-cover" />
                            <AvatarFallback className="bg-muted text-[10px] font-black">{player.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          
                          {isPichichi && (
                            <div className="absolute -top-1.5 -right-1.5 bg-yellow-400 rounded-full p-1 shadow-md border border-black/20 animate-bounce">
                              <Trophy className="h-3 w-3 text-black" />
                            </div>
                          )}
                          
                          {isGK && (
                            <div className="absolute -bottom-1 -right-1 bg-orange-500 rounded-full p-1 shadow-md border border-white/40 animate-pulse">
                              <ShieldCheck className="h-3.5 w-3.5 text-white" />
                            </div>
                          )}
                        </div>
                        
                        <div className={cn(
                          "backdrop-blur-md border border-white/20 rounded-full px-2.5 py-0.5 shadow-lg transition-colors duration-300",
                          isPichichi ? "bg-yellow-400/90" : isGK ? "bg-orange-500/90" : "bg-black/80"
                        )}>
                          <p className={cn(
                            "text-[10px] font-black uppercase tracking-tighter whitespace-nowrap",
                            (isPichichi || isGK) ? "text-black" : "text-white"
                          )}>
                            {player.name.split(' ')[0]}
                          </p>
                        </div>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="bg-black border-white/20 text-white font-bold text-xs">
                      <div className="flex flex-col gap-0.5">
                        <span>{player.name}</span>
                        {isGK && <span className="text-orange-400 text-[10px] uppercase tracking-widest">En Portería</span>}
                      </div>
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
