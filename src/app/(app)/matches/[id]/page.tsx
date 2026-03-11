'use client';

import * as React from 'react';
import { useParams } from "next/navigation";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import type { Player, Match } from "@/lib/definitions";
import { getInitials } from "@/lib/utils";
import { Award, Star, Loader2, Share2, Pencil, Camera, ChevronLeft, Trophy, Calendar, Goal, X, User, Sparkles } from "lucide-react";
import { useDoc, useCollection, useMemoFirebase, useFirestore, useUser } from "@/firebase";
import { doc, collection } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";

export default function MatchDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const firestore = useFirestore();
  const { user } = useUser();
  const [selectedPhoto, setSelectedPhoto] = React.useState<string | null>(null);

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

  // LÓGICA DE PREMIOS Y DATOS CLAVE
  const allPlayers = players || [];
  
  const mvpPlayer = React.useMemo(() => {
    if (!match || !allPlayers.length) return null;
    const stat = [...match.teamAPlayers, ...match.teamBPlayers].find(s => s.isMvp === true);
    return allPlayers.find(p => p.id === stat?.playerId);
  }, [match, allPlayers]);

  const bestGoalPlayer = React.useMemo(() => {
    if (!match || !allPlayers.length) return null;
    const stat = [...match.teamAPlayers, ...match.teamBPlayers].find(s => s.hasBestGoal === true);
    return allPlayers.find(p => p.id === stat?.playerId);
  }, [match, allPlayers]);

  const matchTopScorer = React.useMemo(() => {
    if (!match || !allPlayers.length) return null;
    const allStats = [...match.teamAPlayers, ...match.teamBPlayers];
    const sorted = allStats.filter(s => s.goals > 0).sort((a, b) => b.goals - a.goals);
    if (sorted.length === 0) return null;
    const topStat = sorted[0];
    const player = allPlayers.find(p => p.id === topStat.playerId);
    return player ? { name: player.name, goals: topStat.goals } : null;
  }, [match, allPlayers]);

  if (matchLoading || playersLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!match) return <div className="text-center py-12 font-bebas text-2xl uppercase opacity-20">Partido no encontrado.</div>;

  const date = parseISO(match.date);

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
    <div className="max-w-4xl mx-auto pb-20 space-y-16">
      
      {/* 1. ARTICLE HEADER */}
      <div className="flex flex-col items-center text-center gap-8">
        <Link href="/matches" className="flex items-center gap-2 text-[10px] font-black uppercase text-muted-foreground hover:text-primary transition-colors font-oswald tracking-[0.3em]">
          <ChevronLeft className="h-3 w-3" /> VOLVER AL HISTORIAL
        </Link>
        
        <div className="space-y-4">
          <Badge variant="outline" className="px-6 py-1 border-primary/30 text-primary font-bebas tracking-[0.4em] text-sm uppercase rounded-none">
            La Gaceta del Partido
          </Badge>
          <p className="text-sm font-bold text-muted-foreground/60 uppercase tracking-[0.2em] font-oswald">
            {format(date, "PPPP", { locale: es })}
          </p>
        </div>
        
        <div className="flex items-center justify-center gap-12 md:gap-24">
          <div className="flex flex-col items-center">
            <span className="text-8xl md:text-[10rem] font-bebas text-primary leading-none italic drop-shadow-2xl">
              {match.teamAScore}
            </span>
            <span className="text-xs font-black uppercase tracking-[0.4em] text-primary font-oswald mt-2">AZUL</span>
          </div>
          <div className="text-4xl md:text-6xl font-light text-muted-foreground/10 italic font-oswald shrink-0 self-center">—</div>
          <div className="flex flex-col items-center">
            <span className="text-8xl md:text-[10rem] font-bebas text-white leading-none italic drop-shadow-2xl">
              {match.teamBScore}
            </span>
            <span className="text-xs font-black uppercase tracking-[0.4em] text-accent font-oswald mt-2">ROJO</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" className="h-9 border-white/10 rounded-full font-oswald text-[10px] tracking-widest uppercase hover:bg-primary/10 hover:text-primary transition-all" onClick={handleShare}>
            <Share2 className="h-3 w-3 mr-2" /> Compartir CRÓNICA
          </Button>
          {adminRole?.isAdmin && (
            <Button variant="outline" size="sm" className="h-9 border-white/10 rounded-full font-oswald text-[10px] tracking-widest uppercase hover:bg-yellow-500/10 hover:text-yellow-500 transition-all" asChild>
              <Link href={`/matches/${id}/edit`}><Pencil className="h-3 w-3 mr-2" /> Editar Reporte</Link>
            </Button>
          )}
        </div>
      </div>

      {/* 2 & 3. ARTICLE HEADLINE & SUBTITLE */}
      {match.aiSummary && (
        <div className="text-center space-y-6 max-w-3xl mx-auto border-y border-white/5 py-12">
          <h1 className="text-5xl md:text-8xl font-black font-playfair leading-[0.9] tracking-tight uppercase italic text-white">
            {match.aiSummary.title}
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground font-lora italic leading-relaxed px-6 opacity-80">
            {match.aiSummary.subtitle}
          </p>
        </div>
      )}

      {/* 4. HERO IMAGE WITH OVERLAY */}
      <div className="relative group px-4 sm:px-0">
        <div className="aspect-video w-full rounded-2xl overflow-hidden border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)]">
          <img 
            src={match.photos?.[0] || "https://picsum.photos/seed/football/1200/800"} 
            alt="Hero Match" 
            className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
        </div>
        
        {/* Overlay Label */}
        <div className="absolute bottom-8 left-8 md:left-12 flex flex-col items-start gap-2 pointer-events-none">
          <div className="bg-primary/90 backdrop-blur-md px-6 py-2 rounded-sm shadow-2xl">
            <span className="font-bebas text-3xl text-white italic tracking-widest">AZUL {match.teamAScore} — {match.teamBScore} ROJO</span>
          </div>
          <div className="bg-black/60 backdrop-blur-md px-4 py-1.5 rounded-sm border border-white/10">
            <span className="text-[10px] font-black text-white uppercase tracking-[0.3em] font-oswald">
              {format(date, "dd MMMM yyyy", { locale: es })}
            </span>
          </div>
        </div>
      </div>

      {/* 5. MATCH FACTS CARD */}
      <Card className="competition-card border-none bg-white/5 backdrop-blur-md mx-4 sm:mx-0">
        <div className="grid grid-cols-1 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-white/5">
          <div className="p-8 flex flex-col items-center text-center gap-2">
            <div className="flex items-center gap-2 text-primary/60">
              <Trophy className="h-4 w-4" />
              <span className="text-[9px] font-black uppercase tracking-[0.3em] font-oswald">RESULTADO</span>
            </div>
            <span className="text-4xl font-bebas text-white italic">{match.teamAScore}-{match.teamBScore}</span>
          </div>
          
          <div className="p-8 flex flex-col items-center text-center gap-2">
            <div className="flex items-center gap-2 text-yellow-500/60">
              <Star className="h-4 w-4" />
              <span className="text-[9px] font-black uppercase tracking-[0.3em] font-oswald">MVP</span>
            </div>
            <span className="text-xl font-bebas text-white uppercase truncate max-w-full">{mvpPlayer?.name || "N/A"}</span>
          </div>

          <div className="p-8 flex flex-col items-center text-center gap-2">
            <div className="flex items-center gap-2 text-orange-500/60">
              <Sparkles className="h-4 w-4" />
              <span className="text-[9px] font-black uppercase tracking-[0.3em] font-oswald">GOL DE LA FECHA</span>
            </div>
            <span className="text-xl font-bebas text-white uppercase truncate max-w-full">
              {bestGoalPlayer?.name || "N/A"}
            </span>
          </div>

          <div className="p-8 flex flex-col items-center text-center gap-2">
            <div className="flex items-center gap-2 text-accent/60">
              <Goal className="h-4 w-4" />
              <span className="text-[9px] font-black uppercase tracking-[0.3em] font-oswald">PICHICHI FECHA</span>
            </div>
            <span className="text-xl font-bebas text-white uppercase truncate max-w-full">
              {matchTopScorer ? `${matchTopScorer.name} (${matchTopScorer.goals})` : "N/A"}
            </span>
          </div>
        </div>
      </Card>

      {/* 6 & 7. ARTICLE BODY & HIGHLIGHT QUOTE */}
      {match.aiSummary && (
        <div className="max-w-[700px] mx-auto space-y-12 px-6 sm:px-0">
          <div className="prose prose-invert prose-lg">
            <p className="text-xl leading-[1.8] text-muted-foreground font-lora text-justify first-letter:text-8xl first-letter:font-black first-letter:float-left first-letter:mr-4 first-letter:mt-2 first-letter:text-primary">
              {match.aiSummary.summary}
            </p>
          </div>

          <blockquote className="border-l-8 border-primary pl-10 py-6 italic text-3xl text-white font-playfair bg-primary/5 rounded-r-2xl shadow-xl">
            "{match.aiSummary.subtitle}"
          </blockquote>
        </div>
      )}

      {/* 8. GOALS SECTION */}
      <section className="space-y-10 max-w-[750px] mx-auto pt-16 border-t border-white/5">
        <div className="flex flex-col items-center gap-2">
          <h2 className="text-[10px] font-black uppercase tracking-[0.5em] text-muted-foreground/40 font-oswald">Goles del Partido</h2>
          <div className="h-1 w-12 bg-primary/30" />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 px-6 sm:px-0">
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-primary/20 pb-3">
              <Badge className="bg-primary text-[10px] font-black tracking-widest rounded-none px-3">EQUIPO AZUL</Badge>
              <span className="font-bebas text-2xl text-primary">{match.teamAScore}</span>
            </div>
            <div className="space-y-4">
              {match.teamAPlayers.filter(p => p.goals > 0).length > 0 ? (
                match.teamAPlayers.filter(p => p.goals > 0).map(p => (
                  <div key={p.playerId} className="flex items-center justify-between group">
                    <div className="flex items-center gap-4">
                      <Goal className="h-4 w-4 text-primary opacity-30 group-hover:opacity-100 transition-all" />
                      <span className="text-sm font-bold text-white/80 uppercase tracking-tight font-oswald">
                        {allPlayers.find(pl => pl.id === p.playerId)?.name}
                      </span>
                    </div>
                    <span className="font-bebas text-2xl text-primary italic">x{p.goals}</span>
                  </div>
                ))
              ) : <p className="text-xs italic text-muted-foreground/30">No se registraron goles azules.</p>}
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-accent/20 pb-3">
              <Badge className="bg-accent text-[10px] font-black tracking-widest rounded-none px-3">EQUIPO ROJO</Badge>
              <span className="font-bebas text-2xl text-accent">{match.teamBScore}</span>
            </div>
            <div className="space-y-4">
              {match.teamBPlayers.filter(p => p.goals > 0).length > 0 ? (
                match.teamBPlayers.filter(p => p.goals > 0).map(p => (
                  <div key={p.playerId} className="flex items-center justify-between group">
                    <div className="flex items-center gap-4">
                      <Goal className="h-4 w-4 text-accent opacity-30 group-hover:opacity-100 transition-all" />
                      <span className="text-sm font-bold text-white/80 uppercase tracking-tight font-oswald">
                        {allPlayers.find(pl => pl.id === p.playerId)?.name}
                      </span>
                    </div>
                    <span className="font-bebas text-2xl text-accent italic">x{p.goals}</span>
                  </div>
                ))
              ) : <p className="text-xs italic text-muted-foreground/30">No se registraron goles rojos.</p>}
            </div>
          </div>
        </div>
      </section>

      {/* GALERÍA DE FOTOS ADICIONAL */}
      {match.photos && match.photos.length > 1 && (
        <section className="space-y-8 pt-10 border-t border-white/5">
          <div className="flex items-center gap-3 px-6 sm:px-0">
            <Camera className="h-5 w-5 text-primary/40" />
            <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground font-oswald">Más Capturas del Combate</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 px-4 sm:px-0">
            {match.photos.slice(1).map((url, idx) => (
              <div 
                key={idx} 
                className="relative aspect-square rounded-xl overflow-hidden cursor-zoom-in border border-white/5 group shadow-lg"
                onClick={() => setSelectedPhoto(url)}
              >
                <img 
                  src={url} 
                  alt={`Capture ${idx + 2}`} 
                  className="w-full h-full object-cover transition-all duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ZOOM DIALOG */}
      <Dialog open={!!selectedPhoto} onOpenChange={(open) => !open && setSelectedPhoto(null)}>
        <DialogContent className="max-w-screen-lg p-0 bg-transparent border-none shadow-none">
          <div className="relative w-full h-full flex items-center justify-center">
            {selectedPhoto && (
              <img src={selectedPhoto} className="max-w-full max-h-[90vh] object-contain shadow-[0_0_100px_rgba(0,0,0,0.8)]" alt="Zoom" />
            )}
            <button 
              className="absolute top-4 right-4 bg-black/50 hover:bg-black p-3 rounded-full text-white transition-all backdrop-blur-sm"
              onClick={() => setSelectedPhoto(null)}
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}
