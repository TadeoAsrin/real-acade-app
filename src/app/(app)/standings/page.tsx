
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useCollection, useMemoFirebase, useFirestore, useUser, useDoc } from "@/firebase";
import { collection, query, orderBy, doc } from "firebase/firestore";
import type { Player, Match, AggregatedPlayerStats } from "@/lib/definitions";
import { Loader2, Trophy, Target, Zap, Crown, TrendingUp, TrendingDown, Minus, Calendar, ChevronRight, Users, Star, Info, Sparkles, Swords } from "lucide-react";
import Link from 'next/link';
import { cn, getInitials } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
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
  const [selectedMatchId, setSelectedMatchId] = React.useState<string | null>(null);

  React.useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam) {
      setActiveTab(tabParam);
    } else {
      const saved = localStorage.getItem("standingsActiveTab");
      if (saved) setActiveTab(saved);
    }
  }, [searchParams]);

  const handleTabChange = (val: string) => {
    setActiveTab(val);
    localStorage.setItem("standingsActiveTab", val);
  };

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
  const isAdmin = !!adminRole?.isAdmin;

  React.useEffect(() => {
    if (allMatches.length > 0 && !selectedMatchId) {
      setSelectedMatchId(allMatches[0].id);
    }
  }, [allMatches]);

  if (playersLoading || matchesLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  const sortedGeneral = [...stats].sort((a, b) => {
    const pointsA = a.wins * 3 + a.draws;
    const pointsB = b.wins * 3 + b.draws;
    if (pointsB !== pointsA) return pointsB - pointsA;
    if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
    return b.totalGoals - a.totalGoals;
  });

  const sortedScorers = [...stats]
    .filter(p => p.totalGoals > 0)
    .sort((a, b) => b.totalGoals - a.totalGoals || b.goalsPerMatch - a.goalsPerMatch);

  const activeCaptains = stats
    .filter(p => p.isActive)
    .sort((a, b) => {
      // Prioridad 1: Debutantes (Nunca fueron capitanes)
      const aNever = a.totalCaptaincies === 0;
      const bNever = b.totalCaptaincies === 0;
      if (aNever && !bNever) return -1;
      if (!aNever && bNever) return 1;
      
      // Prioridad 2: Score de Prioridad (Asistencia reciente)
      if (b.captaincyPriorityScore !== a.captaincyPriorityScore) {
        return b.captaincyPriorityScore - a.captaincyPriorityScore;
      }
      
      // Prioridad 3: Antigüedad (Quien lleva más tiempo sin serlo)
      if (a.lastCaptainDate && b.lastCaptainDate) {
        return new Date(a.lastCaptainDate).getTime() - new Date(b.lastCaptainDate).getTime();
      }
      
      return 0;
    });

  const occasionalCaptains = stats
    .filter(p => !p.isActive && p.matchesPlayed > 0)
    .sort((a, b) => b.matchesPlayed - a.matchesPlayed || a.totalCaptaincies - b.totalCaptaincies);

  const last2MatchDates = allMatches.slice(0, 2).map(m => m.date);
  const suggestedCaptains = activeCaptains
    .filter(p => !p.lastCaptainDate || !last2MatchDates.includes(p.lastCaptainDate))
    .slice(0, 2);

  const getSuggestionReason = (player: AggregatedPlayerStats) => {
    if (player.totalCaptaincies === 0) return "Debutante absoluto: Jugador activo que aún no ha estrenado el brazalete.";
    if (player.matchesInLast5 === 5) return "Compromiso total (5/5). Su asistencia perfecta merece el liderazgo.";
    return "Rotación justa: Jugador comprometido que lleva tiempo esperando su turno.";
  };

  const selectedMatch = allMatches.find(m => m.id === selectedMatchId);
  const matchScorers = selectedMatch ? [...selectedMatch.teamAPlayers, ...selectedMatch.teamBPlayers]
    .filter(p => p.goals > 0)
    .map(s => ({
      ...s,
      player: allPlayers.find(p => p.id === s.playerId),
      team: selectedMatch.teamAPlayers.some(p => p.playerId === s.playerId) ? 'Azul' : 'Rojo'
    }))
    .sort((a, b) => b.goals - a.goals) : [];

  const renderCaptainsTable = (playerList: AggregatedPlayerStats[], title: string, icon: any) => (
    <div className="space-y-4">
      <div className="flex items-center gap-2 px-1">
        {icon}
        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground/60 italic">{title}</h3>
      </div>
      <Card className="glass-card border-none overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-white/5 border-white/5">
                <TableHead className="pl-4 md:pl-6 font-black uppercase text-[10px]">Jugador</TableHead>
                <TableHead className="text-center font-black uppercase text-[10px]">Asist.</TableHead>
                <TableHead className="text-center font-black uppercase text-[10px] hidden md:table-cell">PJ Totales</TableHead>
                <TableHead className="text-center font-black uppercase text-[10px]">Capi</TableHead>
                <TableHead className="text-center font-black uppercase text-[10px] hidden sm:table-cell">Última Vez</TableHead>
                {isAdmin && <TableHead className="text-center font-black uppercase text-[10px] text-primary hidden sm:table-cell">Score</TableHead>}
                <TableHead className="text-right pr-4 md:pr-6 font-black uppercase text-[10px]">Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {playerList.map((player) => {
                const isDebutante = player.totalCaptaincies === 0;
                const wasRecentCaptain = player.lastCaptainDate && allMatches.slice(0, 3).some(m => m.date === player.lastCaptainDate);
                
                return (
                  <TableRow key={player.playerId} className="border-white/5 group hover:bg-white/5 transition-colors">
                    <TableCell className="pl-4 md:pl-6 py-4">
                      <div className="flex items-center gap-2 md:gap-3">
                        <Avatar className="h-7 w-7 md:h-8 md:w-8">
                          <AvatarFallback className="bg-muted text-[10px] font-black">{getInitials(player.name)}</AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col min-w-0">
                          <Link href={`/players/${player.playerId}`} className="font-bold text-xs md:text-sm hover:text-primary transition-colors truncate">{player.name}</Link>
                          {isDebutante && <span className="text-[7px] font-black text-emerald-500 uppercase tracking-tighter">¡Nunca fue Capitán!</span>}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex flex-col items-center gap-0.5 md:gap-1">
                        <span className={cn("text-[10px] md:text-xs font-black italic", player.matchesInLast5 >= 4 ? "text-emerald-500" : "text-white")}>
                          {player.matchesInLast5}/5
                        </span>
                        <div className="flex gap-0.5">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <div key={i} className={cn("h-0.5 md:h-1 w-1 md:w-2 rounded-full", i < player.matchesInLast5 ? "bg-primary" : "bg-white/5")} />
                          ))}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-center font-mono text-xs hidden md:table-cell opacity-60">{player.matchesPlayed}</TableCell>
                    <TableCell className="text-center font-black italic text-base md:text-lg">{player.totalCaptaincies}</TableCell>
                    <TableCell className="text-center text-[10px] font-medium text-muted-foreground uppercase hidden sm:table-cell">
                      {player.lastCaptainDate ? format(parseISO(player.lastCaptainDate), "d MMM yy", { locale: es }) : "-"}
                    </TableCell>
                    {isAdmin && (
                      <TableCell className="text-center font-black text-primary italic text-xs hidden sm:table-cell">
                        {player.isActive ? player.captaincyPriorityScore : '-'}
                      </TableCell>
                    )}
                    <TableCell className="text-right pr-4 md:pr-6">
                      <Badge className={cn(
                          "uppercase font-black text-[7px] md:text-[8px] italic px-1.5 py-0",
                          isDebutante ? "bg-emerald-500 text-white" :
                          !wasRecentCaptain ? "bg-primary/10 text-primary border border-primary/20" : 
                          "bg-red-500/10 text-red-500 border border-red-500/20"
                      )}>
                          {isDebutante ? "Debut" : !wasRecentCaptain ? "OK" : "Recent"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="flex flex-col gap-6 md:gap-10 max-w-7xl mx-auto pb-20 px-1 md:px-0">
      <div className="space-y-1 md:space-y-2 px-2 md:px-0">
        <h1 className="text-3xl md:text-5xl font-black tracking-tighter uppercase italic flex items-center gap-3">
          <Trophy className="h-8 w-8 md:h-10 md:w-10 text-yellow-500" />
          Clasificación 2025
        </h1>
        <p className="text-muted-foreground font-medium uppercase tracking-widest text-[10px] md:text-xs italic">Centro estadístico de la temporada</p>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="w-full flex h-auto p-1 bg-white/5 border border-white/10 rounded-2xl overflow-x-auto no-scrollbar scroll-smooth">
          {["General", "Goleadores", "Goles Fecha", "Efectividad", "Capitanes"].map((tab) => (
            <TabsTrigger 
              key={tab} 
              value={tab.toLowerCase().replace(" ", "-")}
              className="flex-1 min-w-[100px] md:min-w-[120px] py-3 font-black uppercase italic text-[9px] md:text-[10px] tracking-tighter data-[state=active]:bg-primary data-[state=active]:text-white rounded-xl transition-all"
            >
              {tab}
            </TabsTrigger>
          ))}
        </TabsList>

        <div className="mt-6 md:mt-8">
          <TabsContent value="general" className="animate-in fade-in slide-in-from-bottom-2">
            <Card className="glass-card border-none overflow-hidden">
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-primary/10 border-white/5">
                      <TableHead className="w-10 md:w-12 text-center font-black uppercase text-[10px]">Pos</TableHead>
                      <TableHead className="font-black uppercase text-[10px]">Jugador</TableHead>
                      <TableHead className="text-center font-black uppercase text-[10px]">PJ</TableHead>
                      <TableHead className="text-center font-black uppercase text-[10px] hidden md:table-cell">PG</TableHead>
                      <TableHead className="text-center font-black uppercase text-[10px] hidden md:table-cell">PE</TableHead>
                      <TableHead className="text-center font-black uppercase text-[10px] hidden md:table-cell">PP</TableHead>
                      <TableHead className="text-center font-black uppercase text-[10px] hidden sm:table-cell text-emerald-500">GF</TableHead>
                      <TableHead className="text-center font-black uppercase text-[10px] hidden sm:table-cell text-red-500">GC</TableHead>
                      <TableHead className="text-center font-black uppercase text-[10px] hidden sm:table-cell">DIF</TableHead>
                      <TableHead className="text-center font-black uppercase text-[10px] bg-primary/20">PTS</TableHead>
                      <TableHead className="text-center font-black uppercase text-[10px]">Trend</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedGeneral.map((player, index) => {
                      const points = player.wins * 3 + player.draws;
                      const isTop3 = index < 3;
                      return (
                        <TableRow key={player.playerId} className="group border-white/5 hover:bg-white/5 transition-colors">
                          <TableCell className="text-center font-black italic text-base md:text-lg">
                            {index + 1 === 1 ? <Crown className="h-4 w-4 md:h-5 md:w-5 text-yellow-500 mx-auto" /> : index + 1}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2 md:gap-3">
                              <Avatar className={cn("h-7 w-7 md:h-9 md:w-9 border-2 transition-all", isTop3 ? "border-yellow-500/50" : "border-white/5")}>
                                <AvatarFallback className="bg-muted text-[10px] font-black">{getInitials(player.name)}</AvatarFallback>
                              </Avatar>
                              <Link href={`/players/${player.playerId}`} className="font-bold hover:text-primary transition-colors text-xs md:text-sm truncate max-w-[100px] md:max-w-none">
                                {player.name}
                              </Link>
                            </div>
                          </TableCell>
                          <TableCell className="text-center font-mono text-xs md:text-sm">{player.matchesPlayed}</TableCell>
                          <TableCell className="text-center font-mono hidden md:table-cell">{player.wins}</TableCell>
                          <TableCell className="text-center font-mono hidden md:table-cell">{player.draws}</TableCell>
                          <TableCell className="text-center font-mono hidden md:table-cell">{player.losses}</TableCell>
                          <TableCell className="text-center font-mono hidden sm:table-cell text-emerald-500/60">{player.goalsFor}</TableCell>
                          <TableCell className="text-center font-mono hidden sm:table-cell text-red-500/60">{player.goalsAgainst}</TableCell>
                          <TableCell className="text-center font-black hidden sm:table-cell text-xs">
                            <span className={cn(player.goalDifference > 0 ? "text-emerald-500" : player.goalDifference < 0 ? "text-red-500" : "")}>
                                {player.goalDifference > 0 ? `+${player.goalDifference}` : player.goalDifference}
                            </span>
                          </TableCell>
                          <TableCell className="text-center font-black text-lg md:text-xl italic bg-primary/5">{points}</TableCell>
                          <TableCell className="text-center">
                            <TrendIcon form={player.form} />
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="goleadores" className="animate-in fade-in slide-in-from-bottom-2">
            <Card className="glass-card border-none overflow-hidden">
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-primary/10 border-white/5">
                      <TableHead className="w-12 md:w-16 text-center font-black uppercase text-[10px]">Pos</TableHead>
                      <TableHead className="font-black uppercase text-[10px]">Jugador</TableHead>
                      <TableHead className="text-center font-black uppercase text-[10px]">PJ</TableHead>
                      <TableHead className="text-center font-black uppercase text-[10px] hidden sm:table-cell">Promedio</TableHead>
                      <TableHead className="text-right pr-6 font-black uppercase text-[10px] text-primary">Goles</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedScorers.map((player, index) => {
                      const isTop3 = index < 3;
                      const medals = ["🥇", "🥈", "🥉"];
                      return (
                        <TableRow key={player.playerId} className="group border-white/5 hover:bg-white/5 transition-colors">
                          <TableCell className="text-center font-black italic text-xl md:text-xl">
                            {isTop3 ? medals[index] : index + 1}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className={cn("h-8 w-8 md:h-10 md:w-10 border-2 transition-all", isTop3 ? "border-primary/40" : "border-white/5")}>
                                <AvatarFallback className="bg-muted text-[10px] font-black">{getInitials(player.name)}</AvatarFallback>
                              </Avatar>
                              <div className="flex flex-col min-w-0">
                                <Link href={`/players/${player.playerId}`} className="font-black italic uppercase hover:text-primary transition-colors text-xs md:text-sm truncate">
                                  {player.name}
                                </Link>
                                <Badge variant="outline" className="w-fit text-[7px] md:text-[8px] font-black uppercase border-white/5 px-1 py-0">{player.position}</Badge>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-center font-mono text-xs md:text-sm">{player.matchesPlayed}</TableCell>
                          <TableCell className="text-center font-bold italic text-muted-foreground/60 text-xs hidden sm:table-cell">
                            {player.goalsPerMatch} <span className="text-[8px] not-italic">G/PJ</span>
                          </TableCell>
                          <TableCell className="text-right pr-6">
                            <span className="text-2xl md:text-3xl font-black italic text-primary leading-none">
                              {player.totalGoals}
                            </span>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="goles-fecha" className="animate-in fade-in slide-in-from-bottom-2 space-y-6 md:space-y-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 px-2">
                <div className="space-y-0.5 md:space-y-1 text-center md:text-left">
                    <h3 className="text-lg md:text-xl font-black italic uppercase">Desglose por Jornada</h3>
                    <p className="text-[10px] md:text-xs text-muted-foreground font-medium uppercase tracking-widest">Goleadores de cada batalla</p>
                </div>
                <Select onValueChange={setSelectedMatchId} value={selectedMatchId || ""}>
                    <SelectTrigger className="w-full md:w-[300px] h-10 md:h-12 font-black uppercase italic bg-white/5 border-white/10 rounded-xl">
                        <SelectValue placeholder="Selecciona una fecha" />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-white/10">
                        {allMatches.map((m, i) => (
                            <SelectItem key={m.id} value={m.id} className="font-bold text-xs">
                                Fecha {allMatches.length - i} — {format(parseISO(m.date), "dd/MM/yyyy")}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {selectedMatchId && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8">
                    <Card className="lg:col-span-8 glass-card border-none overflow-hidden">
                        <CardContent className="p-0">
                            {matchScorers.length > 0 ? (
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-white/5 border-white/5">
                                            <TableHead className="pl-4 md:pl-6 font-black uppercase text-[10px]">Goleador</TableHead>
                                            <TableHead className="text-center font-black uppercase text-[10px]">Equipo</TableHead>
                                            <TableHead className="text-center font-black uppercase text-[10px]">Goles</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {matchScorers.map((s, i) => (
                                            <TableRow key={`${s.playerId}-${i}`} className="border-white/5">
                                                <TableCell className="pl-4 md:pl-6">
                                                    <div className="flex items-center gap-2 md:gap-3">
                                                        <Avatar className="h-7 w-7 md:h-8 md:w-8">
                                                            <AvatarFallback className="text-[10px] font-black">{getInitials(s.player?.name || "?")}</AvatarFallback>
                                                        </Avatar>
                                                        <span className="font-bold text-xs md:text-sm">{s.player?.name}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <Badge className={cn(
                                                        "uppercase font-black text-[7px] md:text-[8px] italic py-0",
                                                        s.team === 'Azul' ? "bg-primary" : "bg-accent"
                                                    )}>
                                                        {s.team}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <span className="text-xl md:text-2xl font-black italic text-primary">{s.goals}</span>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            ) : (
                                <div className="p-12 md:p-20 text-center space-y-4 opacity-30">
                                    <Target className="h-10 w-10 md:h-12 md:w-12 mx-auto" />
                                    <p className="font-black uppercase italic tracking-widest text-xs md:text-sm">Sin goles en esta fecha</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {selectedMatch && (
                        <Card className="lg:col-span-4 glass-card bg-primary/5 border-primary/20 flex flex-col justify-center">
                            <CardHeader className="text-center pb-2">
                                <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Resultado Final</CardTitle>
                            </CardHeader>
                            <CardContent className="p-6 md:p-8 space-y-6 md:space-y-8">
                                <div className="flex items-center justify-around">
                                    <div className="flex flex-col items-center gap-1 md:gap-2">
                                        <span className="text-[10px] font-black uppercase italic text-primary">Azul</span>
                                        <span className="text-4xl md:text-6xl font-black italic">{selectedMatch.teamAScore}</span>
                                    </div>
                                    <div className="text-xl md:text-2xl font-light opacity-20 italic">vs</div>
                                    <div className="flex flex-col items-center gap-1 md:gap-2">
                                        <span className="text-[10px] font-black uppercase italic text-accent">Rojo</span>
                                        <span className="text-4xl md:text-6xl font-black italic">{selectedMatch.teamBScore}</span>
                                    </div>
                                </div>
                                <Button asChild variant="outline" className="w-full h-10 md:h-12 font-black uppercase italic border-primary/20 hover:bg-primary/10 text-xs">
                                    <Link href={`/matches/${selectedMatchId}`}>Ver Ficha Completa <ChevronRight className="ml-2 h-4 w-4" /></Link>
                                </Button>
                            </CardContent>
                        </Card>
                    )}
                </div>
            )}
          </TabsContent>

          <TabsContent value="efectividad" className="animate-in fade-in slide-in-from-bottom-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              {stats.filter(p => p.matchesPlayed >= 3).sort((a,b) => b.efficiency - a.efficiency).map((player, index) => (
                <Card key={player.playerId} className="glass-card border-none relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
                    <TrendingUp className="h-16 w-16 md:h-20 md:w-20 text-primary" />
                  </div>
                  <CardContent className="p-4 md:p-6 space-y-4 md:space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 md:gap-4">
                        <span className="text-xl md:text-2xl font-black italic text-muted-foreground/20 w-5 md:w-6">#{index + 1}</span>
                        <Avatar className="h-10 w-10 md:h-12 md:w-12 border-2 border-white/5">
                          <AvatarFallback className="font-black bg-muted text-[10px]">{getInitials(player.name)}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <Link href={`/players/${player.playerId}`} className="text-base md:text-lg font-black uppercase italic hover:text-primary transition-colors block truncate max-w-[120px] md:max-w-none">
                            {player.name}
                          </Link>
                          <p className="text-[8px] md:text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{player.wins}V — {player.draws}E en {player.matchesPlayed}PJ</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-2xl md:text-4xl font-black italic text-white">{player.efficiency}%</span>
                      </div>
                    </div>
                    
                    <div className="space-y-1 md:space-y-2">
                        <div className="flex justify-between text-[8px] md:text-[10px] font-black uppercase italic text-muted-foreground">
                            <span>Productividad</span>
                            <span className="text-primary">{player.wins * 3 + player.draws} / {player.matchesPlayed * 3} PTS</span>
                        </div>
                        <Progress value={player.efficiency} className="h-1.5 md:h-2 bg-white/5" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="capitanes" className="animate-in fade-in slide-in-from-bottom-2 space-y-8 md:space-y-12">
            <div className="flex flex-col gap-6 md:gap-8 items-start">
              
              {suggestedCaptains.length >= 2 && (
                <Card className="w-full glass-card border-yellow-500/30 bg-gradient-to-br from-yellow-500/10 via-card to-background overflow-hidden relative group">
                  <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform duration-500">
                    <Crown className="h-20 w-20 md:h-32 md:w-32 text-yellow-500" />
                  </div>
                  <CardHeader className="pb-3 md:pb-4 px-4 md:px-6">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-xs md:text-sm font-black uppercase tracking-[0.2em] text-yellow-500 flex items-center gap-2">
                        <Sparkles className="h-3 w-3 md:h-4 md:w-4 animate-pulse" /> Consejo de Capitanes
                      </CardTitle>
                      <Badge variant="outline" className="border-yellow-500/20 text-yellow-500 text-[7px] md:text-[8px] uppercase font-black px-1.5 py-0">Designación Oficial</Badge>
                    </div>
                    <CardDescription className="text-[8px] md:text-[10px] uppercase font-bold tracking-widest text-muted-foreground/60">Sugerencia basada en rotación justa y compromiso</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6 md:space-y-8 relative z-10 px-4 md:px-6 pb-6 md:pb-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                      {suggestedCaptains.map((cap, idx) => (
                        <div key={cap.playerId} className="flex flex-col gap-3 md:gap-4 p-4 md:p-6 bg-black/40 backdrop-blur-md rounded-2xl border border-white/5 group/cap hover:border-yellow-500/20 transition-all">
                          <div className="flex items-center gap-3 md:gap-4">
                            <div className="relative shrink-0">
                              <Avatar className="h-12 w-12 md:h-16 md:w-16 border-2 border-yellow-500 shadow-xl">
                                <AvatarFallback className="text-lg md:text-xl font-black bg-yellow-500/10 text-yellow-500">{getInitials(cap.name)}</AvatarFallback>
                              </Avatar>
                              <div className={cn(
                                "absolute -top-1 -right-1 md:-top-2 md:-right-2 p-1 md:p-1.5 rounded-full shadow-lg border-2 border-background",
                                idx === 0 ? "bg-primary text-white" : "bg-accent text-white"
                              )}>
                                <span className="text-[7px] md:text-[8px] font-black uppercase">{idx === 0 ? 'A' : 'B'}</span>
                              </div>
                            </div>
                            <div className="min-w-0">
                              <p className="text-[7px] md:text-[8px] font-black uppercase tracking-[0.2em] text-yellow-500/60 mb-0.5 md:mb-1">Capitán Sugerido {idx + 1}</p>
                              <h4 className="text-base md:text-xl font-black italic uppercase tracking-tighter text-white truncate leading-none">{cap.name}</h4>
                              <div className="flex items-center gap-2 mt-1 md:mt-1.5">
                                <span className="text-[8px] md:text-[9px] font-bold text-muted-foreground uppercase">{cap.matchesInLast5}/5 Recientes</span>
                                <span className="text-[8px] md:text-[9px] font-black text-primary/60 hidden sm:inline">• {cap.captaincyPriorityScore} Score</span>
                              </div>
                            </div>
                          </div>
                          <div className="bg-white/5 p-2 md:p-3 rounded-xl border border-white/5">
                            <p className="text-[9px] md:text-[10px] font-medium italic text-white/70 leading-relaxed">
                              "{getSuggestionReason(cap)}"
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="pt-3 md:pt-4 border-t border-white/5 flex items-center justify-center gap-2 text-muted-foreground italic text-[8px] md:text-[9px] uppercase tracking-widest font-bold">
                      <Swords className="h-2.5 w-2.5 md:h-3 md:w-3" />
                      Dúo designado para el próximo "Pan y Queso"
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="w-full space-y-8 md:space-y-12">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-2">
                  <div className="space-y-0.5 md:space-y-1 text-center md:text-left">
                    <h3 className="text-lg md:text-xl font-black italic uppercase flex items-center justify-center md:justify-start gap-2">
                      <Star className="h-4 w-4 md:h-5 md:w-5 text-yellow-500" />
                      Rotación de Liderazgo
                    </h3>
                    <p className="text-[10px] md:text-xs text-muted-foreground font-medium uppercase tracking-widest">Score basado en actividad y capitanías</p>
                  </div>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="outline" size="sm" className="h-8 md:h-9 border-white/10 text-[9px] md:text-[10px] font-black uppercase italic mx-auto md:mx-0">
                          <Info className="mr-1.5 h-3 w-3 md:h-3.5 md:w-3.5" /> ¿Cómo se calcula?
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs bg-zinc-900 border-white/10 p-4 space-y-3">
                        <p className="font-bold text-primary uppercase text-xs italic">Prioridad de Capitanía</p>
                        <div className="space-y-2 text-[10px] leading-relaxed">
                          <p><span className="text-emerald-500 font-black">Score = (Recientes x 3) + (Totales x 1) - (Capitanías x 4) + (Debut ? 5 : 0)</span></p>
                          <p>• <span className="text-white font-bold italic">Debutante:</span> Tienen prioridad absoluta en la lista sobre veteranos.</p>
                          <p>• <span className="text-white font-bold italic">Antigüedad:</span> Ante mismo score, se elige al que lleva más tiempo sin serlo.</p>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>

                <div className="space-y-8">
                  {renderCaptainsTable(activeCaptains, "Jugadores Activos", <Users className="h-3.5 w-3.5 md:h-4 md:w-4 text-primary" />)}
                  
                  {occasionalCaptains.length > 0 && (
                    <div className="pt-6 md:pt-8 border-t border-white/5">
                      {renderCaptainsTable(occasionalCaptains, "Participación Ocasional", <Zap className="h-3.5 w-3.5 md:h-4 md:w-4 text-muted-foreground/40" />)}
                    </div>
                  )}
                </div>
              </div>
            </div>
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
