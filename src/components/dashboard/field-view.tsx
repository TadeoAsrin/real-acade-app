
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

const positionCoordinates: { [key: string]: { top: string; left: string; transform: string } } = {
  GK: { top: '5%', left: '50%', transform: 'translateX(-50%)' },
  DEF_L: { top: '25%', left: '20%', transform: 'translateX(-50%)' },
  DEF_R: { top: '25%', left: '80%', transform: 'translateX(-50%)' },
  MID_C: { top: '50%', left: '50%', transform: 'translateX(-50%)' },
  MID_L: { top: '55%', left: '25%', transform: 'translateX(-50%)' },
  MID_R: { top: '55%', left: '75%', transform: 'translateX(-50%)' },
  FWD: { top: '80%', left: '50%', transform: 'translateX(-50%)' },
};

export function FieldView({ team, players }: FieldViewProps) {
  const fieldRef = React.useRef<HTMLDivElement>(null);
  const playerRefs = React.useRef<{ [key: string]: HTMLDivElement | null }>({});
  const [playerPositions, setPlayerPositions] = React.useState<{ [key: string]: { x: number; y: number } }>({});
  const [draggingPlayer, setDraggingPlayer] = React.useState<{ id: string; offsetX: number; offsetY: number } | null>(null);

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

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>, playerId: string) => {
    e.preventDefault();
    const playerElement = playerRefs.current[playerId];
    if (!playerElement) return;
    const playerRect = playerElement.getBoundingClientRect();
    const offsetX = e.clientX - (playerRect.left + playerRect.width / 2);
    const offsetY = e.clientY - (playerRect.top + playerRect.height / 2);
    setDraggingPlayer({ id: playerId, offsetX, offsetY });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!draggingPlayer || !fieldRef.current) return;
    e.preventDefault();
    const fieldRect = fieldRef.current.getBoundingClientRect();
    let newCenterX = e.clientX - fieldRect.left - draggingPlayer.offsetX;
    let newCenterY = e.clientY - fieldRect.top - draggingPlayer.offsetY;
    
    setPlayerPositions((prev) => ({
      ...prev,
      [draggingPlayer.id]: { x: (newCenterX / fieldRect.width) * 100, y: (newCenterY / fieldRect.height) * 100 },
    }));
  };

  return (
    <Card className="glass-card overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className={cn("text-lg font-black uppercase tracking-widest", team === 'Azul' ? 'text-primary' : 'text-accent')}>
          Último Partido ({team})
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        <div
          ref={fieldRef}
          onMouseMove={handleMouseMove}
          onMouseUp={() => setDraggingPlayer(null)}
          onMouseLeave={() => setDraggingPlayer(null)}
          className={cn(
            "relative mx-auto h-[480px] w-full max-w-sm rounded-xl border-4 border-white/20 overflow-hidden touch-none select-none shadow-2xl bg-emerald-900",
            draggingPlayer ? "cursor-grabbing" : "cursor-grab"
          )}
          style={{
            backgroundImage: `
              repeating-linear-gradient(0deg, #065f46 0px, #065f46 60px, #064e3b 60px, #064e3b 120px)
            `
          }}
        >
          {/* Líneas del campo */}
          <div className="absolute inset-0 border-[2px] border-white/30 m-2 rounded-lg pointer-events-none" />
          <div className="absolute top-1/2 left-0 h-[2px] w-full -translate-y-1/2 bg-white/30" />
          <div className="absolute top-1/2 left-1/2 h-24 w-24 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white/30" />
          
          {/* Áreas */}
          <div className="absolute top-2 left-1/2 h-20 w-48 -translate-x-1/2 border-2 border-t-0 border-white/30" />
          <div className="absolute bottom-2 left-1/2 h-20 w-48 -translate-x-1/2 border-2 border-b-0 border-white/30" />
          
          <TooltipProvider>
            {players.map((player) => {
              const pos = playerPositions[player.id];
              if (!pos) return null;
              return (
                <Tooltip key={player.id}>
                  <TooltipTrigger asChild>
                    <div
                      ref={(el) => (playerRefs.current[player.id] = el)}
                      onMouseDown={(e) => handleMouseDown(e, player.id)}
                      className="absolute transition-transform hover:scale-125 hover:z-20 active:scale-110"
                      style={{
                        top: `${pos.y}%`,
                        left: `${pos.x}%`,
                        transform: 'translate(-50%, -50%)',
                      }}
                    >
                      <div className="relative group">
                        <Avatar className={cn(
                          "h-12 w-12 border-2 shadow-xl ring-4 ring-black/20",
                          team === 'Azul' ? "border-primary bg-primary/20" : "border-accent bg-accent/20"
                        )}>
                          <AvatarImage src={player.avatar} alt={player.name} className="object-cover" />
                          <AvatarFallback className="bg-muted text-xs">{player.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 bg-black/80 backdrop-blur-sm border border-white/10 rounded-full px-2 py-0.5 whitespace-nowrap shadow-lg">
                          <p className="text-[10px] font-bold text-white uppercase tracking-tighter">
                            {player.name.split(' ')[0]}
                          </p>
                        </div>
                      </div>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    <p className="text-xs font-black uppercase">{player.name}</p>
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
