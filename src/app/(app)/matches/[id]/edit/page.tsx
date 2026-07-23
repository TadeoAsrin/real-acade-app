'use client';

import * as React from 'react';
import { useFirestore, useCollection, useMemoFirebase, updateDocumentNonBlocking, useDoc } from '@/firebase';
import { collection, query, orderBy, doc } from 'firebase/firestore';
import { useRouter, useParams } from 'next/navigation';
import { useSeason } from '@/context/season-context';
import type { Player, Match } from '@/lib/definitions';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  Loader2, 
  Save, 
  Goal, 
  Shield, 
  Star, 
  Plus, 
  Minus, 
  Users,
  Search,
  Target,
  ArrowLeft
} from 'lucide-react';
import { getInitials, cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import Link from 'next/link';

const initialPlayerMatchState = {
  team: null as 'A' | 'B' | null,
  goals: 0,
  isCaptain: false,
  isMvp: false,
  hasBestGoal: false,
};

export default function EditMatchPage() {
  const { id } = useParams<{ id: string }>();
  const firestore = useFirestore();
  const { activeSeasonId } = useSeason();
  const { toast } = useToast();
  const router = useRouter();

  const [searchTerm, setSearchTerm] = React.useState('');
  
  const matchRef = useMemoFirebase(() => {
    if (!firestore || !id) return null;
    return doc(firestore, 'matches', id);
  }, [firestore, id]);

  const playersRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'players'), orderBy('name', 'asc'));
  }, [firestore]);

  const { data: match, isLoading: matchLoading } = useDoc<Match>(matchRef);
  const { data: players, isLoading: playersLoading } = useCollection<Player>(playersRef);

  const [date, setDate] = React.useState('');
  const [playerStates, setPlayerMatchStates] = React.useState<Record<string, typeof initialPlayerMatchState>>({});
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Initialize form with match data
  React.useEffect(() => {
    if (players && match) {
      const states: Record<string, typeof initialPlayerMatchState> = {};
      
      // Initialize all players as bench
      players.forEach(p => {
        states[p.id] = { ...initialPlayerMatchState };
      });

      // Overlay match data
      match.teamAPlayers?.forEach(s => {
        if (states[s.playerId]) {
          states[s.playerId] = { 
            team: 'A', 
            goals: s.goals, 
            isCaptain: !!s.isCaptain, 
            isMvp: !!s.isMvp, 
            hasBestGoal: !!s.hasBestGoal 
          };
        }
      });

      match.teamBPlayers?.forEach(s => {
        if (states[s.playerId]) {
          states[s.playerId] = { 
            team: 'B', 
            goals: s.goals, 
            isCaptain: !!s.isCaptain, 
            isMvp: !!s.isMvp, 
            hasBestGoal: !!s.hasBestGoal 
          };
        }
      });

      setPlayerMatchStates(states);
      setDate(new Date(match.date).toISOString().split('T')[0]);
    }
  }, [players, match]);

  const teamAPlayers = React.useMemo(() => 
    Object.entries(playerStates).filter(([_, state]) => state.team === 'A'), [playerStates]
  );
  const teamBPlayers = React.useMemo(() => 
    Object.entries(playerStates).filter(([_, state]) => state.team === 'B'), [playerStates]
  );

  const teamAScore = React.useMemo(() => 
    teamAPlayers.reduce((sum, [_, state]) => sum + state.goals, 0), [teamAPlayers]
  );
  const teamBScore = React.useMemo(() => 
    teamBPlayers.reduce((sum, [_, state]) => sum + state.goals, 0), [teamBPlayers]
  );

  const setPlayerTeam = (playerId: string, team: 'A' | 'B' | null) => {
    setPlayerMatchStates(prev => ({
      ...prev,
      [playerId]: { ...prev[playerId], team }
    }));
  };

  const updateGoals = (playerId: string, delta: number) => {
    setPlayerMatchStates(prev => ({
      ...prev,
      [playerId]: { ...prev[playerId], goals: Math.max(0, prev[playerId].goals + delta) }
    }));
  };

  const toggleCaptain = (playerId: string, team: 'A' | 'B') => {
    setPlayerMatchStates(prev => {
      const newStates = { ...prev };
      const currentVal = !!prev[playerId]?.isCaptain;
      Object.keys(newStates).forEach(id => {
        if (newStates[id].team === team) newStates[id] = { ...newStates[id], isCaptain: false };
      });
      newStates[playerId] = { ...newStates[playerId], isCaptain: !currentVal };
      return newStates;
    });
  };

  const toggleMvp = (playerId: string) => {
    setPlayerMatchStates(prev => {
      const newStates = { ...prev };
      const currentVal = !!prev[playerId]?.isMvp;
      Object.keys(newStates).forEach(id => {
        newStates[id] = { ...newStates[id], isMvp: false };
      });
      newStates[playerId] = { ...newStates[playerId], isMvp: !currentVal };
      return newStates;
    });
  };

  const toggleBestGoal = (playerId: string) => {
    setPlayerMatchStates(prev => {
      const newStates = { ...prev };
      const currentVal = !!prev[playerId]?.hasBestGoal;
      Object.keys(newStates).forEach(id => {
        newStates[id] = { ...newStates[id], hasBestGoal: false };
      });
      newStates[playerId] = { ...newStates[playerId], hasBestGoal: !currentVal };
      return newStates;
    });
  };

  const handleSubmit = async () => {
    if (!firestore || !matchRef) return;

    setIsSubmitting(true);
    try {
      const updatedMatchData = {
        date: new Date(date).toISOString(),
        teamAScore,
        teamBScore,
        teamAPlayers: teamAPlayers.map(([id, s]) => ({
          playerId: id,
          goals: s.goals,
          isCaptain: s.isCaptain,
          isMvp: s.isMvp,
          hasBestGoal: s.hasBestGoal
        })),
        teamBPlayers: teamBPlayers.map(([id, s]) => ({
          playerId: id,
          goals: s.goals,
          isCaptain: s.isCaptain,
          isMvp: s.isMvp,
          hasBestGoal: s.hasBestGoal
        })),
        updatedAt: new Date().toISOString(),
      };

      updateDocumentNonBlocking(matchRef, updatedMatchData);
      toast({ title: "Cambios guardados", description: "La ficha del partido ha sido actualizada." });
      router.push(`/matches/${id}`);
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message });
      setIsSubmitting(false);
    }
  };

  const filteredPlayers = players?.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (playersLoading || matchLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="font-bebas text-xl tracking-widest text-muted-foreground uppercase">Cargando datos originales...</p>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="max-w-7xl mx-auto p-4 lg:p-8 space-y-8 animate-in fade-in duration-700">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-1">
            <Link href={`/matches/${id}`} className="flex items-center gap-2 text-[10px] font-black uppercase text-muted-foreground hover:text-primary transition-colors tracking-widest mb-4">
              <ArrowLeft className="h-3 w-3" /> CANCELAR EDICIÓN
            </Link>
            <h2 className="text-4xl lg:text-7xl font-black uppercase tracking-tighter italic text-white flex items-center gap-4">
              <Edit3 className="h-8 w-8 lg:h-14 lg:w-14 text-primary shrink-0" />
              REESCRIBIR HISTORIA
            </h2>
            <p className="text-[10px] lg:text-xs font-black uppercase tracking-[0.4em] text-primary/60 ml-1">
              EDICIÓN PROFESIONAL DE PARTIDO
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <div className="bg-black/40 border border-white/10 p-3 rounded-xl flex flex-col gap-1 w-full sm:w-48">
                <p className="text-[8px] font-black uppercase text-muted-foreground tracking-widest">FECHA DEL PARTIDO</p>
                <Input 
                  type="date" 
                  value={date} 
                  onChange={(e) => setDate(e.target.value)} 
                  className="bg-transparent border-none p-0 h-auto font-bebas text-xl text-white focus-visible:ring-0"
                />
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="BUSCAR JUGADOR..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-black/40 border-white/10 font-bold uppercase tracking-widest text-xs h-12"
              />
            </div>
          </div>
        </div>

        <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center bg-white/5 rounded-[2.5rem] p-8 border border-white/5 shadow-2xl relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-accent/10 pointer-events-none" />
          
          <div className="lg:col-span-4 text-center space-y-2">
            <span className="text-xs font-black uppercase tracking-[0.5em] text-primary">TEAM AZUL</span>
            <div className="text-9xl font-bebas text-white drop-shadow-[0_0_30px_rgba(59,130,246,0.4)] leading-none">{teamAScore}</div>
            <Badge variant="outline" className="border-primary/20 text-primary/60">{teamAPlayers.length}/7 JUGADORES</Badge>
          </div>

          <div className="lg:col-span-4 flex flex-col items-center justify-center gap-4 py-8">
             <div className="text-4xl font-light text-white/10 italic select-none">VS</div>
             <Button 
                onClick={handleSubmit} 
                disabled={isSubmitting} 
                className="h-16 px-12 font-bebas text-2xl tracking-[0.2em] bg-white text-black hover:bg-white/90 shadow-[0_0_40px_rgba(255,255,255,0.2)] rounded-none transition-all active:scale-95"
             >
                {isSubmitting ? <Loader2 className="h-6 w-6 animate-spin" /> : <><Save className="h-6 w-6 mr-2" /> ACTUALIZAR DATOS</>}
             </Button>
          </div>

          <div className="lg:col-span-4 text-center space-y-2">
            <span className="text-xs font-black uppercase tracking-[0.5em] text-accent">TEAM ROJO</span>
            <div className="text-9xl font-bebas text-white drop-shadow-[0_0_30px_rgba(244,63,94,0.4)] leading-none">{teamBScore}</div>
            <Badge variant="outline" className="border-accent/20 text-accent/60">{teamBPlayers.length}/7 JUGADORES</Badge>
          </div>
        </section>

        <section className="space-y-6 pb-32">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredPlayers?.map((player) => {
              const state = playerStates[player.id] || initialPlayerMatchState;
              const isBlue = state.team === 'A';
              const isRed = state.team === 'B';
              const isBench = state.team === null;

              return (
                <Card 
                  key={player.id} 
                  className={cn(
                    "competition-card group transition-all duration-300 border-2",
                    isBlue ? "border-primary bg-primary/10 shadow-lg shadow-primary/5" : 
                    isRed ? "border-accent bg-accent/10 shadow-lg shadow-accent/5" : 
                    "border-white/5 bg-black/40"
                  )}
                >
                  <CardContent className="p-5 flex flex-col h-full gap-5">
                    <div className="flex items-center gap-4">
                      <div className="relative shrink-0">
                        <Avatar className={cn(
                          "h-14 w-14 border-2 transition-all",
                          isBlue ? "border-primary" : isRed ? "border-accent" : "border-white/10"
                        )}>
                          <AvatarImage src={player.avatar} />
                          <AvatarFallback className="bg-zinc-900 font-bebas text-lg">{getInitials(player.name)}</AvatarFallback>
                        </Avatar>
                        {state.isCaptain && (
                          <div className="absolute -top-1 -left-1 bg-yellow-500 text-black p-1 rounded-full shadow-lg ring-2 ring-black">
                            <Shield className="h-3 w-3 fill-current" />
                          </div>
                        )}
                        {state.isMvp && (
                          <div className="absolute -top-1 -right-1 bg-white text-black p-1 rounded-full shadow-lg ring-2 ring-black">
                            <Star className="h-3 w-3 fill-current" />
                          </div>
                        )}
                        {state.hasBestGoal && (
                          <div className="absolute -bottom-1 -right-1 bg-orange-500 text-white p-1 rounded-full shadow-lg ring-2 ring-black">
                            <Target className="h-3 w-3" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="font-bold text-sm uppercase tracking-tight truncate text-white">{player.name}</h4>
                        <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40">{player.position || 'COMODÍN'}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-1.5 p-1 bg-black/40 rounded-xl border border-white/5">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => setPlayerTeam(player.id, 'A')}
                        className={cn(
                          "h-8 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all",
                          isBlue ? "bg-primary text-white hover:bg-primary/90" : "text-muted-foreground hover:bg-white/5"
                        )}
                      >
                        AZUL
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => setPlayerTeam(player.id, 'B')}
                        className={cn(
                          "h-8 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all",
                          isRed ? "bg-accent text-white hover:bg-accent/90" : "text-muted-foreground hover:bg-white/5"
                        )}
                      >
                        ROJO
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => setPlayerTeam(player.id, null)}
                        className={cn(
                          "h-8 text-[9px] font-black uppercase tracking-widest rounded-lg",
                          isBench ? "bg-white/10 text-white" : "text-muted-foreground/30 hover:text-white"
                        )}
                      >
                        {isBench ? "BANCO" : "QUITAR"}
                      </Button>
                    </div>

                    <div className="flex flex-col gap-4 pt-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon" onClick={() => updateGoals(player.id, -1)} className="h-8 w-8"><Minus className="h-3 w-3" /></Button>
                          <span className={cn("text-2xl font-bebas w-8 text-center", state.goals > 0 ? "text-white" : "text-white/20")}>{state.goals}</span>
                          <Button variant="ghost" size="icon" onClick={() => updateGoals(player.id, 1)} className="h-8 w-8"><Plus className="h-3 w-3" /></Button>
                        </div>

                        <div className="flex items-center gap-1">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button 
                                variant="ghost" size="icon" disabled={isBench}
                                className={cn("h-8 w-8 rounded-lg", state.isCaptain ? "bg-yellow-500 text-black" : "bg-white/5 text-muted-foreground/20")}
                                onClick={() => toggleCaptain(player.id, state.team!)}
                              ><Shield className="h-4 w-4" /></Button>
                            </TooltipTrigger>
                            <TooltipContent>CAPITÁN</TooltipContent>
                          </Tooltip>

                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button 
                                variant="ghost" size="icon" disabled={isBench}
                                className={cn("h-8 w-8 rounded-lg", state.isMvp ? "bg-white text-black" : "bg-white/5 text-muted-foreground/20")}
                                onClick={() => toggleMvp(player.id)}
                              ><Star className="h-4 w-4" /></Button>
                            </TooltipTrigger>
                            <TooltipContent>MVP</TooltipContent>
                          </Tooltip>

                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button 
                                variant="ghost" size="icon" disabled={isBench}
                                className={cn("h-8 w-8 rounded-lg", state.hasBestGoal ? "bg-orange-500 text-white" : "bg-white/5 text-muted-foreground/20")}
                                onClick={() => toggleBestGoal(player.id)}
                              ><Target className="h-4 w-4" /></Button>
                            </TooltipTrigger>
                            <TooltipContent>MEJOR GOL</TooltipContent>
                          </Tooltip>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>

        <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-background via-background/95 to-transparent z-50 pointer-events-none md:pl-[16rem]">
           <div className="max-w-7xl mx-auto flex items-center justify-end pointer-events-auto">
              <Button 
                 onClick={handleSubmit} 
                 disabled={isSubmitting} 
                 size="lg"
                 className="h-16 px-12 bg-primary text-white font-bebas text-2xl tracking-[0.2em] shadow-2xl shadow-primary/30 rounded-2xl hover:scale-105 active:scale-95 transition-all"
              >
                 {isSubmitting ? <Loader2 className="h-6 w-6 animate-spin" /> : <><Save className="h-6 w-6 mr-2" /> GUARDAR CAMBIOS</>}
              </Button>
           </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
