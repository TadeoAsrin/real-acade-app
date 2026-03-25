
'use client';

import * as React from 'react';
import { useSearchParams } from 'next/navigation';
import { calculateAggregatedStats } from "@/lib/data";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { useCollection, useMemoFirebase, useFirestore, useUser, useDoc } from "@/firebase";
import { collection, query, orderBy, doc } from "firebase/firestore";
import type { Player, Match, AggregatedPlayerStats } from "@/lib/definitions";
import { Loader2, TrendingUp, TrendingDown, Minus, Trophy, Target, Zap, Crown, ShieldCheck, Calendar, Info, AlertCircle, Sparkles, Medal, Shield } from "lucide-react";
import Link from 'next/link';
import { cn, getInitials } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const TrendIcon = ({ form }: { form: ('W' | 'D' | 'L')[] }) => {
  const last3 = form.slice(0, 3);
  const wins = last3.filter(r => r === 'W').length;
  const losses = last3.filter(r => r === 'L').length;
  if (wins >= 2) return <TrendingUp className="h-4 w-4 text-emerald-500" />;
  if (losses >= 2) return <TrendingDown className="h-4 w-4 text-red-500" />;
  return <Minus className="h-4 w-4 text-muted-foreground/40" />;
};

function StandingsContent() {
  const searchParams = useSearchParams();
  const firestore = useFirestore();
  const { user } = useUser();
  const [activeTab, setActiveTab] = React.useState("general");
  const [selectedMatchId, setSelectedMatchId] = React.useState<string>("");

  React.useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam) setActiveTab(tabParam);
  }, [searchParams]);

  const playersQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'players');
  }, [firestore]);

  const matchesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'matches'), orderBy('date', 'desc'));
  }, [firestore]);

  const adminRoleRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'roles_admin', user.uid);
  }, [firestore, user]);

  const { data: playersData, isLoading: playersLoading } = useCollection<Player>(playersQuery);
  const { data: matchesData, isLoading: matchesLoading } = useCollection<Match>(matchesQuery);
  const { data: adminRole } = useDoc<{isAdmin: boolean}>(adminRoleRef);

  const allPlayers = playersData || [];
  const allMatches = matchesData || [];
  const stats = React.useMemo(() => calculateAggregatedStats(allPlayers, allMatches), [allPlayers, allMatches]);

  React.useEffect(() => {
    if (allMatches.length > 0 && !selectedMatchId) {
      setSelectedMatchId(allMatches[0].id);
    }
  }, [allMatches, selectedMatchId]);

  if (playersLoading || matchesLoading) return <div className="flex h-[50vh] items-center justify-center"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>;

  const sortedGeneral = [...stats].sort((a, b) => 
    (b.wins * 3 + b.draws) - (a.wins * 3 + a.draws) || 
    b.efficiency - a.efficiency || 
    b.totalGoals - a.totalGoals
  );

  const sortedMastery = [...stats]
    .filter(p => p.matchesPlayed >= 2)
    .sort((a, b) => b.masteryIndex - a.masteryIndex || b.matchesPlayed - a.matchesPlayed);
  
  const sortedScorers = [...stats]
    .filter(p => p.totalGoals > 0)
    .sort((a, b) => b.totalGoals - a.totalGoals || b.goalsPerMatch - a.goalsPerMatch);

  const sniper = [...stats]
    .filter(p => p.matchesPlayed >= 3)
    .sort((a, b) => b.goalsPerMatch - a.goalsPerMatch || b.totalGoals - a.totalGoals)[0];
  
  const sortedEfficiency = [...stats]
    .filter(p => p.matchesPlayed >= 2)
    .sort((a, b) => b.efficiency - a.efficiency || b.matchesPlayed - a.matchesPlayed);

  const leadershipRanking = [...stats]
    .sort((a, b) => {
      const aNever = a.totalCaptaincies === 0;
      const bNever = b.totalCaptaincies === 0;
      if (aNever && !bNever) return -1;
      if (!aNever && bNever) return 1;
      if (aNever && bNever) return b.matchesPlayed - a.matchesPlayed;
      return b.captaincyPriorityScore - a.captaincyPriorityScore;
    });

  const suggestedCandidates = leadershipRanking.filter(p => p.isActive).slice(0, 2);
  const selectedMatch = allMatches.find(m => m.id === selectedMatchId);
  const matchScorers = selectedMatch ? [...selectedMatch.teamAPlayers, ...selectedMatch.teamBPlayers].filter(p => p.goals > 0).sort((a, b) => b.goals - a.goals) : [];

  return (
    <div className="flex flex-col gap-10 max-w-7xl mx-auto pb-20">
      <section className="cinematic-banner p-8 md:p-12">
        <div className="absolute inset-0 bg-black/40 pointer-events-none" />
        <div className="relative z-10 space-y-4">
          <div className="flex items-center gap-3">
            <Badge className="bg-primary text-primary-foreground font-bebas tracking-widest px-3 py-1 text-sm rounded-none shadow-lg shadow-primary/20">EDICIÓN ESPECIAL</Badge>
            <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em] font-oswald">COMPETICIÓN OFICIAL</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-bebas text-white tracking-wider leading-none uppercase">TABLA DE POSICIONES</h1>
          <p className="text-lg md:text-xl text-muted-foreground font-lora italic max-w-2xl">El registro histórico de la gloria y el esfuerzo en Real Acade.</p>
        </div>
      </section>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-black/40 border border-white/5 p-1 h-14 rounded-lg w-full flex overflow-x-auto no-scrollbar backdrop-blur-md shadow-2xl">
          {["General", "Jerarquía", "Goleadores", "Goles Fecha", "Efectividad", "Capitanes"].map((tab) => (
            <TabsTrigger key={tab.toLowerCase().replace(" ", "-")} value={tab.toLowerCase().replace(" ", "-")} className="flex-1 min-w-[120px] font-bebas tracking-widest text-lg data-[state=active]:bg-white data-[state=active]:text-black rounded-md transition-all">
              {tab}
            </TabsTrigger>
          ))}
        </TabsList>

        <div className="mt-10">
          <TabsContent value="general" className="animate-in fade-in slide-in-from-bottom-2">
            <Card className="competition-card border-none bg-black/20 backdrop-blur-sm">
              <Table>
                <TableHeader>
                  <TableRow className="bg-black/40 border-white/5 h-14">
                    <TableHead className="w-16 text-center font-bebas text-sm">POS</TableHead>
                    <TableHead className="font-bebas text-sm">JUGADOR</TableHead>
                    <TableHead className="text-center font-bebas text-sm">PJ</TableHead>
                    <TableHead className="text-center font-bebas text-sm">V-E-D</TableHead>
                    <TableHead className="text-center font-bebas text-sm text-yellow-500">GOLES</TableHead>
                    <TableHead className="text-center font-bebas text-sm">%</TableHead>
                    <TableHead className="text-center font-bebas text-sm bg-primary/10 text-primary">PTS</TableHead>
                    <TableHead className="text-center font-bebas text-sm">TREND</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedGeneral.map((player, index) => (
                    <TableRow key={player.playerId} className={cn("official-table-row h-20 transition-all", index === 0 ? "podium-1" : index === 1 ? "podium-2" : index === 2 ? "podium-3" : "")}>
                      <TableCell className="text-center font-bebas text-3xl italic">
                        {index === 0 ? <Crown className="h-6 w-6 mx-auto text-yellow-500 animate-pulse" /> : index + 1}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-4">
                          <Avatar className={cn("h-12 w-12 border-2", index === 0 ? "border-yellow-500 shadow-lg shadow-yellow-500/20" : "border-white/10")}>
                            <AvatarFallback className="bg-muted text-xs font-black">{getInitials(player.name)}</AvatarFallback>
                          </Avatar>
                          <Link href={`/players/${player.playerId}`} className="font-black uppercase tracking-tight hover:text-primary transition-colors text-lg italic">{player.name}</Link>
                        </div>
                      </TableCell>
                      <TableCell className="text-center font-bebas text-2xl">{player.matchesPlayed}</TableCell>
                      <TableCell className="text-center font-oswald text-[10px] tracking-widest font-bold">
                        <span className="text-emerald-500">{player.wins}</span>-<span className="text-orange-400">{player.draws}</span>-<span className="text-red-500">{player.losses}</span>
                      </TableCell>
                      <TableCell className="text-center font-bebas text-2xl text-yellow-500/80">{player.totalGoals}</TableCell>
                      <TableCell className="text-center font-bebas text-2xl text-muted-foreground/60">{player.efficiency}%</TableCell>
                      <TableCell className="text-center font-bebas text-4xl italic bg-primary/5 text-primary">{player.wins * 3 + player.draws}</TableCell>
                      <TableCell className="text-center"><TrendIcon form={player.form} /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          <TabsContent value="jerarquía" className="animate-in fade-in slide-in-from-bottom-2 space-y-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-6 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl">
              <div className="flex items-center gap-4">
                <div className="bg-emerald-500/20 p-3 rounded-full">
                  <Medal className="h-6 w-6 text-emerald-500" />
                </div>
                <div>
                  <h3 className="text-xl font-black italic uppercase text-emerald-500">Índice de Maestría (IM)</h3>
                  <p className="text-[10px] font-bold uppercase text-muted-foreground/60 tracking-widest">El ranking de equilibrio que premia la jerarquía táctica y defensiva.</p>
                </div>
              </div>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="sm" className="border-emerald-500/20 text-emerald-500 hover:bg-emerald-500/10">
                      <Info className="h-4 w-4 mr-2" /> REGLAS DEL ÍNDICE
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent className="bg-zinc-900 border-white/10 text-[10px] p-6 space-y-3 max-w-sm">
                    <p className="font-black text-emerald-500 uppercase tracking-widest border-b border-white/10 pb-2">CRITERIOS DE JERARQUÍA</p>
                    <div className="grid grid-cols-1 gap-2">
                      <div className="flex justify-between"><span>Base Rendimiento (W=3, E=1)</span> <span className="text-emerald-500">PROM / PJ</span></div>
                      <div className="flex justify-between"><span>Capitán de Victoria (Liderazgo)</span> <span className="text-emerald-500">+0.40 pts</span></div>
                      <div className="flex justify-between"><span>Valla Invicta (Solo DEF/GK)</span> <span className="text-emerald-500">+0.50 pts</span></div>
                      <div className="flex justify-between"><span>Resistencia (1 gol concedido - DEF/GK)</span> <span className="text-emerald-500">+0.25 pts</span></div>
                      <div className="flex justify-between"><span>Premio MVP (Figura)</span> <span className="text-emerald-500">+0.75 pts</span></div>
                      <div className="flex justify-between"><span>Mejor Gol (Joyita)</span> <span className="text-emerald-500">+0.25 pts</span></div>
                    </div>
                    <p className="text-[8px] italic text-muted-foreground pt-2 border-t border-white/5">Requiere mínimo 2 partidos jugados para ponderar.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>

            <Card className="competition-card border-none bg-black/20">
              <Table>
                <TableHeader>
                  <TableRow className="bg-black/40 border-white/5 h-14">
                    <TableHead className="w-16 text-center font-bebas text-sm">POS</TableHead>
                    <TableHead className="font-bebas text-sm">JUGADOR DE ÉLITE</TableHead>
                    <TableHead className="text-center font-bebas text-sm">PJ</TableHead>
                    <TableHead className="text-center font-bebas text-sm">DEFENSA</TableHead>
                    <TableHead className="text-center font-bebas text-sm">MANDO</TableHead>
                    <TableHead className="text-center font-bebas text-sm bg-emerald-500/10 text-emerald-500">ÍNDICE (IM)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedMastery.map((player, index) => (
                    <TableRow key={player.playerId} className={cn("official-table-row h-20", index === 0 ? "bg-emerald-500/5" : "")}>
                      <TableCell className="text-center font-bebas text-3xl italic">
                        {index === 0 ? <Medal className="h-6 w-6 mx-auto text-emerald-500 animate-pulse" /> : index + 1}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-4">
                          <Avatar className={cn("h-12 w-12 border-2", index === 0 ? "border-emerald-500 shadow-lg shadow-emerald-500/20" : "border-white/10")}>
                            <AvatarFallback className="bg-muted text-xs font-black">{getInitials(player.name)}</AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col">
                            <Link href={`/players/${player.playerId}`} className="font-black uppercase tracking-tight hover:text-emerald-500 transition-colors text-lg italic">{player.name}</Link>
                            <span className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest">{player.position || 'COMODÍN'}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-center font-bebas text-2xl text-muted-foreground">{player.matchesPlayed}</TableCell>
                      <TableCell className="text-center">
                        <div className="flex flex-col items-center">
                          <div className="flex items-center gap-1">
                            <Shield className="h-3 w-3 text-emerald-500/60" />
                            <span className="font-bebas text-xl text-white/80">{player.cleanSheets}</span>
                          </div>
                          <span className="text-[7px] font-black text-muted-foreground/40 uppercase font-oswald">VALLAS INV.</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex flex-col items-center">
                          <div className="flex items-center gap-1">
                            <Crown className="h-3 w-3 text-primary/60" />
                            <span className="font-bebas text-xl text-white/80">{player.winsAsCaptain}</span>
                          </div>
                          <span className="text-[7px] font-black text-muted-foreground/40 uppercase font-oswald">VICT. CAP.</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center font-bebas text-5xl italic text-emerald-500 bg-emerald-500/5">
                        {player.masteryIndex}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          <TabsContent value="goleadores" className="animate-in fade-in slide-in-from-bottom-2 space-y-6">
            <div className="flex items-center justify-center gap-3 p-4 bg-yellow-500/5 border border-yellow-500/10 rounded-lg">
              <Info className="h-4 w-4 text-yellow-500" />
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-yellow-500">PICHICHI OFICIAL: ORDENADO POR GOLES. DESEMPATE POR PROMEDIO G/PJ.</p>
            </div>

            <Card className="competition-card border-none bg-black/20">
              <Table>
                <TableHeader>
                  <TableRow className="bg-black/40 border-white/5 h-14">
                    <TableHead className="w-16 text-center font-bebas text-sm">POS</TableHead>
                    <TableHead className="font-bebas text-sm">ARTILLERO</TableHead>
                    <TableHead className="text-center font-bebas text-sm">PJ</TableHead>
                    <TableHead className="text-center font-bebas text-sm bg-yellow-500/10 text-yellow-500">GOLES</TableHead>
                    <TableHead className="text-center font-bebas text-sm">G/PJ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedScorers.map((player, index) => {
                    const isSniper = player.playerId === sniper?.playerId;
                    return (
                      <TableRow key={player.playerId} className={cn("official-table-row h-20", index === 0 ? "podium-1" : index === 1 ? "podium-2" : index === 2 ? "podium-3" : "")}>
                        <TableCell className="text-center font-bebas text-3xl italic">{index + 1}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-4">
                            <Avatar className="h-12 w-12 border-2 border-white/10"><AvatarFallback className="bg-muted text-xs font-black">{getInitials(player.name)}</AvatarFallback></Avatar>
                            <div className="flex flex-col">
                              <Link href={`/players/${player.playerId}`} className="font-black uppercase tracking-tight hover:text-yellow-500 flex items-center gap-2 text-lg italic">
                                {player.name}
                                {isSniper && <Target className="h-4 w-4 text-yellow-500" />}
                              </Link>
                              {isSniper && <span className="text-[8px] font-black text-yellow-500 uppercase tracking-widest font-oswald">MÁXIMA LETALIDAD</span>}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-center font-bebas text-2xl text-muted-foreground">{player.matchesPlayed}</TableCell>
                        <TableCell className="text-center font-bebas text-5xl italic bg-yellow-500/5 text-yellow-500">{player.totalGoals}</TableCell>
                        <TableCell className="text-center font-bebas text-3xl italic text-white/60">{player.goalsPerMatch}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          <TabsContent value="goles-fecha" className="animate-in fade-in slide-in-from-bottom-2 space-y-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-black/40 p-6 rounded-2xl border border-white/5 backdrop-blur-md shadow-2xl">
              <div className="flex items-center gap-3">
                <Calendar className="h-6 w-6 text-primary" />
                <span className="font-bebas text-2xl tracking-widest uppercase text-white">Seleccionar Jornada</span>
              </div>
              <Select value={selectedMatchId} onValueChange={setSelectedMatchId}>
                <SelectTrigger className="w-full md:w-[300px] font-black h-12 bg-black/60 border-white/10 italic uppercase rounded-none">
                  <SelectValue placeholder="Elegir partido" />
                </SelectTrigger>
                <SelectContent className="bg-surface-900 border-white/10">
                  {allMatches.map(m => (
                    <SelectItem key={m.id} value={m.id} className="font-bold uppercase italic">
                      {format(parseISO(m.date), "dd MMM yyyy", { locale: es })} • {m.teamAScore}-{m.teamBScore}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedMatch ? (
              <Card className="competition-card border-t-4 border-t-primary overflow-hidden shadow-2xl">
                <div className="bg-black/40 p-4 border-b border-white/5 flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">REPORTE DE ARTILLERÍA</span>
                  <Badge variant="outline" className="font-bebas tracking-widest text-primary border-primary/20 text-lg px-4 rounded-none">
                    {format(parseISO(selectedMatch.date), "PPPP", { locale: es })}
                  </Badge>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow className="bg-black/20 border-white/5 h-12">
                      <TableHead className="pl-8 font-bebas text-xs uppercase">Jugador</TableHead>
                      <TableHead className="text-center font-bebas text-xs uppercase">Equipo</TableHead>
                      <TableHead className="text-right pr-8 font-bebas text-xs uppercase text-yellow-500">Goles en Fecha</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {matchScorers.length > 0 ? matchScorers.map((stat) => {
                      const player = allPlayers.find(p => p.id === stat.playerId);
                      const isBlue = selectedMatch.teamAPlayers.some(p => p.playerId === stat.playerId);
                      return (
                        <TableRow key={stat.playerId} className="official-table-row h-20">
                          <TableCell className="pl-8">
                            <div className="flex items-center gap-4">
                              <Avatar className="h-10 w-10 border border-white/10"><AvatarFallback className="text-[10px] font-black">{getInitials(player?.name || "?")}</AvatarFallback></Avatar>
                              <span className="font-black uppercase text-lg italic text-white">{player?.name}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge className={cn("uppercase font-black text-[10px] italic rounded-none px-3 shadow-lg", isBlue ? "bg-primary" : "bg-accent")}>
                              {isBlue ? "AZUL" : "ROJO"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right pr-8 font-bebas text-5xl italic text-yellow-500">
                            {stat.goals}
                          </TableCell>
                        </TableRow>
                      );
                    }) : (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center py-24 opacity-20 italic font-bebas text-2xl tracking-widest">No se registraron goles en esta jornada.</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </Card>
            ) : null}
          </TabsContent>

          <TabsContent value="efectividad" className="animate-in fade-in slide-in-from-bottom-2 space-y-6">
            <div className="flex items-center justify-center gap-3 p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-lg">
              <AlertCircle className="h-4 w-4 text-emerald-500" />
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-500">REQUISITO: MÍNIMO 2 PARTIDOS JUGADOS</p>
            </div>
            
            <Card className="competition-card border-none bg-black/20">
              <Table>
                <TableHeader>
                  <TableRow className="bg-black/40 border-white/5 h-14">
                    <TableHead className="w-16 text-center font-bebas text-sm">POS</TableHead>
                    <TableHead className="font-bebas text-sm">JUGADOR</TableHead>
                    <TableHead className="text-center font-bebas text-sm">PJ</TableHead>
                    <TableHead className="text-center font-bebas text-sm">V-E-D</TableHead>
                    <TableHead className="text-center font-bebas text-sm bg-emerald-500/10 text-emerald-500">EFECTIVIDAD %</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedEfficiency.map((player, index) => (
                    <TableRow key={player.playerId} className={cn("official-table-row h-20", index === 0 ? "podium-1" : index === 1 ? "podium-2" : index === 2 ? "podium-3" : "")}>
                      <TableCell className="text-center font-bebas text-3xl italic">{index + 1}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-4">
                          <Avatar className="h-12 w-12 border-2 border-white/10"><AvatarFallback className="bg-muted text-xs font-black">{getInitials(player.name)}</AvatarFallback></Avatar>
                          <Link href={`/players/${player.playerId}`} className="font-black uppercase tracking-tight hover:text-emerald-500 text-lg italic">{player.name}</Link>
                        </div>
                      </TableCell>
                      <TableCell className="text-center font-bebas text-2xl text-muted-foreground">{player.matchesPlayed}</TableCell>
                      <TableCell className="text-center font-oswald text-xs tracking-widest font-bold">
                        <span className="text-emerald-500">{player.wins}</span>-<span className="text-orange-400">{player.draws}</span>-<span className="text-red-500">{player.losses}</span>
                      </TableCell>
                      <TableCell className="text-center font-bebas text-5xl italic bg-emerald-500/5 text-emerald-500">
                        {player.efficiency}%
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          <TabsContent value="capitanes" className="animate-in fade-in slide-in-from-bottom-2 space-y-12">
            {suggestedCandidates.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {suggestedCandidates.map((cap, idx) => (
                  <Card key={cap.playerId} className="competition-card border-t-4 border-t-emerald-500 bg-surface-900 relative group hover-lift overflow-hidden shadow-2xl">
                    <div className="absolute top-0 right-0 p-4 opacity-5"><Crown className="h-24 w-24 text-emerald-500" /></div>
                    <CardContent className="p-10 flex items-center gap-8">
                      <div className="relative">
                        <Avatar className="h-24 w-24 border-4 border-emerald-500/20 shadow-2xl shadow-emerald-500/20">
                          <AvatarFallback className="text-4xl font-bebas bg-emerald-500/10 text-emerald-500">{getInitials(cap.name)}</AvatarFallback>
                        </Avatar>
                        <Badge className="absolute -bottom-2 -right-2 bg-emerald-500 text-black font-bebas px-3 py-1 rounded-none text-lg shadow-lg">CANDIDATO</Badge>
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase text-emerald-500 tracking-[0.3em] font-oswald mb-1">MANDO SUGERIDO #{idx + 1}</p>
                        <h3 className="text-5xl font-bebas text-white uppercase leading-none">{cap.name}</h3>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase mt-2 tracking-widest font-oswald">{cap.totalCaptaincies === 0 ? "DEBUT HISTÓRICO PENDIENTE" : "PRIORIDAD POR ASISTENCIA"}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            <Card className="competition-card border-none bg-black/20 shadow-2xl">
              <Table>
                <TableHeader>
                  <TableRow className="bg-black/40 border-white/5 h-14">
                    <TableHead className="pl-8 font-bebas text-sm">JUGADOR</TableHead>
                    <TableHead className="text-center font-bebas text-sm">PJ</TableHead>
                    <TableHead className="text-center font-bebas text-sm">CAPI</TableHead>
                    <TableHead className="text-right pr-8 font-bebas text-sm">ESTADO</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leadershipRanking.map((player) => (
                    <TableRow key={player.playerId} className={cn("official-table-row h-16", !player.isActive && "opacity-40")}>
                      <TableCell className="pl-8">
                        <div className="flex items-center gap-4">
                          <Avatar className="h-10 w-10 border border-white/10"><AvatarFallback className="text-[10px] font-black">{getInitials(player.name)}</AvatarFallback></Avatar>
                          <div className="flex flex-col">
                            <Link href={`/players/${player.playerId}`} className="font-black text-base uppercase hover:text-primary transition-colors italic">{player.name}</Link>
                            {!player.isActive && <span className="text-[7px] font-black text-muted-foreground uppercase tracking-widest font-oswald">EN RESERVA</span>}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-center font-bebas text-2xl italic text-muted-foreground">{player.matchesPlayed}</TableCell>
                      <TableCell className="text-center font-bebas text-3xl text-white italic">{player.totalCaptaincies}</TableCell>
                      <TableCell className="text-right pr-8">
                        <Badge variant="outline" className={cn("text-[8px] uppercase font-black rounded-none px-3 py-1", player.totalCaptaincies === 0 ? "border-emerald-500 text-emerald-500 bg-emerald-500/5 shadow-[0_0_15px_rgba(16,185,129,0.1)]" : "border-white/10 text-muted-foreground")}>
                          {player.totalCaptaincies === 0 ? "EL REY SIN CORONA" : "VETERANO DE MANDO"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}

export default function StandingsPage() {
  return (
    <React.Suspense fallback={<div className="flex h-[50vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}>
      <StandingsContent />
    </React.Suspense>
  );
}
