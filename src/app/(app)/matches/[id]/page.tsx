
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
import { Award, Star, Loader2, Share2, Pencil, Quote, Camera, ChevronLeft, Newspaper, Trophy, Sparkles, X, Calendar, Goal, User } from "lucide-react";
import { useDoc, useCollection, useMemoFirebase, useFirestore, useUser } from "@/firebase";
import { doc, collection } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { format, parseISO, differenceInHours } from "date-fns";
import { es } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
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
        {photos.map((url, idx) => (
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
        ))}
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
  const allPlayers = players || [];
  const allPlayerStats = [...match.teamAPlayers, ...match.teamBPlayers];
  
  const mvpPlayer = allPlayers.find(p => p.id === allPlayerStats.find(s => s.isMvp)?.playerId);
  const topScorerStat = [...allPlayerStats].sort((a, b) => b.goals - a.goals)[0];
  const topScorer = allPlayers.find(p => p.id === topScorerStat?.playerId);

  const teamAGoalEvents = match.teamAPlayers.filter(p => p.goals > 0);
  const teamBGoalEvents = match.teamBPlayers.filter(p => p.goals > 0);

  const handleShare = () => {
    const text = `⚽ *REAL ACADE* ⚽\n\n` +
      `🔥 *AZUL ${match.teamAScore} - ${match.teamBScore} ROJO*\n` +
      `📅 ${format(date, "PPP", { locale: es })}\n\n` +
      `Mirá la crónica completa y las fotos acá:\n` +
      `${window.location.href}`;
    
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-12 max-w-4xl mx-auto pb-20">
      
      {/* 1. ARTICLE HEADER */}
      <div className="flex flex-col items-center text-center gap-6">
        <Link href="/matches" className="flex items-center gap-2 text-[10px] font-black uppercase text-muted-foreground hover:text-primary transition-colors font-oswald tracking-widest">
          <ChevronLeft className="h-3 w-3" /> VOLVER AL HISTORIAL
        </Link>
        <div className="space-y-2">
          <span className="text-xs font-black uppercase tracking-[0.4em] text-primary font-oswald">LA GACETA DEL PARTIDO</span>
          <p className="text-sm font-bold text-muted-foreground/60 uppercase tracking-widest">{format(date, "PPPP", { locale: es })}</p>
        </div>
        
        <div className="flex items-center justify-center gap-10 md:gap-20">
          <div className="flex flex-col items-center">
            <span className="text-7xl md:text-9xl font-bebas text-primary italic leading-none">{match.teamAScore}</span>
            <span className="text-xs font-black uppercase tracking-widest text-primary font-oswald">AZUL</span>
          </div>
          <div className="text-2xl md:text-4xl font-light text-muted-foreground/20 italic font-oswald shrink-0">—</div>
          <div className="flex flex-col items-center">
            <span className="text-7xl md:text-9xl font-bebas text-white italic leading-none">{match.teamBScore}</span>
            <span className="text-xs font-black uppercase tracking-widest text-accent font-oswald">ROJO</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-8 border-white/10 rounded-full font-oswald text-[10px] tracking-widest uppercase" onClick={handleShare}>
            <Share2 className="h-3 w-3 mr-2" /> Compartir
          </Button>
          {isAdmin && (
            <Button variant="outline" size="sm" className="h-8 border-white/10 rounded-full font-oswald text-[10px] tracking-widest uppercase" asChild>
              <Link href={`/matches/${id}/edit`}><Pencil className="h-3 w-3 mr-2" /> Editar</Link>
            </Button>
          )}
        </div>
      </div>

      {/* 2 & 3. HEADLINE & SUBTITLE */}
      {match.aiSummary && (
        <div className="text-center space-y-6 max-w-3xl mx-auto border-y border-white/5 py-10">
          <h1 className="text-4xl md:text-7xl font-bebas leading-[0.9] tracking-tight uppercase italic text-white drop-shadow-2xl">
            {match.aiSummary.title}
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground font-lora italic leading-relaxed px-4">
            {match.aiSummary.subtitle}
          </p>
        </div>
      )}

      {/* 4. HERO IMAGE */}
      <div className="relative group">
        <div className="aspect-video w-full rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
          <img 
            src={match.photos?.[0] || "https://picsum.photos/seed/football/1200/800"} 
            alt="Hero Match" 
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
        </div>
        
        {/* Overlay */}
        <div className="absolute bottom-6 left-6 flex items-end gap-4 pointer-events-none">
          <div className="bg-primary px-4 py-2 rounded-lg shadow-xl">
            <span className="font-bebas text-2xl text-white italic tracking-widest">{match.teamAScore} - {match.teamBScore}</span>
          </div>
          <div className="bg-black/60 backdrop-blur-md px-4 py-2 rounded-lg border border-white/10">
            <span className="text-[10px] font-black text-white uppercase tracking-widest font-oswald">{format(date, "dd MMM", { locale: es })}</span>
          </div>
        </div>
      </div>

      {/* 5. MATCH FACTS CARD */}
      <Card className="competition-card border-none bg-white/5 backdrop-blur-sm">
        <div className="grid grid-cols-1 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-white/5">
          <div className="p-6 flex flex-col items-center gap-1">
            <div className="flex items-center gap-2 text-primary">
              <Trophy className="h-4 w-4" />
              <span className="text-[10px] font-black uppercase tracking-widest font-oswald">RESULTADO</span>
            </div>
            <span className="text-3xl font-bebas text-white italic">{match.teamAScore} - {match.teamBScore}</span>
          </div>
          <div className="p-6 flex flex-col items-center gap-1">
            <div className="flex items-center gap-2 text-yellow-500">
              <Star className="h-4 w-4" />
              <span className="text-[10px] font-black uppercase tracking-widest font-oswald">MVP</span>
            </div>
            <span className="text-xl font-bebas text-white uppercase truncate max-w-full">{mvpPlayer?.name || "Sin elegir"}</span>
          </div>
          <div className="p-6 flex flex-col items-center gap-1">
            <div className="flex items-center gap-2 text-accent">
              <Goal className="h-4 w-4" />
              <span className="text-[10px] font-black uppercase tracking-widest font-oswald">PICHICHI FECHA</span>
            </div>
            <span className="text-xl font-bebas text-white uppercase truncate max-w-full">{topScorer?.name || "N/A"} ({topScorerStat?.goals || 0})</span>
          </div>
          <div className="p-6 flex flex-col items-center gap-1">
            <div className="flex items-center gap-2 text-muted-foreground/60">
              <Calendar className="h-4 w-4" />
              <span className="text-[10px] font-black uppercase tracking-widest font-oswald">FECHA</span>
            </div>
            <span className="text-xl font-bebas text-white">{format(date, "dd/MM/yyyy")}</span>
          </div>
        </div>
      </Card>

      {/* 6 & 7. ARTICLE BODY & HIGHLIGHT QUOTE */}
      {match.aiSummary && (
        <div className="max-w-[700px] mx-auto space-y-10 py-10">
          <div className="prose prose-invert prose-lg">
            <p className="text-xl leading-relaxed text-muted-foreground font-lora first-letter:text-7xl first-letter:font-black first-letter:float-left first-letter:mr-3 first-letter:mt-2 first-letter:text-primary">
              {match.aiSummary.summary}
            </p>
          </div>

          <blockquote className="border-l-4 border-primary pl-8 py-4 italic text-2xl text-white/90 font-lora bg-primary/5 rounded-r-lg">
            "{match.aiSummary.subtitle}"
          </blockquote>
        </div>
      )}

      {/* 8. GOALS SECTION */}
      <section className="space-y-8 max-w-[700px] mx-auto pt-10 border-t border-white/5">
        <h2 className="text-center text-xs font-black uppercase tracking-[0.4em] text-muted-foreground font-oswald">GOLES DEL PARTIDO</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-primary/20 pb-2">
              <Badge className="bg-primary text-[10px] font-black tracking-widest rounded-none">EQUIPO AZUL</Badge>
            </div>
            <div className="space-y-3">
              {teamAGoalEvents.length > 0 ? teamAGoalEvents.map(p => (
                <div key={p.playerId} className="flex items-center justify-between group">
                  <div className="flex items-center gap-3">
                    <Goal className="h-4 w-4 text-primary opacity-40 group-hover:opacity-100 transition-opacity" />
                    <span className="text-sm font-bold text-white/80 uppercase tracking-tighter">{allPlayers.find(pl => pl.id === p.playerId)?.name}</span>
                  </div>
                  <span className="font-bebas text-xl text-primary italic">x{p.goals}</span>
                </div>
              )) : <p className="text-xs italic text-muted-foreground/40">Sin goles marcados</p>}
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-accent/20 pb-2">
              <Badge className="bg-accent text-[10px] font-black tracking-widest rounded-none">EQUIPO ROJO</Badge>
            </div>
            <div className="space-y-3">
              {teamBGoalEvents.length > 0 ? teamBGoalEvents.map(p => (
                <div key={p.playerId} className="flex items-center justify-between group">
                  <div className="flex items-center gap-3">
                    <Goal className="h-4 w-4 text-accent opacity-40 group-hover:opacity-100 transition-opacity" />
                    <span className="text-sm font-bold text-white/80 uppercase tracking-tighter">{allPlayers.find(pl => pl.id === p.playerId)?.name}</span>
                  </div>
                  <span className="font-bebas text-xl text-accent italic">x{p.goals}</span>
                </div>
              )) : <p className="text-xs italic text-muted-foreground/40">Sin goles marcados</p>}
            </div>
          </div>
        </div>
      </section>

      {/* Extra: Match Context & Gallery */}
      <div className="pt-20 space-y-12">
        <MatchGallery photos={match.photos || []} />
        
        {match.comment && (
          <Card className="competition-card border-l-4 border-l-primary bg-primary/5">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <Quote className="h-8 w-8 text-primary/20 shrink-0" />
                <div className="space-y-2">
                  <p className="text-xs font-black uppercase tracking-widest text-primary font-oswald">LA VOZ DEL ADMIN</p>
                  <p className="text-lg font-medium italic text-white/80 leading-relaxed">
                    "{match.comment}"
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

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
    </div>
  );
}
