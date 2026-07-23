'use client';

import * as React from 'react';
import { useFirestore, useCollection, useMemoFirebase, useUser, addDocumentNonBlocking } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { useSeason } from '@/context/season-context';
import type { Player, PlayerStats } from '@/lib/definitions';
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
  AlertTriangle,
  ChevronRight,
  Users,
  Trophy
} from 'lucide-react';
import { getInitials, cn } from '@/lib/utils';

// Estado inicial para un jugador en el partido
const initialPlayerMatchState = {
  selected: false,
  team: null as 'A' | 'B' | null,
  goals: 0,
  isCaptain: false,
  isMvp: false,
};

export default function NewMatchPage() {
  const firestore = useFirestore();
  const { activeSeasonId, loading: seasonLoading } = useSeason();
  const { toast } = useToast();
  const router = useRouter();

  // 1. Cargar Jugadores
  const playersRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'players'), orderBy('name', 'asc'));
  }, [firestore]);
  const { data: players, isLoading: playersLoading } = useCollection<Player>(playersRef);

  // 2. Estado del Partido
  const [date, setDate] = React.useState(new Date().toISOString().split('T')[0]);
  const [playerStates, setPlayerMatchStates] = React.useState<Record<string, typeof initialPlayerMatchState>>({});
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Inicializar estados cuando cargan los jugadores
  React.useEffect(() => {
    if (players) {
      const states: Record<string, typeof initialPlayerMatchState> = {};
      players.forEach(p => {
        states[p.id] = { ...initialPlayerMatchState };
      });
      setPlayerMatchStates(states);
    }
  }, [players]);

  // 3. Cálculos automáticos (Memoizados)
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

  // 4. Handlers de UI
  const togglePlayerTeam = (playerId: string) => {
    setPlayerMatchStates(prev => {
      const current = prev[playerId];
      let nextTeam: 'A' | 'B' | null = 'A';
      if (current.team === 'A') nextTeam = 'B';
      else if (current.team === 'B') nextTeam = null;

      return {
        ...prev,
        [playerId]: { 
          ...current, 
          team: nextTeam,
          selected: nextTeam !== null,
          // Reset stats if removed from teams
          goals: nextTeam === null ? 0 : current.goals,
          isCaptain: nextTeam === null ? false : current.isCaptain,
          isMvp: nextTeam === null ? false : current.isMvp,
        }
      };
    });
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
      // Quitar capitanía a otros del mismo equipo
      Object.keys(newStates).forEach(id => {
        if (newStates[id].team === team) newStates[id].isCaptain = false;
      });
      newStates[playerId].isCaptain = true;
      return newStates;
    });
  };

  const toggleMvp = (playerId: string) => {
    setPlayerMatchStates(prev => {
      const newStates = { ...prev };
      Object.keys(newStates).forEach(id => newStates[id].isMvp = false);
      newStates[playerId].isMvp = true;
      return newStates;
    });
  };

  // 5. Envío de Datos
  const handleSubmit = async () => {
    if (!firestore || !activeSeasonId) return;

    if (teamAPlayers.length === 0 || teamBPlayers.length === 0) {
      toast({ variant: "destructive", title: "Equipos incompletos", description: "Debes asignar al menos un jugador por equipo." });
      return;
    }

    // Warnings (No bloqueantes)
    const hasCaptainA = teamAPlayers.some(([_, s]) => s.isCaptain);
    const hasCaptainB = teamBPlayers.some(([_, s]) => s.isCaptain);
    const hasMvp = [...teamAPlayers, ...teamBPlayers].some(([_, s]) => s.isMvp);

    if (!hasCaptainA || !hasCaptainB || !hasMvp) {
       // En un flujo real usaríamos un Confirm Dialog, aquí lanzamos un aviso previo al save
       console.warn("Faltan datos de honor (Capitán/MVP), procediendo igualmente.");
    }

    setIsSubmitting(true);
    try {
      const matchData = {
        seasonId: activeSeasonId,
        date: new Date(date).toISOString(),
        teamAScore,
        teamBScore,
        teamAPlayers: teamAPlayers.map(([id, s]) => ({
          playerId: id,
          goals: s.goals,
          isCaptain: s.isCaptain,
          isMvp: s.isMvp
        })),
        teamBPlayers: teamBPlayers.map(([id, s]) => ({
          playerId: id,
          goals: s.goals,
          isCaptain: s.isCaptain,
          isMvp: s.isMvp
        })),
        createdAt: new Date().toISOString(),
      };

      await addDocumentNonBlocking(collection(firestore, 'matches'), matchData);
      
      toast({ title: "¡Victoria!", description: "El partido ha sido registrado en la temporada actual." });
      router.push('/matches');
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message });
      setIsSubmitting(false);
    }
  };

  if (playersLoading || seasonLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="font-bebas text-xl tracking-widest text-muted-foreground uppercase">Preparando planilla de élite...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4 lg:p-8 space-y-10 animate-in fade-in duration-700">
      {/* HEADER DINÁMICO */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <h2 className="text-4xl lg:text-7xl font-black uppercase tracking-tighter italic text-white flex items-center gap-4">
            <Goal className="h-8 w-8 lg:h-14 lg:w-14 text-primary shrink-0" />
            NUEVA BATALLA
          </h2>
          <p className="text-[10px] lg:text-xs font-black uppercase tracking-[0.4em] text-primary/60 ml-1">
            CARGA DE RESULTADOS • SISTEMA DE ÉLITE
          </p>
        </div>
        <div className="bg-black/40 border border-white/10 p-4 rounded-xl flex items-center gap-4 shadow-xl">
           <div className="space-y-1">
              <p className="text-[8px] font-black uppercase text-muted-foreground tracking-widest">FECHA DEL ENCUENTRO</p>
              <Input 
                type="date" 
                value={date} 
                onChange={(e) => setDate(e.target.value)} 
                className="bg-transparent border-none p-0 h-auto font-bebas text-2xl text-white focus-visible:ring-0"
              />
           </div>
        </div>
      </div>

      {/* MARCADOR EN TIEMPO REAL */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center bg-white/5 rounded-[2.5rem] p-8 border border-white/5 shadow-2xl relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-accent/5 pointer-events-none" />
        
        <div className="lg:col-span-4 text-center space-y-4 relative z-10">
          <span className="text-xs font-black uppercase tracking-[0.5em] text-primary">TEAM AZUL</span>
          <div className="text-9xl font-bebas text-white drop-shadow-[0_0_30px_rgba(59,130,246,0.3)] leading-none">{teamAScore}</div>
          <p className="text-[10px] font-bold text-muted-foreground uppercase">{teamAPlayers.length} JUGADORES</p>
        </div>

        <div className="lg:col-span-4 flex flex-col items-center justify-center gap-6 relative z-10">
           <div className="h-16 w-[1px] bg-white/10" />
           <div className="text-4xl font-light text-white/10 italic">VS</div>
           <div className="h-16 w-[1px] bg-white/10" />
           <Button 
              onClick={handleSubmit} 
              disabled={isSubmitting || !activeSeasonId} 
              className="h-16 px-10 font-bebas text-2xl tracking-[0.2em] bg-white text-black hover:bg-white/90 shadow-[0_0_50px_rgba(255,255,255,0.2)] rounded-none transition-all group"
           >
              {isSubmitting ? <Loader2 className="h-6 w-6 animate-spin" /> : <><Save className="h-6 w-6 mr-2" /> FINALIZAR CARGA</>}
           </Button>
        </div>

        <div className="lg:col-span-4 text-center space-y-4 relative z-10">
          <span className="text-xs font-black uppercase tracking-[0.5em] text-accent">TEAM ROJO</span>
          <div className="text-9xl font-bebas text-white drop-shadow-[0_0_30px_rgba(244,63,94,0.3)] leading-none">{teamBScore}</div>
          <p className="text-[10px] font-bold text-muted-foreground uppercase">{teamBPlayers.length} JUGADORES</p>
        </div>
      </section>

      {/* ROSTER DE SELECCIÓN MASIVA */}
      <section className="space-y-6">
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-3">
             <Users className="h-5 w-5 text-muted-foreground/40" />
             <h3 className="text-sm font-black uppercase tracking-[0.3em] text-muted-foreground/60">PLANTILLA DISPONIBLE</h3>
          </div>
          <Badge variant="outline" className="text-[8px] font-black tracking-widest border-white/10 text-muted-foreground/40">FILTRAR POR POSICIÓN</Badge>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          {players?.map((player) => {
            const state = playerStates[player.id] || initialPlayerMatchState;
            const isBlue = state.team === 'A';
            const isRed = state.team === 'B';
            const isUnselected = state.team === null;

            return (
              <Card 
                key={player.id} 
                className={cn(
                  "competition-card group transition-all duration-500 cursor-pointer overflow-hidden border-2",
                  isBlue ? "border-primary bg-primary/10" : 
                  isRed ? "border-accent bg-accent/10" : 
                  "border-white/5 bg-black/40 hover:border-white/20"
                )}
                onClick={() => togglePlayerTeam(player.id)}
              >
                <CardContent className="p-4 space-y-4">
                  {/* Info Jugador */}
                  <div className="flex flex-col items-center text-center gap-3">
                    <div className="relative">
                      <Avatar className={cn(
                        "h-16 w-16 border-2 transition-transform duration-500 group-hover:scale-110",
                        isBlue ? "border-primary shadow-lg shadow-primary/20" : 
                        isRed ? "border-accent shadow-lg shadow-accent/20" : 
                        "border-white/10"
                      )}>
                        <AvatarImage src={player.avatar} />
                        <AvatarFallback className="bg-zinc-900 font-bebas text-xl">{getInitials(player.name)}</AvatarFallback>
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
                    </div>
                    <div className="space-y-0.5">
                      <h4 className={cn(
                        "font-bold text-xs uppercase tracking-tight truncate w-full",
                        !isUnselected ? "text-white" : "text-muted-foreground/60"
                      )}>{player.name.split(' ')[0]}</h4>
                      <p className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/30">{player.position || 'COMODÍN'}</p>
                    </div>
                  </div>

                  {/* Controles de Élite (Solo si está seleccionado) */}
                  {!isUnselected && (
                    <div className="pt-3 border-t border-white/10 space-y-3 animate-in fade-in zoom-in duration-300">
                      {/* Goles */}
                      <div className="flex items-center justify-between">
                         <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-6 w-6 rounded-full hover:bg-white/10"
                            onClick={(e) => { e.stopPropagation(); updateGoals(player.id, -1); }}
                         >
                            <Minus className="h-3 w-3" />
                         </Button>
                         <div className="flex flex-col items-center">
                            <span className="text-2xl font-bebas leading-none">{state.goals}</span>
                            <span className="text-[6px] font-black uppercase text-muted-foreground/60">GOLES</span>
                         </div>
                         <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-6 w-6 rounded-full hover:bg-white/10"
                            onClick={(e) => { e.stopPropagation(); updateGoals(player.id, 1); }}
                         >
                            <Plus className="h-3 w-3" />
                         </Button>
                      </div>

                      {/* Honorarios */}
                      <div className="flex items-center justify-center gap-2">
                         <Button 
                            variant="ghost" 
                            size="icon" 
                            className={cn("h-7 w-7 rounded-lg transition-colors", state.isCaptain ? "bg-yellow-500/20 text-yellow-500" : "text-muted-foreground/20 hover:text-white")}
                            onClick={(e) => { e.stopPropagation(); toggleCaptain(player.id, state.team!); }}
                            title="Capitán"
                         >
                            <Shield className="h-4 w-4" />
                         </Button>
                         <Button 
                            variant="ghost" 
                            size="icon" 
                            className={cn("h-7 w-7 rounded-lg transition-colors", state.isMvp ? "bg-white/20 text-white" : "text-muted-foreground/20 hover:text-white")}
                            onClick={(e) => { e.stopPropagation(); toggleMvp(player.id); }}
                            title="MVP"
                         >
                            <Star className="h-4 w-4" />
                         </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* FOOTER DE ESTADO */}
      <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-background via-background/95 to-transparent z-40 pointer-events-none md:pl-[16rem]">
         <div className="max-w-7xl mx-auto flex items-center justify-between pointer-events-auto">
            <div className="flex items-center gap-6 bg-black/60 backdrop-blur-xl border border-white/5 p-4 rounded-2xl shadow-2xl">
               <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-lg bg-primary/20 flex items-center justify-center">
                     <span className="font-bebas text-2xl text-primary">{teamAScore}</span>
                  </div>
                  <div className="h-4 w-[1px] bg-white/10" />
                  <div className="h-10 w-10 rounded-lg bg-accent/20 flex items-center justify-center">
                     <span className="font-bebas text-2xl text-accent">{teamBScore}</span>
                  </div>
               </div>
               <div className="h-8 w-[1px] bg-white/10" />
               <div className="flex flex-col">
                  <span className="text-[8px] font-black uppercase text-muted-foreground tracking-widest">TEMPORADA ACTIVA</span>
                  <span className="text-[10px] font-bold text-white uppercase italic">
                    {seasonLoading ? 'Sincronizando...' : 'Ciclo Oficial Seleccionado'}
                  </span>
               </div>
            </div>

            <Button 
               onClick={handleSubmit} 
               disabled={isSubmitting || !activeSeasonId} 
               size="lg"
               className="h-14 px-12 bg-primary text-white font-bebas text-xl tracking-widest shadow-xl shadow-primary/20 rounded-xl"
            >
               {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <Save className="h-5 w-5 mr-2" />}
               GUARDAR PARTIDO
            </Button>
         </div>
      </div>

      {/* ESPACIADOR PARA FOOTER FIX */}
      <div className="h-24" />
    </div>
  );
}
