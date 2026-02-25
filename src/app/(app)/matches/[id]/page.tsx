'use client';

import * as React from 'react';
import { useParams } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
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
import { Award, Star, Loader2, Share2, Pencil, Quote, Camera, ChevronLeft, Newspaper, Trophy, Sparkles, X } from "lucide-react";
import { useDoc, useCollection, useMemoFirebase, useFirestore, useUser } from "@/firebase";
import { doc, collection } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { format, parseISO, differenceInHours } from "date-fns";
import { es } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
    <Card className="competition-card overflow-hidden">
      <CardHeader className={cn("pb-4 border-b border-white/5", teamColor === 'primary' ? "bg-primary/5" : "bg-accent/5")}>
        <CardTitle className={cn("text-lg font-bebas tracking-widest uppercase italic", teamColor === 'primary' ? "text-primary" : "text-accent")}>{title}</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow className="bg-black/20 border-white/5">
              <TableHead className="pl-6 font-bebas tracking-widest text-[10px] uppercase">Jugador</TableHead>
              <TableHead className="text-center font-bebas tracking-widest text-[10px] uppercase">Goles</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {stats.map((stat) => {
              const player = allPlayers.find(p => p.id === stat.playerId);
              if (!player) return null;
              return (
                <TableRow key={player.id} className="official-table-row">
                  <TableCell className="pl-6 py-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8 border border-white/10">
                        <AvatarImage src={player.avatar || undefined} alt={player.name} />
                        <AvatarFallback className="text-[10px] font-bebas bg-muted">{getInitials(player.name)}</AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="font-bold text-sm text-white/90 uppercase tracking-tight">{player.name}</span>
                        <div className="flex gap-1.5 mt-1">
                          {stat.isMvp && (
                            <Badge variant="outline" className="h-4 text-[8px] border-primary/50 text-primary bg-primary/5 uppercase font-black rounded-none">
                              MVP
                            </Badge>
                          )}
                          {stat.hasBestGoal && (
                            <Badge variant="outline" className="h-4 text-[8px] border-accent/50 text-accent bg-accent/5 uppercase font-black rounded-none">
                              GOLAZO
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-center font-bebas italic text-2xl">
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
        <h2 className="text-xs font-bebas tracking-[0.3em] uppercase text-muted-foreground">GALERÍA DE COMBATE</h2>
      </div>
      <div className="flex gap-4 overflow-x-auto pb-4 snap-x no-scrollbar">
        {photos.map((url, idx) => {
          if (!url) return null;
          return (
            <div 
              key={idx} 
              className="relative flex-none w-64 aspect-[4/3] rounded-lg overflow-hidden cursor-zoom-in snap-center border border-white/10 group hover-lift"
              onClick={() => setSelectedPhoto(url)}
            >
              <img 
                src={url} 
                alt={`Foto ${idx + 1}`} 
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          );
        })}
      </div>

      <Dialog open={!!selectedPhoto} onOpenChange={(open) => !open && setSelectedPhoto(null)}>
        <DialogContent className="max-w-screen-lg p-0 bg-transparent border-none shadow-none">
          <div className="relative w-full h-full flex items-center justify-center">
            {selectedPhoto && (
              <img src={selectedPhoto} className="max-w-full max-h-[90vh] object-contain rounded-none shadow-2xl" alt="Zoom" />
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

  if (!match) return <div className="text-center py-12 font-bebas text-2xl uppercase opacity-20">Partido no encontrado.</div>;

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
            <Link href="/matches" className="flex items-center gap-2 text-[10px] font-black uppercase text-muted-foreground hover:text-primary transition-colors mb-4 font-oswald tracking-widest">
              <ChevronLeft className="h-3 w-3" /> VOLVER AL HISTORIAL
            </Link>
            <h1 className="text-6xl font-bebas tracking-widest text-white">FICHA TÉCNICA</h1>
            <div className="flex items-center gap-3">
                <Badge variant="outline" className="bg-white/5 border-white/10 uppercase font-oswald tracking-widest text-[10px] rounded-none">
                  {format(date, "PPPP", { locale: es })}
                </Badge>
                {isPlayed ? (
                  <Badge className="bg-muted text-muted-foreground uppercase font-oswald tracking-widest text-[10px] rounded-none">FINALIZADO</Badge>
                ) : (
                  <Badge className="bg-primary text-primary-foreground animate-pulse uppercase font-oswald tracking-widest text-[10px] rounded-none">PRÓXIMO</Badge>
                )}
                <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-primary/10 hover:text-primary text-muted-foreground" onClick={handleShare}>
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
      <Card className="competition-card border-none overflow-hidden relative">
          <CardContent className="p-10 md:p-16 relative z-10 bg-gradient-to-b from-black/20 to-transparent">
              <div className="flex items-center justify-around gap-4">
                  <div className="flex flex-col items-center gap-4">
                      <span className="text-xl font-bebas text-primary tracking-[0.4em] uppercase italic">Azul</span>
                      <span className="text-[8rem] md:text-[10rem] font-bebas text-white leading-none italic drop-shadow-2xl">
                          {isPlayed ? match.teamAScore : "-"}
                      </span>
                  </div>
                  <div className="flex flex-col items-center">
                      <div className="h-20 w-[1px] bg-white/10 mb-4" />
                      <span className="text-2xl font-oswald text-muted-foreground/40 italic tracking-widest">VS</span>
                      <div className="h-20 w-[1px] bg-white/10 mt-4" />
                  </div>
                  <div className="flex flex-col items-center gap-4">
                      <span className="text-xl font-bebas text-accent tracking-[0.4em] uppercase italic">Rojo</span>
                      <span className="text-[8rem] md:text-[10rem] font-bebas text-white leading-none italic drop-shadow-2xl">
                          {isPlayed ? match.teamBScore : "-"}
                      </span>
                  </div>
              </div>
          </CardContent>
      </Card>

      {/* La Gaceta (Integrated Editorial) */}
      {match.aiSummary && (
        <section className="editorial-paper rounded-none shadow-2xl border-t-4 border-black">
          <div className="p-4 sm:p-6 border-b border-black/5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="bg-black text-white p-1 rounded-none">
                <Newspaper className="h-4 w-4" />
              </div>
              <span className="text-[10px] font-bebas tracking-[0.3em] uppercase text-black">THE ACADEMY GAZETTE EDITORIAL</span>
            </div>
            <span className="text-[8px] font-bold uppercase text-black/40 font-oswald">ESPECIAL JORNADA • {format(date, "dd/MM/yy")}</span>
          </div>
          <div className="p-8 sm:p-16 space-y-8">
            <div className="text-center space-y-4">
                <h2 className="editorial-title text-4xl sm:text-6xl uppercase italic text-black">
                {match.aiSummary.title}
                </h2>
                <div className="editorial-divider max-w-xs mx-auto" />
            </div>
            <p className="text-xl sm:text-2xl leading-relaxed text-justify text-[#111111] font-lora first-letter:text-7xl first-letter:font-black first-letter:float-left first-letter:mr-3 first-letter:mt-2 first-letter:text-black first-letter:font-playfair">
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
              <Card className="competition-card p-12 text-center border-dashed border-white/10 bg-transparent">
                <Sparkles className="h-12 w-12 text-primary/30 mx-auto mb-4" />
                <h3 className="text-xl font-bebas tracking-widest uppercase italic text-white">Equipos en Preparación</h3>
                <p className="text-muted-foreground text-xs font-oswald tracking-widest uppercase mt-2">
                  La alineación oficial se revelará 24 horas antes del pitazo inicial.
                </p>
              </Card>
            )}
        </div>

        <div className="lg:col-span-4 space-y-8">
            {isPlayed && (
              <>
                <Card className="competition-card border-t-4 border-t-primary">
                  <CardHeader className="bg-white/5 pb-4 border-b border-white/5">
                    <CardTitle className="text-xs font-bebas tracking-widest uppercase text-primary flex items-center gap-2">
                      <Award className="h-3 w-3" /> HONORES DE LA JORNADA
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6 space-y-6">
                    {mvpStat && (
                      <div className="flex items-center gap-4 group">
                        <div className="relative">
                          <Avatar className="h-14 w-14 border-2 border-primary shadow-xl shadow-primary/20">
                            <AvatarImage src={allPlayers.find(p => p.id === mvpStat.playerId)?.avatar || undefined} alt="MVP" />
                            <AvatarFallback className="bg-primary text-primary-foreground font-bebas text-lg">{getInitials(allPlayers.find(p => p.id === mvpStat.playerId)?.name || "?")}</AvatarFallback>
                          </Avatar>
                          <Star className="absolute -top-2 -right-2 h-5 w-5 text-primary fill-primary animate-pulse" />
                        </div>
                        <div>
                          <p className="text-[8px] font-black uppercase text-primary/60 tracking-widest mb-1 font-oswald">M.V.P. OFICIAL</p>
                          <p className="text-xl font-bebas tracking-wide text-white uppercase italic leading-none">{allPlayers.find(p => p.id === mvpStat.playerId)?.name}</p>
                        </div>
                      </div>
                    )}
                    {bestGoalStat && (
                      <div className="flex items-center gap-4">
                        <Avatar className="h-14 w-14 border-2 border-accent shadow-xl shadow-accent/20">
                          <AvatarImage src={allPlayers.find(p => p.id === bestGoalStat.playerId)?.avatar || undefined} alt="Mejor Gol" />
                          <AvatarFallback className="bg-accent text-accent-foreground font-bebas text-lg">{getInitials(allPlayers.find(p => p.id === bestGoalStat.playerId)?.name || "?")}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-[8px] font-black uppercase text-accent/60 tracking-widest mb-1 font-oswald">MEJOR GOL</p>
                          <p className="text-xl font-bebas tracking-wide text-white uppercase italic leading-none">{allPlayers.find(p => p.id === bestGoalStat.playerId)?.name}</p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </>
            )}
            
            {match.comment && (
              <Card className="competition-card border-l-4 border-l-success">
                <CardHeader className="pb-2">
                  <CardTitle className="text-[10px] font-black uppercase tracking-widest text-success flex items-center gap-2 font-oswald">
                    <Quote className="h-3 w-3" /> LA VOZ DEL ADMIN
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm font-medium italic text-muted-foreground leading-relaxed font-inter">
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