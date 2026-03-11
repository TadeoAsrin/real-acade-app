'use client';

import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Newspaper, Trophy, X, Quote, Calendar, Star, Goal, ChevronRight } from 'lucide-react';
import { es } from 'date-fns/locale';
import { format, parseISO } from 'date-fns';
import type { Match, Player } from '@/lib/definitions';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface MatchNewsModalProps {
  match: Match;
  allPlayers: Player[];
  forceOpen?: boolean;
  onClose?: () => void;
}

export function MatchNewsModal({ match, allPlayers, forceOpen, onClose }: MatchNewsModalProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const { user } = useUser();
  const firestore = useFirestore();

  const adminRoleRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'roles_admin', user.uid);
  }, [firestore, user]);

  const { data: adminRole } = useDoc<{isAdmin: boolean}>(adminRoleRef);

  React.useEffect(() => {
    if (!match) return;
    if (forceOpen) {
      setIsOpen(true);
      return;
    }
    const lastSeenMatchId = localStorage.getItem('lastSeenGacetaId');
    if (lastSeenMatchId !== match.id) setIsOpen(true);
  }, [match, forceOpen]);

  const handleClose = () => {
    setIsOpen(false);
    if (!forceOpen && match) localStorage.setItem('lastSeenGacetaId', match.id);
    onClose?.();
  };

  if (!match || !match.aiSummary) return null;

  const { aiSummary } = match;
  const date = parseISO(match.date);
  const coverPhoto = match.photos && match.photos.length > 0 ? match.photos[0] : "https://picsum.photos/seed/match/800/400";
  
  const allStats = [...match.teamAPlayers, ...match.teamBPlayers];
  const mvp = allPlayers.find(p => p.id === allStats.find(s => s.isMvp)?.playerId);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-4xl p-0 overflow-hidden border-none shadow-2xl flex flex-col h-[92vh] sm:h-auto sm:max-h-[90vh] bottom-0 sm:bottom-auto translate-y-0 sm:translate-y-[-50%] top-auto sm:top-[50%] bg-[#f4f4f4] text-black">
        <DialogHeader className="sr-only">
          <DialogTitle>La Gaceta de Real Acade</DialogTitle>
          <DialogDescription>Crónica oficial del encuentro</DialogDescription>
        </DialogHeader>
        
        {/* Newspaper Header */}
        <div className="shrink-0 p-4 border-b-4 border-black bg-white z-20 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-black text-white p-1.5">
                <Newspaper className="h-5 w-5" />
              </div>
              <span className="font-bebas font-black uppercase tracking-[0.3em] text-sm text-black">THE ACADEMY GAZETTE</span>
            </div>
            <div className="flex items-center gap-4 text-[10px] font-black uppercase text-black/40 font-oswald">
              <span>EDICIÓN ESPECIAL</span>
              <span className="hidden sm:inline">•</span>
              <span>{format(date, "eeee, dd MMMM yyyy", { locale: es })}</span>
              <button onClick={handleClose} className="p-1 hover:bg-black/5 rounded-full transition-colors"><X className="h-4 w-4" /></button>
            </div>
          </div>
          
          <div className="flex items-center justify-center gap-8 py-2 border-y border-black/5">
            <div className="flex flex-col items-center">
              <span className="text-5xl font-bebas text-primary leading-none">{match.teamAScore}</span>
              <span className="text-[8px] font-black text-primary uppercase">AZUL</span>
            </div>
            <div className="text-xl font-light text-black/20 italic">—</div>
            <div className="flex flex-col items-center">
              <span className="text-5xl font-bebas text-black leading-none">{match.teamBScore}</span>
              <span className="text-[8px] font-black text-accent uppercase">ROJO</span>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto overscroll-contain bg-[#fdfdfd]">
          {/* Headline Section */}
          <div className="p-6 sm:p-10 space-y-8 max-w-2xl mx-auto text-center">
            <h1 className="text-4xl sm:text-6xl font-black font-playfair leading-[0.95] tracking-tight uppercase italic text-black">
              {aiSummary.title}
            </h1>
            <p className="font-lora text-xl text-black/70 italic border-y border-black/10 py-4">
              {aiSummary.subtitle}
            </p>
          </div>

          {/* Hero Image with Overlay */}
          <div className="px-6 sm:px-10">
            <div className="relative aspect-video rounded-xl overflow-hidden border border-black/10">
              <img src={coverPhoto} alt="Cover" className="w-full h-full object-cover" />
              <div className="absolute top-4 left-4 bg-black text-white px-3 py-1 text-[10px] font-black uppercase tracking-widest font-oswald">
                FINAL: {match.teamAScore} - {match.teamBScore}
              </div>
            </div>
          </div>

          {/* Facts Bar */}
          <div className="px-6 sm:px-10 mt-8">
            <div className="bg-white border border-black/10 p-4 grid grid-cols-2 sm:grid-cols-4 gap-4 divide-x divide-black/5 text-center">
              <div className="flex flex-col gap-1">
                <span className="text-[8px] font-black text-black/40 uppercase">MVP</span>
                <span className="text-xs font-bold truncate uppercase">{mvp?.name || "N/A"}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[8px] font-black text-black/40 uppercase">FECHA</span>
                <span className="text-xs font-bold uppercase">{format(date, "dd/MM/yy")}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[8px] font-black text-black/40 uppercase">GOLES</span>
                <span className="text-xs font-bold uppercase">{match.teamAScore + match.teamBScore} TOTAL</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[8px] font-black text-black/40 uppercase">ESTADO</span>
                <span className="text-xs font-bold text-emerald-600 uppercase">FINALIZADO</span>
              </div>
            </div>
          </div>

          {/* Body Text */}
          <div className="p-6 sm:p-10 max-w-2xl mx-auto">
            <article className="prose prose-sm prose-neutral">
              <p className="text-lg leading-relaxed text-justify text-black/80 font-lora first-letter:text-7xl first-letter:font-black first-letter:float-left first-letter:mr-3 first-letter:mt-2 first-letter:text-black">
                {aiSummary.summary}
              </p>
            </article>
            
            <blockquote className="mt-10 border-l-4 border-black pl-6 italic text-xl text-black font-lora">
              "{aiSummary.subtitle}"
            </blockquote>
          </div>

          {/* Goals Summary */}
          <div className="px-6 sm:px-10 pb-10 max-w-2xl mx-auto space-y-6">
            <div className="h-[1px] bg-black/10 w-full" />
            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-center text-black/40">MARCADORES DE ÉLITE</h3>
            <div className="grid grid-cols-2 gap-10">
              <div className="space-y-2">
                <Badge className="bg-primary text-[8px] rounded-none">AZUL</Badge>
                {match.teamAPlayers.filter(p => p.goals > 0).map(p => (
                  <div key={p.playerId} className="flex items-center justify-between text-[10px] font-bold">
                    <span className="uppercase">{allPlayers.find(pl => pl.id === p.playerId)?.name}</span>
                    <span className="font-bebas text-sm">x{p.goals}</span>
                  </div>
                ))}
              </div>
              <div className="space-y-2">
                <Badge className="bg-accent text-[8px] rounded-none">ROJO</Badge>
                {match.teamBPlayers.filter(p => p.goals > 0).map(p => (
                  <div key={p.playerId} className="flex items-center justify-between text-[10px] font-bold">
                    <span className="uppercase">{allPlayers.find(pl => pl.id === p.playerId)?.name}</span>
                    <span className="font-bebas text-sm">x{p.goals}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="shrink-0 p-4 bg-white border-t border-black/10 flex flex-col sm:flex-row gap-3 z-20">
          <Button asChild className="bg-black text-white hover:bg-black/90 font-bebas font-black uppercase tracking-widest text-sm rounded-none h-14 w-full">
            <Link href={`/matches/${match.id}`}>VER FICHA COMPLETA <ChevronRight className="ml-2 h-4 w-4" /></Link>
          </Button>
          <button onClick={handleClose} className="border border-black/10 text-black/40 hover:bg-black/5 font-bebas font-black uppercase tracking-widest text-sm rounded-none h-14 w-full sm:w-1/3 transition-colors">
            CERRAR
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}