'use client';

import * as React from 'react';
import { useFirestore, useCollection, useMemoFirebase, addDocumentNonBlocking } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { useSeason } from '@/context/season-context';
import type { Player } from '@/lib/definitions';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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
  FileText,
  Video,
  Image as ImageIcon,
  Trash2
} from 'lucide-react';
import { getInitials, cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const initialPlayerMatchState = {
  team: null as 'A' | 'B' | null,
  goals: 0,
  isCaptain: false,
  isMvp: false,
  hasBestGoal: false,
};

export default function NewMatchPage() {
  const firestore = useFirestore();
  const { activeSeasonId, loading: seasonLoading } = useSeason();
  const { toast } = useToast();
  const router = useRouter();

  const [searchTerm, setSearchTerm] = React.useState('');
  const playersRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'players'), orderBy('name', 'asc'));
  }, [firestore]);
  const { data: players, isLoading: playersLoading } = useCollection<Player>(playersRef);

  const [date, setDate] = React.useState(new Date().toISOString().split('T')[0]);
  const [playerStates, setPlayerMatchStates] = React.useState<Record<string, typeof initialPlayerMatchState>>({});
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Social Chronicle State
  const [comment, setComment] = React.useState('');
  const [videoUrl, setVideoUrl] = React.useState('');
  const [photoUrls, setPhotos] = React.useState<string[]>(['']);

  React.useEffect(() => {
    if (players) {
      const states: Record<string, typeof initialPlayerMatchState> = {};
      players.forEach(p => {
        states[p.id] = { ...initialPlayerMatchState };
      });
      setPlayerMatchStates(states);
    }
  }, [players]);

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
        if (newStates[id].team === team) {
          newStates[id] = { ...newStates[id], isCaptain: false };
        }
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

  const handleAddPhoto = () => {
    if (photoUrls.length < 5) setPhotos([...photoUrls, '']);
  };

  const handlePhotoChange = (idx: number, val: string) => {
    const next = [...photoUrls];
    next[idx] = val;
    setPhotos(next);
  };

  const handleRemovePhoto = (idx: number) => {
    const next = photoUrls.filter((_, i) => i !== idx);
    if (next.length === 0) next.push('');
    setPhotos(next);
  };

  const handleSubmit = async () => {
    if (!firestore || !activeSeasonId) return;

    if (teamAPlayers.length === 0 || teamBPlayers.length === 0) {
      toast({ variant: "destructive", title: "Equipos incompletos", description: "Asigna jugadores al equipo Azul y Rojo." });
      return;
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
        comment: comment.trim(),
        videoUrl: videoUrl.trim(),
        photos: photoUrls.filter(url => url.trim() !== ''),
        createdAt: new Date().toISOString(),
      };

      await addDocumentNonBlocking(collection(firestore, 'matches'), matchData);
      toast({ title: "¡Partido Guardado!", description: "El resultado se ha registrado con éxito." });
      router.push('/matches');
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message });
      setIsSubmitting(false);
    }
  };

  const filteredPlayers = players?.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (playersLoading || seasonLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="font-bebas text-xl tracking-widest text-muted-foreground uppercase">Preparando planilla oficial...</p>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="max-w-7xl mx-auto p-4 lg:p-8 space-y-8 animate-in fade-in duration-700">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-1">
            <h2 className="text-4xl lg:text-7xl font-black uppercase tracking-tighter italic text-white flex items-center gap-4">
              <Goal className="h-8 w-8 lg:h-14 lg:w-14 text-primary shrink-0" />
              NUEVA BATALLA
            </h2>
            <p className="text-[10px] lg:text-xs font-black uppercase tracking-[0.4em] text-primary/60 ml-1">
              SISTEMA DE CARGA PROFESIONAL
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
                disabled={isSubmitting || !activeSeasonId} 
                className="h-16 px-12 font-bebas text-2xl tracking-[0.2em] bg-white text-black hover:bg-white/90 shadow-[0_0_40px_rgba(255,255,255,0.2)] rounded-none transition-all active:scale-95"
             >
                {isSubmitting ? <Loader2 className="h-6 w-6 animate-spin" /> : <><Save className="h-6 w-6 mr-2" /> GUARDAR PARTIDO</>}
             </Button>
          </div>

          <div className="lg:col-span-4 text-center space-y-2">
            <span className="text-xs font-black uppercase tracking-[0.5em] text-accent">TEAM ROJO</span>
            <div className="text-9xl font-bebas text-white drop-shadow-[0_0_30px_rgba(244,63,94,0.4)] leading-none">{teamBScore}</div>
            <Badge variant="outline" className="border-accent/20 text-accent/60">{teamBPlayers.length}/7 JUGADORES</Badge>
          </div>
        </section>

        <section className="space-y-6">
          <div className="flex items-center gap-3 px-2">
             <Users className="h-5 w-5 text-muted-foreground/40" />
             <h3 className="text-sm font-black uppercase tracking-[0.3em] text-muted-foreground/60">PLANTILLA DEL CLUB</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredPlayers?.map((player) => {
              const state = playerStates[player.id] || initialPlayerMatchState;
              const isBlue = state.team === 'A';
              const isRed = state.team === 'B';
              const isBench = state.team === null;

              const isBlueFull = teamAPlayers.length >= 7 && !isBlue;
              const isRedFull = teamBPlayers.length >= 7 && !isRed;

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
                        disabled={isBlueFull}
                        onClick={() => setPlayerTeam(player.id, 'A')}
                        className={cn(
                          "h-8 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all",
                          isBlue ? "bg-primary text-white hover:bg-primary/90" : "text-muted-foreground hover:bg-white/5",
                          isBlueFull && "opacity-20 cursor-not-allowed"
                        )}
                      >
                        AZUL
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        disabled={isRedFull}
                        onClick={() => setPlayerTeam(player.id, 'B')}
                        className={cn(
                          "h-8 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all",
                          isRed ? "bg-accent text-white hover:bg-accent/90" : "text-muted-foreground hover:bg-white/5",
                          isRedFull && "opacity-20 cursor-not-allowed"
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
                          <Button 
                            variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-white/10"
                            onClick={() => updateGoals(player.id, -1)}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <div className="flex flex-col items-center w-8">
                            <span className={cn("text-2xl font-bebas leading-none", state.goals > 0 ? "text-white" : "text-white/20")}>
                              {state.goals}
                            </span>
                          </div>
                          <Button 
                            variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-white/10"
                            onClick={() => updateGoals(player.id, 1)}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>

                        <div className="flex items-center gap-1">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button 
                                variant="ghost" size="icon" 
                                disabled={isBench}
                                className={cn(
                                  "h-8 w-8 rounded-lg transition-all", 
                                  state.isCaptain ? "bg-yellow-500 text-black shadow-lg" : "bg-white/5 text-muted-foreground/20 hover:text-white"
                                )}
                                onClick={() => !isBench && toggleCaptain(player.id, state.team!)}
                              >
                                <Shield className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent className="bg-zinc-900 border-white/10 text-[10px] font-bold uppercase tracking-widest p-2">
                              DEFINIR COMO CAPITÁN
                            </TooltipContent>
                          </Tooltip>

                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button 
                                variant="ghost" size="icon" 
                                disabled={isBench}
                                className={cn(
                                  "h-8 w-8 rounded-lg transition-all", 
                                  state.isMvp ? "bg-white text-black shadow-lg" : "bg-white/5 text-muted-foreground/20 hover:text-white"
                                )}
                                onClick={() => !isBench && toggleMvp(player.id)}
                              >
                                <Star className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent className="bg-zinc-900 border-white/10 text-[10px] font-bold uppercase tracking-widest p-2">
                              MVP DE LA JORNADA
                            </TooltipContent>
                          </Tooltip>

                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button 
                                variant="ghost" size="icon" 
                                disabled={isBench}
                                className={cn(
                                  "h-8 w-8 rounded-lg transition-all", 
                                  state.hasBestGoal ? "bg-orange-500 text-white shadow-lg" : "bg-white/5 text-muted-foreground/20 hover:text-white"
                                )}
                                onClick={() => !isBench && toggleBestGoal(player.id)}
                              >
                                <Target className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent className="bg-zinc-900 border-white/10 text-[10px] font-bold uppercase tracking-widest p-2">
                              PREMIO AL MEJOR GOL
                            </TooltipContent>
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

        {/* CRÓNICA SOCIAL SECTION */}
        <section className="space-y-6 pb-40">
          <div className="flex items-center gap-3 px-2">
             <ImageIcon className="h-5 w-5 text-muted-foreground/40" />
             <h3 className="text-sm font-black uppercase tracking-[0.3em] text-muted-foreground/60">4. LA CRÓNICA SOCIAL</h3>
          </div>

          <Card className="competition-card border-white/5 bg-black/40 p-6 lg:p-10 space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
              <div className="space-y-4">
                <Label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-primary/60">
                  <FileText className="h-3 w-3" /> Resumen del Administrador
                </Label>
                <Textarea 
                  placeholder="Escribe la mística del partido, anécdotas o análisis táctico..."
                  className="min-h-[200px] bg-black/40 border-white/10 focus:border-primary/40 text-sm leading-relaxed"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                />
              </div>

              <div className="space-y-8">
                <div className="space-y-4">
                  <Label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-primary/60">
                    <Video className="h-3 w-3" /> Link de la Cámara (Video)
                  </Label>
                  <Input 
                    placeholder="URL de YouTube, Drive o Instagram..."
                    className="bg-black/40 border-white/10 h-12"
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                  />
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-primary/60">
                      <ImageIcon className="h-3 w-3" /> Galería de Fotos (Máx 5)
                    </Label>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={handleAddPhoto} 
                      disabled={photoUrls.length >= 5}
                      className="h-6 text-[8px] font-black uppercase tracking-widest hover:bg-primary/10 hover:text-primary"
                    >
                      <Plus className="h-3 w-3 mr-1" /> AÑADIR URL
                    </Button>
                  </div>
                  
                  <div className="space-y-3">
                    {photoUrls.map((url, idx) => (
                      <div key={idx} className="flex gap-2">
                        <Input 
                          placeholder={`URL de la foto #${idx + 1}`}
                          className="bg-black/40 border-white/10 flex-1"
                          value={url}
                          onChange={(e) => handlePhotoChange(idx, e.target.value)}
                        />
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleRemovePhoto(idx)}
                          className="h-10 w-10 text-muted-foreground/40 hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </section>

        <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-background via-background/95 to-transparent z-50 pointer-events-none md:pl-[16rem]">
           <div className="max-w-7xl mx-auto flex items-center justify-between pointer-events-auto">
              <div className="flex items-center gap-6 bg-black/80 backdrop-blur-xl border border-white/10 p-4 rounded-2xl shadow-[0_-20px_50px_rgba(0,0,0,0.5)]">
                 <div className="flex items-center gap-4">
                    <div className="flex flex-col items-center">
                       <span className="text-2xl font-bebas text-primary leading-none">{teamAScore}</span>
                       <span className="text-[8px] font-black uppercase text-primary/60">AZUL</span>
                    </div>
                    <div className="h-8 w-[1px] bg-white/10" />
                    <div className="flex flex-col items-center">
                       <span className="text-2xl font-bebas text-accent leading-none">{teamBScore}</span>
                       <span className="text-[8px] font-black uppercase text-accent/60">ROJO</span>
                    </div>
                 </div>
                 <div className="h-10 w-[1px] bg-white/10" />
                 <div className="flex flex-col">
                    <span className="text-[8px] font-black uppercase text-muted-foreground tracking-widest">TEMPORADA ACTIVA</span>
                    <span className="text-[10px] font-bold text-white uppercase italic">
                      {activeSeasonId ? "Ciclo Oficial en Curso" : "Sincronizando..."}
                    </span>
                 </div>
              </div>

              <Button 
                 onClick={handleSubmit} 
                 disabled={isSubmitting || !activeSeasonId} 
                 size="lg"
                 className="h-16 px-12 bg-primary text-white font-bebas text-2xl tracking-[0.2em] shadow-2xl shadow-primary/30 rounded-2xl hover:scale-105 active:scale-95 transition-all"
              >
                 {isSubmitting ? <Loader2 className="h-6 w-6 animate-spin" /> : <><Save className="h-6 w-6 mr-2" /> FINALIZAR CARGA</>}
              </Button>
           </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
