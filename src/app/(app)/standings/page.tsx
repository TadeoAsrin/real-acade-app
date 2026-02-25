'use client';

import * as React from 'react';
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCollection, useMemoFirebase, useFirestore, useUser, useDoc } from "@/firebase";
import { collection, query, orderBy, doc } from "firebase/firestore";
import type { Player, Match, AggregatedPlayerStats } from "@/lib/definitions";
import { Loader2, Trophy, Target, Zap, Crown, TrendingUp, TrendingDown, Minus, Calendar, ChevronRight, Users, Star, Info } from "lucide-react";
import Link from "next/link";
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

const FormDot = ({ result }: { result: 'W' | 'D' | 'L' }) => {
  const colors = {
    W: "bg-emerald-500",
    D: "bg-orange-400",
    L: "bg-red-500"
  };
  const labels = { W: "G", D: "E", L: "P" };
  return (
    <div className={cn("h-5 w-5 rounded-full flex items-center justify-center text-[8px] font-black text-white", colors[result])}>
      {labels[result]}
    </div>
  );
};

const TrendIcon = ({ form }: { form: ('W' | 'D' | 'L')[] }) => {
  const last3 = form.slice(0, 3);
  const wins = last3.filter(r => r === 'W').length;
  const losses = last3.filter(r => r === 'L').length;

  if (wins >= 2) return <TrendingUp className="h-4 w-4 text-emerald-500" />;
  if (losses >= 2) return <TrendingDown className="h-4 w-4 text-red-500" />;
  return <Minus className="h-4 w-4 text-muted-foreground/40" />;
};

export default function StandingsPage() {
  const firestore = useFirestore();
  const { user } = useUser();
  const [activeTab, setActiveTab] = React.useState("general");
  const [selectedMatchId, setSelectedMatchId] = React.useState<string | null>(null);

  React.useEffect(() => {
    const saved = localStorage.getItem("standingsActiveTab");
    if (saved) setActiveTab(saved);
  }, []);

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

  const sortedEfficiency = stats
    .filter(p => p.matchesPlayed >= 3)
    .sort((a, b) => b.efficiency - a.efficiency || b.matchesPlayed - a.matchesPlayed);

  // Lógica de Capitanes: Separar Activos de Ocasionales
  const activeCaptains = stats
    .filter(p => p.isActive)
    .sort((a, b) => {
      if (b.captaincyPriorityScore !== a.captaincyPriorityScore) return b.captaincyPriorityScore - a.captaincyPriorityScore;
      if (a.totalCaptaincies !== b.totalCaptaincies) return a.totalCaptaincies - b.totalCaptaincies;
      if (!a.lastCaptainDate) return -1;
      if (!b.lastCaptainDate) return 1;
      return new Date(a.lastCaptainDate).getTime() - new Date(b.lastCaptainDate).getTime();
    });

  const occasionalCaptains = stats
    .filter(p => !p.isActive && p.matchesPlayed > 0)
    .sort((a, b) => b.matchesPlayed - a.matchesPlayed || a.totalCaptaincies - b.totalCaptaincies);

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
                <TableHead className="pl-6 font-black uppercase text-[10px]">Jugador</TableHead>
                <TableHead className="text-center font-black uppercase text-[10px]">Asist. Reciente</TableHead>
                <TableHead className="text-center font-black uppercase text-[10px] hidden md:table-cell">PJ Totales</TableHead>
                <TableHead className="text-center font-black uppercase text-[10px]">Capitanías</TableHead>
                <TableHead className="text-center font-black uppercase text-[10px] hidden sm:table-cell">Última Vez</TableHead>
                {isAdmin && <TableHead className="text-center font-black uppercase text-[10px] text-primary">Score</TableHead>}
                <TableHead className="text-right pr-6 font-black uppercase text-[10px]">Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {playerList.map((player) => {
                const isRecent = player.matchesInLast5 >= 3;
                const wasRecentCaptain = player.lastCaptainDate && allMatches.slice(0, 3).some(m => m.date === player.lastCaptainDate);
                
                return (
                  <TableRow key={player.playerId} className="border-white/5 group hover:bg-white/5 transition-colors">
                    <TableCell className="pl-6 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-muted text-[10px] font-black">{getInitials(player.name)}</AvatarFallback>
                        </Avatar>
                        <Link href={`/players/${player.playerId}`} className="font-bold text-sm hover:text-primary transition-colors">{player.name}</Link>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex flex-col items-center gap-1">
                        <span className={cn("text-xs font-black italic", player.matchesInLast5 >= 4 ? "text-emerald-500" : "text-white")}>
                          {player.matchesInLast5}/5
                        </span>
                        <div className="flex gap-0.5">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <div key={i} className={cn("h-1 w-2 rounded-full", i < player.matchesInLast5 ? "bg-primary" : "bg-white/5")} />
                          ))}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-center font-mono text-xs hidden md:table-cell opacity-60">{player.matchesPlayed}</TableCell>
                    <TableCell className="text-center font-black italic text-lg">{player.totalCaptaincies}</TableCell>
                    <TableCell className="text-center text-[10px] font-medium text-muted-foreground uppercase hidden sm:table-cell">
                      {player.lastCaptainDate ? format(parseISO(player.lastCaptainDate), "d MMM yy", { locale: es }) : "Nunca"}
                    </TableCell>
                    {isAdmin && (
                      <TableCell className="text-center font-black text-primary italic text-xs">
                        {player.isActive ? player.captaincyPriorityScore : '-'}
                      </TableCell>
                    )}
                    <TableCell className="text-right pr-6">
                      <Badge className={cn(
                          "uppercase font-black text-[8px] italic",
                          !wasRecentCaptain ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" : "bg-red-500/10 text-red-500 border border-red-500/20"
                      )}>
                          {!wasRecentCaptain ? "Disponible" : "Reciente"}
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
    <div className="flex flex-col gap-10 max-w-7xl mx-auto pb-20">
      <div className="space-y-2">
        <h1 className="text-4xl md:text-5xl font-black tracking-tighter uppercase italic flex items-center gap-3">
          <Trophy className="h-10 w-10 text-yellow-500" />
          Clasificación 2025
        </h1>
        <p className="text-muted-foreground font-medium uppercase tracking-widest text-xs">Centro estadístico oficial de Real Acade</p>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="w-full flex h-auto p-1 bg-white/5 border border-white/10 rounded-2xl overflow-x-auto no-scrollbar scroll-smooth">
          {["General", "Goleadores", "Goles Fecha", "Efectividad", "Capitanes"].map((tab) => (
            <TabsTrigger 
              key={tab} 
              value={tab.toLowerCase().replace(" ", "-")}
              className="flex-1 min-w-[120px] py-3 font-black uppercase italic text-[10px] tracking-tighter data-[state=active]:bg-primary data-[state=active]:text-white rounded-xl transition-all"
            >
              {tab}
            </TabsTrigger>
          ))}
        </TabsList>

        <div className="mt-8">
          <TabsContent value="general" className="animate-in fade-in slide-in-from-bottom-2">
            <Card className="glass-card border-none overflow-hidden">
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-primary/10 border-white/5">
                      <TableHead className="w-12 text-center font-black uppercase text-[10px]">Pos</TableHead>
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
                          <TableCell className="text-center font-black italic text-lg">
                            {index + 1 === 1 ? <Crown className="h-5 w-5 text-yellow-500 mx-auto" /> : index + 1}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className={cn("h-9 w-9 border-2 transition-all", isTop3 ? "border-yellow-500/50" : "border-white/5")}>
                                <AvatarFallback className="bg-muted text-xs font-black">{getInitials(player.name)}</AvatarFallback>
                              </Avatar>
                              <Link href={`/players/${player.playerId}`} className="font-bold hover:text-primary transition-colors text-sm truncate max-w-[120px] md:max-w-none">
                                {player.name}
                              </Link>
                            </div>
                          </TableCell>
                          <TableCell className="text-center font-mono">{player.matchesPlayed}</TableCell>
                          <TableCell className="text-center font-mono hidden md:table-cell">{player.wins}</TableCell>
                          <TableCell className="text-center font-mono hidden md:table-cell">{player.draws}</TableCell>
                          <TableCell className="text-center font-mono hidden md:table-cell">{player.losses}</TableCell>
                          <TableCell className="text-center font-mono hidden sm:table-cell text-emerald-500/60">{player.goalsFor}</TableCell>
                          <TableCell className="text-center font-mono hidden sm:table-cell text-red-500/60">{player.goalsAgainst}</TableCell>
                          <TableCell className="text-center font-black hidden sm:table-cell">
                            <span className={cn(player.goalDifference > 0 ? "text-emerald-500" : player.goalDifference < 0 ? "text-red-500" : "")}>
                                {player.goalDifference > 0 ? `+${player.goalDifference}` : player.goalDifference}
                            </span>
                          </TableCell>
                          <TableCell className="text-center font-black text-xl italic bg-primary/5">{points}</TableCell>
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sortedScorers.map((player, index) => (
                <Card key={player.playerId} className="glass-card border-none overflow-hidden group hover:scale-[1.02] transition-all">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          <Avatar className="h-16 w-16 border-4 border-white/5 group-hover:border-primary/30">
                            <AvatarFallback className="text-xl font-black bg-primary/10 text-primary">{getInitials(player.name)}</AvatarFallback>
                          </Avatar>
                          <div className={cn(
                            "absolute -top-2 -left-2 h-8 w-8 rounded-full flex items-center justify-center text-lg shadow-xl",
                            index === 0 ? "bg-yellow-500" : index === 1 ? "bg-zinc-300" : index === 2 ? "bg-orange-600" : "bg-muted"
                          )}>
                            {index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : index + 1}
                          </div>
                        </div>
                        <div className="min-w-0">
                          <Link href={`/players/${player.playerId}`} className="text-xl font-black italic uppercase truncate block hover:text-primary transition-colors">
                            {player.name}
                          </Link>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-[8px] font-black uppercase border-white/10">{player.position}</Badge>
                            {player.lastGoalDate && (
                                <span className="text-[8px] font-bold text-muted-foreground uppercase">Último: {format(parseISO(player.lastGoalDate), "d MMM", { locale: es })}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-4xl font-black italic text-primary leading-none">{player.totalGoals}</p>
                        <p className="text-[8px] font-black uppercase text-muted-foreground/60 tracking-widest mt-1">Goles</p>
                      </div>
                    </div>
                    <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between">
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black uppercase text-muted-foreground tracking-tighter leading-none">Promedio</span>
                            <span className="text-sm font-bold italic">{player.goalsPerMatch} <span className="text-[10px] opacity-40 not-italic uppercase">G/PJ</span></span>
                        </div>
                        <div className="flex flex-col items-end">
                            <span className="text-[10px] font-black uppercase text-muted-foreground tracking-tighter leading-none">Partidos</span>
                            <span className="text-sm font-bold italic">{player.matchesPlayed} <span className="text-[10px] opacity-40 not-italic uppercase">PJ</span></span>
                        </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="goles-fecha" className="animate-in fade-in slide-in-from-bottom-2 space-y-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="space-y-1">
                    <h3 className="text-xl font-black italic uppercase">Desglose por Jornada</h3>
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest">Goleadores de cada batalla</p>
                </div>
                <Select onValueChange={setSelectedMatchId} value={selectedMatchId || ""}>
                    <SelectTrigger className="w-full md:w-[300px] h-12 font-black uppercase italic bg-white/5 border-white/10 rounded-xl">
                        <SelectValue placeholder="Selecciona una fecha" />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-white/10">
                        {allMatches.map((m, i) => (
                            <SelectItem key={m.id} value={m.id} className="font-bold">
                                Fecha {allMatches.length - i} — {format(parseISO(m.date), "dd/MM/yyyy")}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {selectedMatchId && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    <Card className="lg:col-span-8 glass-card border-none overflow-hidden">
                        <CardContent className="p-0">
                            {matchScorers.length > 0 ? (
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-white/5 border-white/5">
                                            <TableHead className="pl-6 font-black uppercase text-[10px]">Goleador</TableHead>
                                            <TableHead className="text-center font-black uppercase text-[10px]">Equipo</TableHead>
                                            <TableHead className="text-center font-black uppercase text-[10px]">Goles</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {matchScorers.map((s, i) => (
                                            <TableRow key={`${s.playerId}-${i}`} className="border-white/5">
                                                <TableCell className="pl-6">
                                                    <div className="flex items-center gap-3">
                                                        <Avatar className="h-8 w-8">
                                                            <AvatarFallback className="text-[10px] font-black">{getInitials(s.player?.name || "?")}</AvatarFallback>
                                                        </Avatar>
                                                        <span className="font-bold text-sm">{s.player?.name}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <Badge className={cn(
                                                        "uppercase font-black text-[8px] italic",
                                                        s.team === 'Azul' ? "bg-primary" : "bg-accent"
                                                    )}>
                                                        {s.team}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <span className="text-2xl font-black italic text-primary">{s.goals}</span>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            ) : (
                                <div className="p-20 text-center space-y-4 opacity-30">
                                    <Target className="h-12 w-12 mx-auto" />
                                    <p className="font-black uppercase italic tracking-widest">Sin goles en esta fecha</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {selectedMatch && (
                        <Card className="lg:col-span-4 glass-card bg-primary/5 border-primary/20 flex flex-col justify-center">
                            <CardHeader className="text-center pb-2">
                                <CardTitle className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">Resultado Final</CardTitle>
                            </CardHeader>
                            <CardContent className="p-8 space-y-8">
                                <div className="flex items-center justify-around">
                                    <div className="flex flex-col items-center gap-2">
                                        <span className="text-xs font-black uppercase italic text-primary">Azul</span>
                                        <span className="text-6xl font-black italic">{selectedMatch.teamAScore}</span>
                                    </div>
                                    <div className="text-2xl font-light opacity-20 italic">vs</div>
                                    <div className="flex flex-col items-center gap-2">
                                        <span className="text-xs font-black uppercase italic text-accent">Rojo</span>
                                        <span className="text-6xl font-black italic">{selectedMatch.teamBScore}</span>
                                    </div>
                                </div>
                                <Button asChild variant="outline" className="w-full h-12 font-black uppercase italic border-primary/20 hover:bg-primary/10">
                                    <Link href={`/matches/${selectedMatchId}`}>Ver Ficha Completa <ChevronRight className="ml-2 h-4 w-4" /></Link>
                                </Button>
                            </CardContent>
                        </Card>
                    )}
                </div>
            )}
          </TabsContent>

          <TabsContent value="efectividad" className="animate-in fade-in slide-in-from-bottom-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {sortedEfficiency.map((player, index) => (
                <Card key={player.playerId} className="glass-card border-none relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
                    <TrendingUp className="h-20 w-20 text-primary" />
                  </div>
                  <CardContent className="p-6 space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <span className="text-2xl font-black italic text-muted-foreground/20 w-6">#{index + 1}</span>
                        <Avatar className="h-12 w-12 border-2 border-white/5">
                          <AvatarFallback className="font-black bg-muted">{getInitials(player.name)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <Link href={`/players/${player.playerId}`} className="text-lg font-black uppercase italic hover:text-primary transition-colors block">
                            {player.name}
                          </Link>
                          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{player.wins}V — {player.draws}E en {player.matchesPlayed}PJ</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-4xl font-black italic text-white">{player.efficiency}%</span>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                        <div className="flex justify-between text-[10px] font-black uppercase italic text-muted-foreground">
                            <span>Productividad</span>
                            <span className="text-primary">{player.wins * 3 + player.draws} / {player.matchesPlayed * 3} PTS</span>
                        </div>
                        <Progress value={player.efficiency} className="h-2 bg-white/5" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="capitanes" className="animate-in fade-in slide-in-from-bottom-2 space-y-12">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <h3 className="text-xl font-black italic uppercase flex items-center gap-2">
                  <Star className="h-5 w-5 text-yellow-500" />
                  Rotación de Liderazgo
                </h3>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest">Score basado en actividad y capitanías recientes</p>
              </div>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="sm" className="h-8 border-white/10 text-[10px] font-black uppercase italic">
                      <Info className="mr-2 h-3.5 w-3.5" /> ¿Cómo se calcula?
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs bg-zinc-900 border-white/10 p-4 space-y-3">
                    <p className="font-bold text-primary uppercase text-xs italic">Prioridad de Capitanía</p>
                    <div className="space-y-2 text-[10px] leading-relaxed">
                      <p><span className="text-emerald-500 font-black">Score = (Recientes x 3) + (Totales x 1) - (Capitanías x 4)</span></p>
                      <p>• <span className="text-white font-bold italic">Recientes:</span> Partidos jugados de los últimos 5 globales.</p>
                      <p>• <span className="text-white font-bold italic">Totales:</span> Trayectoria histórica en el club.</p>
                      <p>• <span className="text-red-500 font-bold italic">Capitanías:</span> Haber sido capitán reduce tu prioridad para dar lugar a otros.</p>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>

            {renderCaptainsTable(activeCaptains, "Jugadores Activos", <Users className="h-4 w-4 text-primary" />)}
            
            {occasionalCaptains.length > 0 && (
              <div className="pt-8 border-t border-white/5">
                {renderCaptainsTable(occasionalCaptains, "Participación Ocasional", <Zap className="h-4 w-4 text-muted-foreground/40" />)}
              </div>
            )}
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
