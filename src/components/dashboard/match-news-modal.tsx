'use client';

import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Newspaper, Quote, Trophy, Star, X } from 'lucide-react';
import { es } from 'date-fns/locale';
import { format } from 'date-fns';
import { Button } from '../ui/button';
import { Badge } from '@/components/ui/badge';
import type { Match, Player } from '@/lib/definitions';
import { cn } from '@/lib/utils';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';

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
  const isAdmin = !!adminRole?.isAdmin;

  React.useEffect(() => {
    if (!match) return;

    if (forceOpen) {
      setIsOpen(true);
      return;
    }

    const lastSeenMatchId = localStorage.getItem('lastSeenGacetaId');
    if (lastSeenMatchId !== match.id) {
      setIsOpen(true);
    }
  }, [match, forceOpen]);

  const handleClose = () => {
    setIsOpen(false);
    if (!forceOpen && match) {
      localStorage.setItem('lastSeenGacetaId', match.id);
    }
    onClose?.();
  };

  const shareToWhatsApp = () => {
    if (!match.aiSummary) return;
    const text = `🗞️ *LA GACETA DE REAL ACADE* 🗞️\n\n` +
      `🔥 *${match.aiSummary.title}*\n` +
      `📅 ${format(new Date(match.date), "dd/MM/yyyy")}\n\n` +
      `"${match.aiSummary.summary}"\n\n` +
      `🏆 *Final:* Azul ${match.teamAScore} - ${match.teamBScore} Rojo\n` +
      `🔗 Mirá las fotos y estadísticas acá: ${window.location.origin}/matches/${match.id}`;
    
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  if (!match || !match.aiSummary) return null;

  const { aiSummary } = match;
  const coverPhoto = match.photos && match.photos.length > 0 ? match.photos[0] : null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-4xl p-0 overflow-hidden border-none bg-[#fcfcf9] text-[#1a1a1a] font-serif shadow-2xl flex flex-col h-[92vh] sm:h-auto sm:max-h-[85vh] sm:rounded-xl bottom-0 sm:bottom-auto translate-y-0 sm:translate-y-[-50%] top-auto sm:top-[50%]">
        <DialogHeader className="sr-only">
          <DialogTitle>La Gaceta de Real Acade</DialogTitle>
          <DialogDescription>Crónica oficial del encuentro</DialogDescription>
        </DialogHeader>
        
        {/* Masthead - Sticky Header */}
        <div className="shrink-0 p-4 sm:p-6 border-b border-black/10 bg-[#fcfcf9] z-20">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="bg-black text-white p-1.5 rounded-sm">
                < Newspaper className="h-4 w-4 sm:h-5 sm:w-5" />
              </div>
              <span className="font-sans font-black uppercase tracking-[0.2em] sm:tracking-[0.3em] text-[9px] sm:text-xs">The Real Acade Gazette</span>
            </div>
            <div className="flex items-center gap-2 sm:gap-4 font-sans text-[8px] sm:text-[10px] font-bold uppercase text-black/40">
              <span>{format(new Date(match.date), "dd · MM · yyyy", { locale: es })}</span>
              <button 
                onClick={handleClose} 
                className="ml-2 p-2 hover:bg-black/5 rounded-full transition-colors touch-none"
                aria-label="Cerrar noticia"
              >
                <X className="h-5 w-5 text-black" />
              </button>
            </div>
          </div>
        </div>

        {/* Content Area - Scrollable */}
        <div className="flex-1 overflow-y-auto bg-[#fcfcf9] overscroll-contain">
          {/* Cover Photo */}
          {coverPhoto && (
            <div className="w-full aspect-video sm:aspect-[21/9] overflow-hidden border-b border-black/10 relative group">
              <img 
                src={coverPhoto} 
                alt="Tapa del Diario" 
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
              <div className="absolute bottom-4 left-6 flex items-center gap-2">
                <Badge className="bg-yellow-500 text-black font-black uppercase italic tracking-widest text-[8px] sm:text-[10px] border-none">
                  Foto de Tapa
                </Badge>
              </div>
            </div>
          )}

          <div className="p-6 sm:p-10 md:p-12">
            <article className="space-y-10">
              <div className="space-y-6 text-center max-w-2xl mx-auto">
                <h1 className="font-sans text-4xl sm:text-6xl md:text-7xl font-black leading-[0.9] tracking-tighter uppercase italic text-black">
                  {aiSummary.title}
                </h1>
                <p className="font-sans text-base sm:text-lg font-medium text-black/60 italic leading-tight">
                  {aiSummary.subtitle}
                </p>
                <div className="flex items-center justify-center gap-4 py-2">
                  <div className="h-[1px] flex-1 bg-black/10" />
                  <div className="flex items-center gap-2 text-[8px] font-sans font-bold uppercase tracking-widest text-black/30">
                    <Star className="h-2 w-2 fill-current" />
                    Crónica Especial
                    <Star className="h-2 w-2 fill-current" />
                  </div>
                  <div className="h-[1px] flex-1 bg-black/10" />
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                <div className="lg:col-span-8 space-y-6">
                  <div className="relative">
                    <Quote className="absolute -left-6 -top-4 h-12 w-12 text-black/[0.03] pointer-events-none" />
                    <p className="text-lg sm:text-xl leading-relaxed text-justify text-[#2a2a2a] first-letter:text-6xl first-letter:font-black first-letter:float-left first-letter:mr-2 first-letter:mt-1 first-letter:text-black first-letter:font-sans">
                      {aiSummary.summary}
                    </p>
                  </div>
                </div>

                <div className="lg:col-span-4 space-y-6">
                  <div className="bg-black/5 p-5 rounded-none border-l-2 border-black space-y-5">
                    <h3 className="font-sans text-[9px] font-black uppercase tracking-widest flex items-center justify-between border-b border-black/10 pb-2 text-black">
                      Ficha Técnica
                      <Trophy className="h-3 w-3" />
                    </h3>
                    
                    <div className="flex items-center justify-between font-sans italic">
                      <div className="text-center">
                        <p className="text-[9px] font-black text-primary uppercase not-italic mb-1">AZU</p>
                        <p className="text-3xl font-black text-black">{match.teamAScore}</p>
                      </div>
                      <div className="text-black/20 text-xl font-light">vs</div>
                      <div className="text-center">
                        <p className="text-[9px] font-black text-accent uppercase not-italic mb-1">ROJ</p>
                        <p className="text-3xl font-black text-black">{match.teamBScore}</p>
                      </div>
                    </div>

                    <div className="space-y-3 pt-3 border-t border-black/10 font-sans">
                      {match.teamAPlayers.find(p => p.isMvp) || match.teamBPlayers.find(p => p.isMvp) ? (
                        <div className="space-y-0.5">
                          <span className="text-[7px] uppercase font-black text-black/40 tracking-widest">El Protagonista</span>
                          <div className="flex items-center gap-2 text-[11px] font-black italic text-black">
                            <Star className="h-2.5 w-2.5 text-yellow-600 fill-current" />
                            <span>{allPlayers.find(p => p.id === (match.teamAPlayers.find(s => s.isMvp)?.playerId || match.teamBPlayers.find(s => s.isMvp)?.playerId))?.name} (MVP)</span>
                          </div>
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>
            </article>
          </div>
        </div>

        {/* Footer - Sticky Actions */}
        <div className="shrink-0 p-4 sm:p-6 bg-black/5 border-t border-black/10 flex flex-col sm:flex-row gap-3 z-20">
          {isAdmin && (
            <button 
              onClick={shareToWhatsApp}
              className="flex-1 font-sans font-black uppercase tracking-widest text-[10px] bg-black text-white hover:bg-black/90 rounded-none h-12 transition-colors"
            >
              Enviar a WhatsApp
            </button>
          )}
          <button 
            onClick={handleClose} 
            className={cn(
              "font-sans font-black uppercase tracking-widest text-[10px] rounded-none h-12 px-8 transition-colors",
              isAdmin ? "bg-transparent text-black border border-black/10 hover:bg-black/5" : "bg-black text-white hover:bg-black/90 flex-1"
            )}
          >
            Cerrar Edición
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
