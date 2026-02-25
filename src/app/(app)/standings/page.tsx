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

  const activeCaptains = stats.filter(p => p.isActive).sort((a, b) => {
    const aNever = a.totalCaptaincies === 0;
    const bNever = b.totalCaptaincies === 0;
    if (aNever && !bNever) return -1;
    if (!aNever && bNever) return 1;
    if (b.captaincyPriorityScore !== a.captaincyPriorityScore) return b.captaincyPriorityScore - a.captaincyPriorityScore;
    if (a.lastCaptainDate && b.lastCaptainDate) return new Date(a.lastCaptainDate).getTime() - new Date(b.lastCaptainDate).getTime();
    return 0;
  });

  const suggestedCaptains = activeCaptains.slice(0, 2);

  const renderCaptainsTable = (playerList: AggregatedPlayerStats[], title: string, icon: any) => (
    <div className="space-y-4">
      <div className="flex items-center gap-2 px-1">
        {icon}
        <h3 className="text-xs font-black uppercase tracking-[0.3em] text-muted-foreground font-oswald italic">{title}</h3>
      </div>
      <Card className="competition-card">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-black/20 border-white/5">
                <TableHead className="pl-6 font-bebas tracking-widest text-sm uppercase">Jugador</TableHead>
                <TableHead className="text-center font-bebas tracking-widest text-sm uppercase">Asist.</TableHead>
                <TableHead className="text-center font-bebas tracking-widest text-sm uppercase">Capi</TableHead>
                <TableHead className="text-right pr-6 font-bebas tracking-widest text-sm uppercase">Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {playerList.map((player) => (
                <TableRow key={player.playerId} className="official-table-row">
                  <TableCell className="pl-6 py-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8 border border-white/10">
                        <AvatarFallback className="bg-muted text-[10px] font-bebas">{getInitials(player.name)}</AvatarFallback>
                      </Avatar>
                      <Link href={`/players/${player.playerId}`} className="font-bold text-xs uppercase tracking-tight hover:text-primary transition-colors">{player.name}</Link>
                    </div>
                  </TableCell>
                  <TableCell className="text-center font-bebas text-lg italic text-muted-foreground">{player.matchesInLast5}/5</TableCell>
                  <TableCell className="text-center font-bebas text-xl text-white">{player.totalCaptaincies}</TableCell>
                  <TableCell className="text-right pr-6">
                    <Badge variant="outline" className={cn(
                      "font-oswald uppercase text-[8px] tracking-widest",
                      player.totalCaptaincies === 0 ? "border-emerald-500 text-emerald-500" : "border-white/10 text-muted-foreground"
                    )}>
                      {player.totalCaptaincies === 0 ? "DEBUTANTE" : "VETERANO"}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="flex flex-col gap-10 max-w-7xl mx-auto pb-20">
      <div className="space-y-2">
        <h1 className="text-5xl font-bebas text-white tracking-widest">TABLA DE POSICIONES</h1>
        <p className="text-muted-foreground font-oswald uppercase tracking-[0.3em] text-xs italic">Competición Oficial Temporada 2025</p>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="bg-black/40 border border-white/5 p-1 h-14 rounded-lg w-full flex overflow-x-auto no-scrollbar">
          {["General", "Goleadores", "Goles Fecha", "Efectividad", "Capitanes"].map((tab) => (
            <TabsTrigger 
              key={tab} 
              value={tab.toLowerCase().replace(" ", "-")}
              className="flex-1 min-w-[120px] font-bebas tracking-widest text-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-md transition-all"
            >
              {tab}
            </TabsTrigger>
          ))}
        </TabsList>

        <div className="mt-10">
          <TabsContent value="general" className="animate-in fade-in slide-in-from-bottom-2">
            <Card className="competition-card">
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-black/40 border-white/5 h-14">
                      <TableHead className="w-16 text-center font-bebas tracking-widest text-sm">POS</TableHead>
                      <TableHead className="font-bebas tracking-widest text-sm">JUGADOR</TableHead>
                      <TableHead className="text-center font-bebas tracking-widest text-sm">PJ</TableHead>
                      <TableHead className="text-center font-bebas tracking-widest text-sm text-emerald-500">GF</TableHead>
                      <TableHead className="text-center font-bebas tracking-widest text-sm text-red-500">GC</TableHead>
                      <TableHead className="text-center font-bebas tracking-widest text-sm">DIF</TableHead>
                      <TableHead className="text-center font-bebas tracking-widest text-sm bg-primary/10 text-primary">PTS</TableHead>
                      <TableHead className="text-center font-bebas tracking-widest text-sm">TREND</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedGeneral.map((player, index) => {
                      const points = player.wins * 3 + player.draws;
                      const podiumClass = index === 0 ? "podium-1" : index === 1 ? "podium-2" : index === 2 ? "podium-3" : "";
                      return (
                        <TableRow key={player.playerId} className={cn("official-table-row h-16", podiumClass)}>
                          <TableCell className="text-center font-bebas text-2xl italic">
                            {index + 1}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-4">
                              <Avatar className="h-10 w-10 border border-white/10">
                                <AvatarFallback className="bg-muted text-xs font-bebas">{getInitials(player.name)}</AvatarFallback>
                              </Avatar>
                              <Link href={`/players/${player.playerId}`} className="font-bold uppercase tracking-tight hover:text-primary transition-colors">
                                {player.name}
                              </Link>
                            </div>
                          </TableCell>
                          <TableCell className="text-center font-bebas text-xl">{player.matchesPlayed}</TableCell>
                          <TableCell className="text-center font-bebas text-xl text-emerald-500/60">{player.goalsFor}</TableCell>
                          <TableCell className="text-center font-bebas text-xl text-red-500/60">{player.goalsAgainst}</TableCell>
                          <TableCell className="text-center font-bebas text-xl">
                            {player.goalDifference > 0 ? `+${player.goalDifference}` : player.goalDifference}
                          </TableCell>
                          <TableCell className="text-center font-bebas text-3xl italic bg-primary/5">{points}</TableCell>
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
            <Card className="competition-card">
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-black/40 border-white/5 h-14">
                      <TableHead className="w-20 text-center font-bebas tracking-widest text-sm">POS</TableHead>
                      <TableHead className="font-bebas tracking-widest text-sm">JUGADOR</TableHead>
                      <TableHead className="text-center font-bebas tracking-widest text-sm">PJ</TableHead>
                      <TableHead className="text-center font-bebas tracking-widest text-sm">PROMEDIO</TableHead>
                      <TableHead className="text-right pr-10 font-bebas tracking-widest text-sm text-primary">GOLES</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedScorers.map((player, index) => {
                      const podiumClass = index === 0 ? "podium-1" : index === 1 ? "podium-2" : index === 2 ? "podium-3" : "";
                      return (
                        <TableRow key={player.playerId} className={cn("official-table-row h-20", podiumClass)}>
                          <TableCell className="text-center font-bebas text-3xl italic">
                            {index + 1}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-4">
                              <Avatar className="h-12 w-12 border border-white/10">
                                <AvatarFallback className="bg-muted font-bebas">{getInitials(player.name)}</AvatarFallback>
                              </Avatar>
                              <div className="flex flex-col">
                                <Link href={`/players/${player.playerId}`} className="font-bebas text-xl tracking-wide uppercase hover:text-primary transition-colors">
                                  {player.name}
                                </Link>
                                <span className="text-[10px] font-black text-muted-foreground uppercase font-oswald">{player.position}</span>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-center font-bebas text-2xl">{player.matchesPlayed}</TableCell>
                          <TableCell className="text-center font-oswald text-muted-foreground/60 text-sm">
                            {player.goalsPerMatch} G/PJ
                          </TableCell>
                          <TableCell className="text-right pr-10">
                            <span className="text-5xl font-bebas text-primary leading-none">
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

          <TabsContent value="capitanes" className="animate-in fade-in slide-in-from-bottom-2 space-y-12">
            {suggestedCaptains.length >= 2 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {suggestedCaptains.map((cap, idx) => (
                  <Card key={cap.playerId} className="competition-card border-t-4 border-t-primary bg-surface-900 overflow-hidden relative group">
                    <div className="absolute top-0 right-0 p-4 opacity-5"><Crown className="h-20 w-20 text-primary" /></div>
                    <CardContent className="p-8 flex items-center gap-6">
                      <div className="relative">
                        <Avatar className="h-20 w-20 border-4 border-primary/20">
                          <AvatarFallback className="text-3xl font-bebas bg-primary/5 text-primary">{getInitials(cap.name)}</AvatarFallback>
                        </Avatar>
                        <Badge className="absolute -bottom-2 -right-2 bg-primary text-primary-foreground font-bebas tracking-tighter">CAP</Badge>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary font-oswald">CANDIDATO {idx + 1}</p>
                        <h3 className="text-4xl font-bebas text-white uppercase tracking-wider">{cap.name}</h3>
                        <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest font-oswald">SUGERIDO PARA PORTAR LA CINTA</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {renderCaptainsTable(activeCaptains, "RANKING DE LIDERAZGO", <Users className="h-5 w-5 text-primary" />)}
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