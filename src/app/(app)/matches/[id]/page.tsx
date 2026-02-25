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
import { Award, Star, Loader2, Share2, Pencil, Quote, Camera, ChevronLeft, ChevronRight, X, Newspaper, Trophy, Sparkles } from "lucide-react";
import { useDoc, useCollection, useMemoFirebase, useFirestore, useUser } from "@/firebase";
import { doc, collection } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { format, parseISO, differenceInHours } from "date-fns";
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
                        <AvatarImage src={player.avatar || undefined} alt={player.name} />
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
  const [selectedPhoto, setSelectedPhoto] = React.useState<string | null>(null);

  if (!photos || photos.length === 0) return null;

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2 px-1">
        <Camera className="h-4 w-4 text-primary" />
        <h2 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">Galería de Combate</h2>
      </div>
      <div className="flex gap-4 overflow-x-auto pb-4 snap-x no-scrollbar">
        {photos.map((url, idx) => {
          if (!url) return null;
          return (
            <div 
              key={idx} 
              className="relative flex-none w-64 aspect-[4/3] rounded-2xl overflow-hidden cursor-zoom-in snap-center border-2 border-white/5 group"
              onClick={() => setSelectedPhoto(url)}
            >
              <img 
                src={url} 
                alt={`Foto ${idx + 1}`} 
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                data-ai-hint="football match action"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          );
        })}
      </div>

      <Dialog open={!!selectedPhoto} onOpenChange={(open) => !open && setSelectedPhoto(null)}>
        <DialogContent className="max-w-screen-lg p-0 bg-transparent border-none shadow-none">
          <DialogHeader className="sr-only"><DialogTitle>Foto Ampliada</DialogTitle></DialogHeader>
          <div className="relative w-full h-full flex items-center justify-center">
            {selectedPhoto && (
              <img src={selectedPhoto} className="max-w-full max-h-[90vh] object-contain rounded-xl shadow-2xl" alt="Zoom" />
            )}
            <button 
              className="absolute top-4 right-4 bg-black/50 hover:bg-black p-2 rounded-full text-white transition-colors"
              onClick={() => setSelectedPhoto(null)}
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

  const date = parseISO(match.date);
  const isPlayed = match.teamAScore > 0 || match.teamBScore > 0 || differenceInHours(new Date(), date) > 2;
  const hoursUntilMatch = differenceInHours(date, new Date());
  const showLineups = isPlayed || hoursUntilMatch <= 24;

  const allPlayers = players || [];
  const allPlayerStats = [...match.teamAPlayers, ...match.teamBPlayers];
  
  const mvpStat = allPlayerStats.find(s => s.isMvp);
  const bestGoalStat = allPlayerStats.find(s => s.hasBestGoal);

  return (
    <div className="space-y-10 max-w-5xl mx-auto pb-20">
      
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
            <Link href="/matches" className="flex items-center gap-2 text-xs font-black uppercase text-muted-foreground hover:text-primary transition-colors mb-4">
              <ChevronLeft className="h-3 w-3" /> Volver al Timeline
            </Link>
            <h1 className="text-5xl md:text-6xl font-black italic tracking-tighter uppercase leading-none">Ficha Técnica</h1>
            <div className="flex items-center gap-3">
                <Badge variant="outline" className="bg-white/5 border-white/10 uppercase font-black italic">
                  {format(date, "PPPP", { locale: es })}
                </Badge>
                {isPlayed ? (
                  <Badge className="bg-muted text-muted-foreground uppercase font-black italic">Jugado</Badge>
                ) : (
                  <Badge className="bg-primary text-white animate-pulse uppercase font-black italic">Próximo</Badge>
                )}
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

      {/* Scoreboard Hero */}
      <Card className="bg-gradient-to-br from-card to-background border-none shadow-[0_30px_100px_rgba(0,0,0,0.5)] overflow-hidden relative">
          <div className="absolute inset-0 bg-dot-pattern opacity-10 pointer-events-none" />
          <CardContent className="p-10 md:p-20 relative z-10">
              <div className="flex items-center justify-around gap-4">
                  <div className="flex flex-col items-center gap-6">
                      <span className="text-xl md:text-2xl font-black text-primary uppercase tracking-[0.3em] italic">Azul</span>
                      <span className="text-8xl md:text-[10rem] font-black text-primary drop-shadow-[0_0_30px_rgba(59,130,246,0.4)] leading-none italic">
                          {isPlayed ? match.teamAScore : "-"}
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
                          {isPlayed ? match.teamBScore : "-"}
                      </span>
                  </div>
              </div>
          </CardContent>
      </Card>

      {/* La Gaceta (Integrated Editorial) */}
      {match.aiSummary && (
        <section className="bg-[#fcfcf9] text-[#1a1a1a] rounded-2xl overflow-hidden shadow-2xl font-serif border border-black/10">
          <div className="p-4 sm:p-6 border-b border-black/5 flex items-center justify-between font-sans">
            <div className="flex items-center gap-2">
              <div className="bg-black text-white p-1 rounded-sm">
                <Newspaper className="h-4 w-4" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.2em]">The Gazette Editorial</span>
            </div>
            <span className="text-[8px] font-bold uppercase text-black/40">Edición Especial • {format(date, "dd/MM/yy")}</span>
          </div>
          <div className="p-8 sm:p-12 space-y-6">
            <h2 className="font-sans text-4xl sm:text-6xl font-black leading-none tracking-tighter uppercase italic text-center">
              {match.aiSummary.title}
            </h2>
            <p className="text-lg sm:text-xl leading-relaxed text-justify first-letter:text-6xl first-letter:font-black first-letter:float-left first-letter:mr-2 first-letter:mt-1 first-letter:text-black first-letter:font-sans">
              {match.aiSummary.summary}
            </p>
          </div>
        </section>
      )}

      {/* Photo Gallery */}
      <MatchGallery photos={match.photos || []} />

      {/* Lineups and Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-8 space-y-8">
            {showLineups ? (
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
            ) : (
              <Card className="glass-card p-12 text-center border-dashed">
                <Sparkles className="h-12 w-12 text-primary/30 mx-auto mb-4" />
                <h3 className="text-xl font-black uppercase italic">Equipos en Preparación</h3>
                <p className="text-muted-foreground text-sm max-w-xs mx-auto mt-2">
                  La alineación oficial se revelará 24 horas antes del pitazo inicial.
                </p>
              </Card>
            )}
        </div>

        <div className="lg:col-span-4 space-y-8">
            {isPlayed && (
              <>
                <Card className="glass-card border-yellow-500/20 overflow-hidden">
                  <CardHeader className="bg-yellow-500/5 pb-4">
                    <CardTitle className="text-xs font-black uppercase tracking-widest text-yellow-500 flex items-center gap-2">
                      <Award className="h-3 w-3" /> Honores de la Jornada
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6 space-y-6">
                    {mvpStat && (
                      <div className="flex items-center gap-4 group">
                        <div className="relative">
                          <Avatar className="h-12 w-12 border-2 border-yellow-500">
                            <AvatarImage src={allPlayers.find(p => p.id === mvpStat.playerId)?.avatar || undefined} alt="MVP" />
                            <AvatarFallback className="bg-yellow-500/10 text-yellow-500 font-black">{getInitials(allPlayers.find(p => p.id === mvpStat.playerId)?.name || "?")}</AvatarFallback>
                          </Avatar>
                          <Star className="absolute -top-2 -right-2 h-5 w-5 text-yellow-500 fill-yellow-500 animate-pulse" />
                        </div>
                        <div>
                          <p className="text-[10px] font-black uppercase text-yellow-500/60 leading-none mb-1">MVP Oficial</p>
                          <p className="text-lg font-black italic text-white uppercase">{allPlayers.find(p => p.id === mvpStat.playerId)?.name}</p>
                        </div>
                      </div>
                    )}
                    {bestGoalStat && (
                      <div className="flex items-center gap-4">
                        <Avatar className="h-12 w-12 border-2 border-primary">
                          <AvatarImage src={allPlayers.find(p => p.id === bestGoalStat.playerId)?.avatar || undefined} alt="Mejor Gol" />
                          <AvatarFallback className="bg-primary/10 text-primary font-black">{getInitials(allPlayers.find(p => p.id === bestGoalStat.playerId)?.name || "?")}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-[10px] font-black uppercase text-primary/60 leading-none mb-1">Mejor Gol</p>
                          <p className="text-lg font-black italic text-white uppercase">{allPlayers.find(p => p.id === bestGoalStat.playerId)?.name}</p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </>
            )}
            
            {match.comment && (
              <Card className="glass-card border-emerald-500/20">
                <CardHeader className="pb-2">
                  <CardTitle className="text-[10px] font-black uppercase tracking-widest text-emerald-500 flex items-center gap-2">
                    <Quote className="h-3 w-3" /> La Voz del Admin
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm font-medium italic text-white/80 leading-relaxed">
                    "{match.comment}"
                  </p>
                </CardContent>
              </Card>
            )}
        </div>
      </div>
    </div>
  );
}
