
'use client';

import * as React from 'react';
import { useParams } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import type { Player, PlayerStats, Match } from "@/lib/definitions";
import { cn, getInitials } from "@/lib/utils";
import { BestGoalVote } from "@/components/matches/best-goal-vote";
import { Award, Star, Loader2, Share2, Pencil, Quote, Camera, ChevronLeft, ChevronRight, X } from "lucide-react";
import { MatchAiSummary } from "@/components/matches/match-ai-summary";
import { useDoc, useCollection, useMemoFirebase, useFirestore, useUser } from "@/firebase";
import { doc, collection } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";

const PlayerStatsTable = ({
  title,
  stats,
  teamColor,
  allPlayers,
}: {
  title: string;
  stats: PlayerStats[];
  teamColor: "primary" | "accent";
  allPlayers: Player[];
}) => {
  return (
    <Card className="glass-card overflow-hidden">
      <CardHeader className={cn("pb-4", teamColor === 'primary' ? "bg-primary/5" : "bg-accent/5")}>
        <CardTitle className={cn("text-lg font-black uppercase italic tracking-tighter", teamColor === 'primary' ? "text-primary" : "text-accent")}>{title}</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/20 border-white/5">
              <TableHead className="pl-6 text-[10px] font-black uppercase">Jugador</TableHead>
              <TableHead className="text-center text-[10px] font-black uppercase">Goles</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {stats.map((stat) => {
              const player = allPlayers.find(p => p.id === stat.playerId);
              if (!player) return null;
              return (
                <TableRow key={player.id} className="border-white/5 hover:bg-white/5 transition-colors">
                  <TableCell className="pl-6 py-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={player.avatar} alt={player.name} />
                        <AvatarFallback className="text-[10px] font-black bg-muted">{getInitials(player.name)}</AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="font-bold text-sm text-white/90">{player.name}</span>
                        <div className="flex gap-1.5 mt-1">
                          {stat.isMvp && (
                            <Badge variant="outline" className="h-4 text-[8px] border-yellow-500/50 text-yellow-500 bg-yellow-500/5 uppercase font-black">
                              MVP
                            </Badge>
                          )}
                          {stat.hasBestGoal && (
                            <Badge variant="outline" className="h-4 text-[8px] border-primary/50 text-primary bg-primary/5 uppercase font-black">
                              Golazo
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-center font-black italic text-xl">
                    {stat.goals}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export function MatchGallery({ photos }: { photos: string[] }) {
  const [selectedPhoto, setSelectedPlayer] = React.useState<string | null>(null);

  if (!photos || photos.length === 0) return null;

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2 px-1">
        <Camera className="h-4 w-4 text-primary" />
        <h2 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">Galería de Combate</h2>
      </div>
      <div className="flex gap-4 overflow-x-auto pb-4 snap-x no-scrollbar">
        {photos.map((url, idx) => (
          <div 
            key={idx} 
            className="relative flex-none w-64 aspect-[4/3] rounded-2xl overflow-hidden cursor-zoom-in snap-center border-2 border-white/5 group"
            onClick={() => setSelectedPlayer(url)}
          >
            <img 
              src={url} 
              alt={`Foto ${idx + 1}`} 
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              data-ai-hint="football match action"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        ))}
      </div>

      <Dialog open={!!selectedPhoto} onOpenChange={(open) => !open && setSelectedPlayer(null)}>
        <DialogContent className="max-w-screen-lg p-0 bg-transparent border-none shadow-none">
          <DialogHeader className="sr-only"><DialogTitle>Foto Ampliada</DialogTitle></DialogHeader>
          <div className="relative w-full h-full flex items-center justify-center">
            <img src={selectedPhoto || ""} className="max-w-full max-h-[90vh] object-contain rounded-xl shadow-2xl" alt="Zoom" />
            <button 
              className="absolute top-4 right-4 bg-black/50 hover:bg-black p-2 rounded-full text-white transition-colors"
              onClick={() => setSelectedPlayer(null)}
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}

export default function MatchDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();

  const matchRef = useMemoFirebase(() => {
    if (!firestore || !id) return null;
    return doc(firestore, 'matches', id);
  }, [firestore, id]);

  const playersRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'players');
  }, [firestore]);

  const adminRoleRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'roles_admin', user.uid);
  }, [firestore, user]);

  const { data: match, isLoading: matchLoading } = useDoc<Match>(matchRef);
  const { data: players, isLoading: playersLoading } = useCollection<Player>(playersRef);
  const { data: adminRole } = useDoc<{isAdmin: boolean}>(adminRoleRef);

  const isAdmin = adminRole?.isAdmin;

  const handleShare = () => {
    const text = `⚽ *REAL ACADE* ⚽\n\n` +
      `🔥 *AZUL ${match?.teamAScore} - ${match?.teamBScore} ROJO*\n` +
      `📅 ${format(parseISO(match?.date || ""), "PPP", { locale: es })}\n\n` +
      `Mirá la crónica completa y las fotos acá:\n` +
      `${window.location.href}`;
    
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  if (matchLoading || playersLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!match) return <div className="text-center py-12 font-black uppercase italic opacity-20">Partido no encontrado.</div>;

  const allPlayers = players || [];
  const allPlayerStats = [...match.teamAPlayers, ...match.teamBPlayers];
  
  const scorers = allPlayerStats
    .filter(stat => stat.goals > 0)
    .map(stat => {
      const player = allPlayers.find(p => p.id === stat.playerId);
      return player ? { ...player, goals: stat.goals } : null;
    })
    .filter(Boolean) as (Player & { goals: number })[];

  const mvpStat = allPlayerStats.find(s => s.isMvp);
  const bestGoalStat = allPlayerStats.find(s => s.hasBestGoal);

  const matchSummaryData = {
    date: match.date,
    teamAScore: match.teamAScore,
    teamBScore: match.teamBScore,
    teamAPlayers: match.teamAPlayers.map(s => ({ name: allPlayers.find(p => p.id === s.playerId)?.name || 'Desconocido', goals: s.goals })),
    teamBPlayers: match.teamBPlayers.map(s => ({ name: allPlayers.find(p => p.id === s.playerId)?.name || 'Desconocido', goals: s.goals })),
    mvpName: mvpStat ? allPlayers.find(p => p.id === mvpStat.playerId)?.name : undefined,
    bestGoalName: bestGoalStat ? allPlayers.find(p => p.id === bestGoalStat.playerId)?.name : undefined,
  };

  return (
    <div className="space-y-10 max-w-5xl mx-auto pb-20">
      
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
            <Link href="/matches" className="flex items-center gap-2 text-xs font-black uppercase text-muted-foreground hover:text-primary transition-colors mb-4">
              <ChevronLeft className="h-3 w-3" /> Volver al Timeline
            </Link>
            <h1 className="text-5xl md:text-6xl font-black italic tracking-tighter uppercase leading-none">Anatomía del Partido</h1>
            <div className="flex items-center gap-3">
                <Badge variant="outline" className="bg-white/5 border-white/10 uppercase font-black italic">
                  {format(parseISO(match.date), "PPPP", { locale: es })}
                </Badge>
                <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-emerald-500/10 hover:text-emerald-500" onClick={handleShare}>
                        <Share2 className="h-4 w-4" />
                    </Button>
                    {isAdmin && (
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" asChild>
                            <Link href={`/matches/${id}/edit`}><Pencil className="h-4 w-4" /></Link>
                        </Button>
                    )}
                </div>
            </div>
        </div>
      </div>

      <Card className="bg-gradient-to-br from-card to-background border-none shadow-[0_30px_100px_rgba(0,0,0,0.5)] overflow-hidden relative">
          <div className="absolute inset-0 bg-dot-pattern opacity-10 pointer-events-none" />
          <CardContent className="p-10 md:p-20 relative z-10">
              <div className="flex items-center justify-around gap-4">
                  <div className="flex flex-col items-center gap-6">
                      <span className="text-xl md:text-2xl font-black text-primary uppercase tracking-[0.3em] italic">Azul</span>
                      <span className="text-8xl md:text-[10rem] font-black text-primary drop-shadow-[0_0_30px_rgba(59,130,246,0.4)] leading-none italic">
                          {match.teamAScore}
                      </span>
                  </div>
                  <div className="flex flex-col items-center">
                      <div className="h-24 w-[2px] bg-white/5 rotate-12 mb-4"></div>
                      <span className="text-4xl font-light text-muted-foreground/20 italic">VS</span>
                      <div className="h-24 w-[2px] bg-white/5 -rotate-12 mt-4"></div>
                  </div>
                  <div className="flex flex-col items-center gap-6">
                      <span className="text-xl md:text-2xl font-black text-accent uppercase tracking-[0.3em] italic">Rojo</span>
                      <span className="text-8xl md:text-[10rem] font-black text-accent drop-shadow-[0_0_30px_rgba(244,63,94,0.4)] leading-none italic">
                          {match.teamBScore}
                      </span>
                  </div>
              </div>
          </CardContent>
      </Card>

      <MatchGallery photos={match.photos || []} />

      {match.comment && (
        <section className="relative">
          <div className="absolute -left-4 top-0 h-full w-1 bg-emerald-500 rounded-full opacity-50" />
          <div className="bg-emerald-500/5 p-8 rounded-2xl border border-emerald-500/10">
            <div className="flex items-center gap-2 mb-4">
              <Quote className="h-5 w-5 text-emerald-500" />
              <h3 className="text-xs font-black uppercase tracking-widest text-emerald-500/60">Análisis del Administrador</h3>
            </div>
            <p className="text-xl md:text-2xl font-medium italic text-white/80 leading-relaxed">
              {match.comment}
            </p>
          </div>
        </section>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-8 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <PlayerStatsTable
                title="Batallón Azul"
                stats={match.teamAPlayers}
                teamColor="primary"
                allPlayers={allPlayers}
                />
                <PlayerStatsTable
                title="Escuadrón Rojo"
                stats={match.teamBPlayers}
                teamColor="accent"
                allPlayers={allPlayers}
                />
            </div>
        </div>

        <div className="lg:col-span-4 space-y-8">
            <MatchAiSummary matchData={matchSummaryData} />
            <BestGoalVote matchId={id} scorers={scorers} />
        </div>
      </div>
    </div>
  );
}
