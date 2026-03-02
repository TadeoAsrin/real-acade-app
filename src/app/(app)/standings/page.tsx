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
import { Loader2, TrendingUp, TrendingDown, Minus, ChevronRight, Users, Star, Info, Sparkles, Crown, Target, Zap, Calendar } from "lucide-react";
import Link from 'next/link';
import { cn, getInitials } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const TrendIcon = ({ form }: { form: ('W' | 'D' | 'L')[] }) => {
  const last3 = form.slice(0, 3);
  const wins = last3.filter(r => r === 'W').length;
  const losses = last3.filter(r => r === 'L').length;
  if (wins >= 2) return <TrendingUp className="h-4 w-4 text-emerald-500" />;
  if (losses >= 2) return <TrendingDown className="h-4 w-4 text-red-500" />;
  return <Minus className="h-4 w-4 text-muted-foreground/40" />;
};

export default function StandingsPage() {
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

  const sortedGeneral = [...stats].sort((a, b) => (b.wins * 3 + b.draws) - (a.wins * 3 + a.draws) || b.goalDifference - a.goalDifference);
  const sortedScorers = [...stats].filter(p => p.totalGoals > 0).sort((a, b) => b.totalGoals - a.totalGoals || b.goalsPerMatch - a.goalsPerMatch);
  const sortedEfficiency = [...stats].filter(p => p.matchesPlayed >= 3).sort((a, b) => b.efficiency - a.efficiency);

  const leadershipRanking = [...stats]
    .filter(p => p.matchesPlayed > 0)
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
      <div className="space-y-2">
        <h1 className="text-5xl font-bebas text-white tracking-widest">TABLA DE POSICIONES</h1>
        <p className="text-muted-foreground font-oswald uppercase tracking-[0.3em] text-xs italic">Competición Oficial Real Acade</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-black/40 border border-white/5 p-1 h-14 rounded-lg w-full flex overflow-x-auto no-scrollbar">
          {["General", "Goleadores", "Goles Fecha", "Efectividad", "Capitanes"].map((tab) => (
            <TabsTrigger key={tab.toLowerCase().replace(" ", "-")} value={tab.toLowerCase().replace(" ", "-")} className="flex-1 min-w-[120px] font-bebas tracking-widest text-lg">
              {tab}
            </TabsTrigger>
          ))}
        </TabsList>

        <div className="mt-10">
          {/* TABLA GENERAL */}
          <TabsContent value="general" className="animate-in fade-in slide-in-from-bottom-2">
            <Card className="competition-card">
              <Table>
                <TableHeader>
                  <TableRow className="bg-black/40 border-white/5 h-14">
                    <TableHead className="w-16 text-center font-bebas text-sm">POS</TableHead>
                    <TableHead className="font-bebas text-sm">JUGADOR</TableHead>
                    <TableHead className="text-center font-bebas text-sm">PJ</TableHead>
                    <TableHead className="text-center font-bebas text-sm text-emerald-500">GF</TableHead>
                    <TableHead className="text-center font-bebas text-sm text-red-500">GC</TableHead>
                    <TableHead className="text-center font-bebas text-sm">DIF</TableHead>
                    <TableHead className="text-center font-bebas text-sm bg-primary/10 text-primary">PTS</TableHead>
                    <TableHead className="text-center font-bebas text-sm">TREND</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedGeneral.map((player, index) => (
                    <TableRow key={player.playerId} className={cn("official-table-row h-16", index === 0 ? "podium-1" : index === 1 ? "podium-2" : index === 2 ? "podium-3" : "")}>
                      <TableCell className="text-center font-bebas text-2xl italic">{index + 1}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-4">
                          <Avatar className="h-10 w-10 border border-white/10"><AvatarFallback className="bg-muted text-xs">{getInitials(player.name)}</AvatarFallback></Avatar>
                          <Link href={`/players/${player.playerId}`} className="font-bold uppercase tracking-tight hover:text-primary">{player.name}</Link>
                        </div>
                      </TableCell>
                      <TableCell className="text-center font-bebas text-xl">{player.matchesPlayed}</TableCell>
                      <TableCell className="text-center font-bebas text-xl text-emerald-500/60">{player.goalsFor}</TableCell>
                      <TableCell className="text-center font-bebas text-xl text-red-500/60">{player.goalsAgainst}</TableCell>
                      <TableCell className="text-center font-bebas text-xl">{player.goalDifference > 0 ? `+${player.goalDifference}` : player.goalDifference}</TableCell>
                      <TableCell className="text-center font-bebas text-3xl italic bg-primary/5">{player.wins * 3 + player.draws}</TableCell>
                      <TableCell className="text-center"><TrendIcon form={player.form} /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          {/* GOLEADORES (PICHICHI) */}
          <TabsContent value="goleadores" className="animate-in fade-in slide-in-from-bottom-2">
            <Card className="competition-card">
              <Table>
                <TableHeader>
                  <TableRow className="bg-black/40 border-white/5 h-14">
                    <TableHead className="w-16 text-center font-bebas text-sm">POS</TableHead>
                    <TableHead className="font-bebas text-sm">ARTILLERO</TableHead>
                    <TableHead className="text-center font-bebas text-sm">PJ</TableHead>
                    <TableHead className="text-center font-bebas text-sm">G/PJ</TableHead>
                    <TableHead className="text-center font-bebas text-sm bg-accent/10 text-accent">GOLES</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedScorers.map((player, index) => (
                    <TableRow key={player.playerId} className={cn("official-table-row h-16", index === 0 ? "podium-1" : index === 1 ? "podium-2" : index === 2 ? "podium-3" : "")}>
                      <TableCell className="text-center font-bebas text-2xl italic">{index + 1}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-4">
                          <Avatar className="h-10 w-10 border border-white/10"><AvatarFallback className="bg-muted text-xs">{getInitials(player.name)}</AvatarFallback></Avatar>
                          <Link href={`/players/${player.playerId}`} className="font-bold uppercase tracking-tight hover:text-accent">{player.name}</Link>
                        </div>
                      </TableCell>
                      <TableCell className="text-center font-bebas text-xl text-muted-foreground">{player.matchesPlayed}</TableCell>
                      <TableCell className="text-center font-bebas text-xl text-muted-foreground">{player.goalsPerMatch}</TableCell>
                      <TableCell className="text-center font-bebas text-4xl italic bg-accent/5 text-accent">{player.totalGoals}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          {/* GOLES FECHA (DESGLOSE POR JORNADA) */}
          <TabsContent value="goles-fecha" className="animate-in fade-in slide-in-from-bottom-2 space-y-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-surface-800 p-6 rounded-lg border border-white/5">
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-primary" />
                <span className="font-bebas text-xl tracking-widest uppercase">Seleccionar Jornada</span>
              </div>
              <Select value={selectedMatchId} onValueChange={setSelectedMatchId}>
                <SelectTrigger className="w-full md:w-[300px] font-bold h-12 bg-black/40">
                  <SelectValue placeholder="Elegir partido" />
                </SelectTrigger>
                <SelectContent>
                  {allMatches.map(m => (
                    <SelectItem key={m.id} value={m.id}>
                      {format(parseISO(m.date), "dd MMM yyyy", { locale: es })} • {m.teamAScore}-{m.teamBScore}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedMatch ? (
              <Card className="competition-card border-t-4 border-t-primary overflow-hidden">
                <div className="bg-black/40 p-4 border-b border-white/5 flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">REPORTE DE ARTILLERÍA</span>
                  <Badge variant="outline" className="font-bebas tracking-widest text-primary border-primary/20">
                    {format(parseISO(selectedMatch.date), "PPPP", { locale: es })}
                  </Badge>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow className="bg-black/20 border-white/5 h-12">
                      <TableHead className="pl-8 font-bebas text-xs uppercase">Jugador</TableHead>
                      <TableHead className="text-center font-bebas text-xs uppercase">Equipo</TableHead>
                      <TableHead className="text-right pr-8 font-bebas text-xs uppercase">Goles en Fecha</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {matchScorers.length > 0 ? matchScorers.map((stat) => {
                      const player = allPlayers.find(p => p.id === stat.playerId);
                      const isBlue = selectedMatch.teamAPlayers.some(p => p.playerId === stat.playerId);
                      return (
                        <TableRow key={stat.playerId} className="official-table-row h-16">
                          <TableCell className="pl-8">
                            <div className="flex items-center gap-3">
                              <Avatar className="h-8 w-8"><AvatarFallback className="text-[10px]">{getInitials(player?.name || "?")}</AvatarFallback></Avatar>
                              <span className="font-bold uppercase text-sm">{player?.name}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge className={cn("uppercase font-black text-[10px]", isBlue ? "bg-primary" : "bg-accent")}>
                              {isBlue ? "AZUL" : "ROJO"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right pr-8 font-bebas text-3xl italic text-white">
                            {stat.goals}
                          </TableCell>
                        </TableRow>
                      );
                    }) : (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center py-20 opacity-20 italic">No se registraron goles en esta jornada.</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </Card>
            ) : (
              <div className="h-60 flex flex-col items-center justify-center border-2 border-dashed rounded-3xl opacity-20">
                <Target className="h-12 w-12 mb-4" />
                <p className="font-bebas text-xl tracking-widest">Selecciona un partido para ver los artilleros</p>
              </div>
            )}
          </TabsContent>

          {/* EFECTIVIDAD (RENDIMIENTO PURO) */}
          <TabsContent value="efectividad" className="animate-in fade-in slide-in-from-bottom-2">
            <Card className="competition-card">
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
                    <TableRow key={player.playerId} className={cn("official-table-row h-16", index === 0 ? "podium-1" : index === 1 ? "podium-2" : index === 2 ? "podium-3" : "")}>
                      <TableCell className="text-center font-bebas text-2xl italic">{index + 1}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-4">
                          <Avatar className="h-10 w-10 border border-white/10"><AvatarFallback className="bg-muted text-xs">{getInitials(player.name)}</AvatarFallback></Avatar>
                          <Link href={`/players/${player.playerId}`} className="font-bold uppercase tracking-tight hover:text-emerald-500">{player.name}</Link>
                        </div>
                      </TableCell>
                      <TableCell className="text-center font-bebas text-xl text-muted-foreground">{player.matchesPlayed}</TableCell>
                      <TableCell className="text-center font-oswald text-xs tracking-widest font-bold">
                        <span className="text-emerald-500">{player.wins}</span>-<span className="text-orange-400">{player.draws}</span>-<span className="text-red-500">{player.losses}</span>
                      </TableCell>
                      <TableCell className="text-center font-bebas text-4xl italic bg-emerald-500/5 text-emerald-500">
                        {player.efficiency}%
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
            <div className="mt-6 p-4 bg-surface-800/50 rounded-lg border border-white/5 flex items-start gap-3">
              <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <p className="text-[10px] text-muted-foreground leading-relaxed uppercase font-bold tracking-wider">
                La efectividad se calcula sobre el porcentaje de puntos obtenidos (3 pts por victoria, 1 por empate) respecto al máximo posible. Mínimo 3 partidos jugados.
              </p>
            </div>
          </TabsContent>

          {/* CAPITANES (JUSTICIA TOTAL) */}
          <TabsContent value="capitanes" className="animate-in fade-in slide-in-from-bottom-2 space-y-12">
            {suggestedCandidates.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {suggestedCandidates.map((cap, idx) => (
                  <Card key={cap.playerId} className="competition-card border-t-4 border-t-primary bg-surface-900 relative group hover-lift">
                    <div className="absolute top-0 right-0 p-4 opacity-5"><Crown className="h-20 w-20 text-primary" /></div>
                    <CardContent className="p-8 flex items-center gap-6">
                      <div className="relative">
                        <Avatar className="h-20 w-20 border-4 border-primary/20"><AvatarFallback className="text-3xl font-bebas">{getInitials(cap.name)}</AvatarFallback></Avatar>
                        <Badge className="absolute -bottom-2 -right-2 bg-primary text-white font-bebas">CAP</Badge>
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase text-primary">CANDIDATO {idx + 1}</p>
                        <h3 className="text-4xl font-bebas text-white uppercase">{cap.name}</h3>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase">{cap.totalCaptaincies === 0 ? "PRÓXIMO DEBUTANTE" : "SUGERIDO POR ASISTENCIA"}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            <div className="bg-surface-800/50 border border-white/5 p-6 rounded-lg flex items-center gap-6">
              <Sparkles className="h-8 w-8 text-emerald-500 shrink-0" />
              <p className="text-xs text-muted-foreground leading-relaxed">
                Ranking de <strong>Justicia Total</strong>. Los debutantes tienen prioridad absoluta y se ordenan por deuda histórica (PJ). 
                Los jugadores "En Reserva" son visibles para transparentar la deuda de honor del club.
              </p>
            </div>

            <Card className="competition-card">
              <Table>
                <TableHeader>
                  <TableRow className="bg-black/20 border-white/5">
                    <TableHead className="pl-6 font-bebas text-sm">JUGADOR</TableHead>
                    <TableHead className="text-center font-bebas text-sm">PJ</TableHead>
                    <TableHead className="text-center font-bebas text-sm">CAPI</TableHead>
                    <TableHead className="text-right pr-6 font-bebas text-sm">ESTADO</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leadershipRanking.map((player) => (
                    <TableRow key={player.playerId} className={cn("official-table-row", !player.isActive && "opacity-40")}>
                      <TableCell className="pl-6 py-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8"><AvatarFallback className="text-[10px]">{getInitials(player.name)}</AvatarFallback></Avatar>
                          <div className="flex flex-col">
                            <Link href={`/players/${player.playerId}`} className="font-bold text-xs uppercase hover:text-primary">{player.name}</Link>
                            {!player.isActive && <span className="text-[7px] font-black text-muted-foreground uppercase">En Reserva</span>}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-center font-bebas text-lg italic text-muted-foreground">{player.matchesPlayed}</TableCell>
                      <TableCell className="text-center font-bebas text-xl text-white">{player.totalCaptaincies}</TableCell>
                      <TableCell className="text-right pr-6">
                        <Badge variant="outline" className={cn("text-[8px] uppercase", player.totalCaptaincies === 0 ? "border-emerald-500 text-emerald-500 bg-emerald-500/5" : "border-white/10 text-muted-foreground")}>
                          {player.totalCaptaincies === 0 ? "DEBUTANTE" : "VETERANO"}
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
