'use client';

import * as React from 'react';
import { Player } from '@/lib/definitions';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { cn } from '@/lib/utils';
import { Trophy, Calendar } from 'lucide-react';

interface FieldViewProps {
  team: 'Azul' | 'Rojo';
  players: Player[];
  topScorerId?: string;
  date?: string;
}

const GlovesIcon = ({ className }: { className?: string }) => (
  <svg 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2.5" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M6 18c-2 0-3-1-3-3s1-3 3-3 3 1 3 3-1 3-3 3z" />
    <path d="M18 18c2 0 3-1 3-3s-1-3-3-3-3 1-3 3 1 3 3 3z" />
    <path d="M9 12V7a3 3 0 0 1 6 0v5" />
    <path d="M3 15V9a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v6" />
  </svg>
);

const formationCoordinates: { top: string; left: string }[] = [
  { top: '12%', left: '50%' }, // 0: GK (1)
  { top: '35%', left: '22%' }, // 1: Def L (Ahora será 4)
  { top: '35%', left: '50%' }, // 2: Def C (2)
  { top: '35%', left: '78%' }, // 3: Def R (Ahora será 3)
  { top: '65%', left: '35%' }, // 4: Mid L (8)
  { top: '65%', left: '65%' }, // 5: Mid R (10)
  { top: '85%', left: '50%' }, // 6: Fwd (9)
];

const getTacticalNumber = (index: number): string => {
  const numbers = ["1", "4", "2", "3", "8", "10", "9"];
  return numbers[index] || "";
};

export function FieldView({ team, players, topScorerId, date }: FieldViewProps) {
  const fieldRef = React.useRef<HTMLDivElement>(null);
  const [playerPositions, setPlayerPositions] = React.useState<{ [key: string]: { x: number; y: number } }>({});
  const [draggingPlayer, setDraggingPlayer] = React.useState<{ id: string; startX: number; startY: number } | null>(null);
  const [formattedDate, setFormattedDate] = React.useState<string>("");

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

    if (date) {
      setFormattedDate(new Date(date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }));
    }
  }, [players, date]);

  const handlePointerDown = (e: React.PointerEvent, playerId: string) => {
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
    
    newX = Math.max(8, Math.min(92, newX));
    newY = Math.max(8, Math.min(92, newY));

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

  const isPlayerInGKZone = (pos: { x: number; y: number }) => {
    return pos.y < 25 && pos.x > 25 && pos.x < 75;
  };

  return (
    <Card className="glass-card overflow-hidden border-white/5 bg-black/20 shadow-2xl">
      <CardHeader className="p-4 lg:pb-4">
        <CardTitle className={cn(
          "text-sm lg:text-lg font-black uppercase tracking-tighter italic flex flex-col items-start gap-1", 
          team === 'Azul' ? 'text-primary' : 'text-accent'
        )}>
          <div className="flex items-center justify-between w-full">
            <span>Último Partido: {team}</span>
            <span className="text-[8px] lg:text-[10px] font-bold text-muted-foreground/50 bg-black/40 px-2 py-0.5 rounded-full not-italic">
              3-2-1
            </span>
          </div>
          {formattedDate && (
            <div className="flex items-center gap-1.5 text-[10px] not-italic font-bold text-muted-foreground lowercase tracking-normal bg-white/5 px-2 py-0.5 rounded-md">
              <Calendar className="h-3 w-3" />
              {formattedDate}
            </div>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-2 lg:p-4">
        <div
          ref={fieldRef}
          onPointerMove={handlePointerMove}
          className={cn(
            "relative mx-auto h-[400px] lg:h-[560px] w-full rounded-xl lg:rounded-2xl border-[3px] lg:border-[4px] border-white/20 overflow-hidden touch-none select-none shadow-2xl",
            "bg-emerald-800",
            draggingPlayer ? "cursor-grabbing" : "cursor-default"
          )}
          style={{
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px),
              repeating-linear-gradient(0deg, rgba(255,255,255,0.05) 0px, rgba(255,255,255,0.05) 40px, transparent 40px, transparent 80px)
            `,
            backgroundSize: '100% 100%, 100% 80px'
          }}
        >
          {/* Pitch markings */}
          <div className="absolute inset-2 lg:inset-4 border-2 border-white/20 rounded-lg pointer-events-none" />
          <div className="absolute top-1/2 left-1/2 h-20 w-20 lg:h-32 lg:w-32 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white/20" />
          <div className="absolute top-1/2 left-0 w-full h-[1px] lg:h-[2px] bg-white/20 -translate-y-1/2" />
          
          {/* Areas */}
          <div className={cn(
            "absolute top-2 lg:top-4 left-1/2 h-16 lg:h-24 w-32 lg:w-48 -translate-x-1/2 border-2 border-t-0 border-white/30 rounded-b-lg lg:rounded-b-xl transition-all duration-300",
            draggingPlayer && isPlayerInGKZone(playerPositions[draggingPlayer.id] || {x:0, y:100}) 
              ? "bg-orange-500/20 border-orange-500 shadow-[0_0_30px_rgba(249,115,22,0.3)]" 
              : "bg-white/5"
          )} />
          
          <div className="absolute bottom-2 lg:bottom-4 left-1/2 h-16 lg:h-24 w-32 lg:w-48 -translate-x-1/2 border-2 border-b-0 border-white/30 rounded-t-lg lg:rounded-t-xl" />
          
          <TooltipProvider>
            {players.map((player, index) => {
              const pos = playerPositions[player.id];
              if (!pos) return null;
              
              const isDragging = draggingPlayer?.id === player.id;
              const isPichichi = player.id === topScorerId;
              const isGK = isPlayerInGKZone(pos);
              const tacticalNumber = getTacticalNumber(index);

              return (
                <div
                  key={player.id}
                  onPointerDown={(e) => handlePointerDown(e, player.id)}
                  onPointerUp={handlePointerUp}
                  className={cn(
                    "absolute transition-shadow duration-200 z-10",
                    isDragging ? "scale-110 z-50 cursor-grabbing" : "cursor-grab lg:hover:scale-110"
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
                            "h-9 w-9 lg:h-11 lg:w-11 border-[2px] lg:border-[3px] shadow-2xl transition-all duration-300",
                            isGK 
                              ? "border-orange-500 bg-orange-600/40" 
                              : isPichichi 
                                ? "border-yellow-400 shadow-yellow-500/40" 
                                : team === 'Azul' 
                                  ? "border-primary bg-primary/20" 
                                  : "border-accent bg-accent/20",
                            isDragging && "opacity-90 scale-105"
                          )}>
                            <AvatarFallback className={cn(
                                "text-xs lg:text-sm font-black italic",
                                isGK ? "bg-orange-500 text-white" : isPichichi ? "bg-yellow-400 text-black" : team === 'Azul' ? "bg-primary text-white" : "bg-accent text-white"
                            )}>
                                {tacticalNumber}
                            </AvatarFallback>
                          </Avatar>
                          
                          {isPichichi && (
                            <div className="absolute -top-1 -right-1 bg-yellow-400 rounded-full p-0.5 shadow-md border border-black/20">
                              <Trophy className="h-2 w-2 lg:h-3 lg:w-3 text-black" />
                            </div>
                          )}
                          
                          {isGK && (
                            <div className="absolute -bottom-1 -right-1 bg-orange-500 rounded-full p-0.5 shadow-md border border-white/40">
                              <GlovesIcon className="h-2.5 w-2.5 lg:h-3.5 lg:w-3.5 text-white" />
                            </div>
                          )}
                        </div>
                        
                        <div className={cn(
                          "backdrop-blur-md border border-white/20 rounded-full px-1.5 lg:px-2.5 py-0.5 shadow-lg",
                          isPichichi ? "bg-yellow-400/90" : isGK ? "bg-orange-500/90" : "bg-black/80"
                        )}>
                          <p className={cn(
                            "text-[8px] lg:text-[10px] font-black uppercase tracking-tighter whitespace-nowrap",
                            (isPichichi || isGK) ? "text-black" : "text-white"
                          )}>
                            {player.name.split(' ')[0]}
                          </p>
                        </div>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="bg-black border-white/20 text-white font-bold text-xs shadow-2xl">
                      <div className="flex flex-col gap-0.5">
                        <span>{player.name}</span>
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
