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
      `🔗 Mirá las fotos e estadísticas acá: ${window.location.origin}/matches/${match.id}`;
    
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  if (!match || !match.aiSummary) return null;

  const { aiSummary } = match;
  const coverPhoto = match.photos && match.photos.length > 0 ? match.photos[0] : null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-4xl p-0 overflow-hidden border-none editorial-paper shadow-2xl flex flex-col h-[92vh] sm:h-auto sm:max-h-[85vh] sm:rounded-none bottom-0 sm:bottom-auto translate-y-0 sm:translate-y-[-50%] top-auto sm:top-[50%]">
        <DialogHeader className="sr-only">
          <DialogTitle>La Gaceta de Real Acade</DialogTitle>
          <DialogDescription>Crónica oficial del encuentro</DialogDescription>
        </DialogHeader>
        
        {/* Masthead - Sticky Header */}
        <div className="shrink-0 p-4 sm:p-6 border-b border-black/10 z-20">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="bg-black text-white p-1.5 rounded-none">
                <Newspaper className="h-4 w-4 sm:h-5 sm:w-5" />
              </div>
              <span className="font-bebas font-black uppercase tracking-[0.3em] text-[10px] sm:text-sm text-black">THE ACADEMY GAZETTE</span>
            </div>
            <div className="flex items-center gap-2 sm:gap-4 font-oswald text-[8px] sm:text-[10px] font-bold uppercase text-black/40">
              <span>{format(new Date(match.date), "eeee, dd MMMM yyyy", { locale: es })}</span>
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
        <div className="flex-1 overflow-y-auto overscroll-contain">
          {/* Cover Photo */}
          {coverPhoto && (
            <div className="w-full aspect-video sm:aspect-[21/9] overflow-hidden border-b-4 border-black relative group">
              <img 
                src={coverPhoto} 
                alt="Tapa del Diario" 
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <div className="absolute bottom-4 left-6 flex items-center gap-2">
                <Badge className="bg-accent text-white font-bebas uppercase tracking-widest text-[8px] sm:text-[10px] border-none rounded-none px-3">
                  EXCLUSIVE FOOTAGE
                </Badge>
              </div>
            </div>
          )}

          <div className="p-6 sm:p-10 md:p-12">
            <article className="space-y-10">
              <div className="space-y-6 text-center max-w-2xl mx-auto">
                <h1 className="editorial-title text-4xl sm:text-6xl md:text-7xl font-black leading-[0.9] tracking-tighter uppercase italic">
                  {aiSummary.title}
                </h1>
                <div className="editorial-divider" />
                <p className="font-lora text-lg sm:text-xl font-medium text-black/60 italic leading-tight">
                  {aiSummary.subtitle}
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                <div className="lg:col-span-8 space-y-6 border-r border-black/5 pr-4">
                  <div className="relative">
                    <Quote className="absolute -left-6 -top-4 h-12 w-12 text-black/[0.03] pointer-events-none" />
                    <p className="text-lg sm:text-xl leading-relaxed text-justify text-[#1a1a1a] first-letter:text-7xl first-letter:font-black first-letter:float-left first-letter:mr-3 first-letter:mt-2 first-letter:text-black first-letter:font-playfair">
                      {aiSummary.summary}
                    </p>
                  </div>
                </div>

                <div className="lg:col-span-4 space-y-6">
                  <div className="bg-black/5 p-5 rounded-none border-t-2 border-black space-y-5">
                    <h3 className="font-bebas text-xs font-black uppercase tracking-widest flex items-center justify-between border-b border-black/10 pb-2 text-black">
                      MATCH REPORT
                      <Trophy className="h-3 w-3" />
                    </h3>
                    
                    <div className="flex items-center justify-between font-bebas italic">
                      <div className="text-center">
                        <p className="text-[10px] font-black text-black/40 uppercase not-italic mb-1">AZU</p>
                        <p className="text-4xl font-black text-black">{match.teamAScore}</p>
                      </div>
                      <div className="text-black/20 text-2xl font-light">vs</div>
                      <div className="text-center">
                        <p className="text-[10px] font-black text-black/40 uppercase not-italic mb-1">ROJ</p>
                        <p className="text-4xl font-black text-black">{match.teamBScore}</p>
                      </div>
                    </div>

                    <div className="space-y-3 pt-3 border-t border-black/10 font-oswald">
                      {match.teamAPlayers.find(p => p.isMvp) || match.teamBPlayers.find(p => p.isMvp) ? (
                        <div className="space-y-0.5">
                          <span className="text-[8px] uppercase font-black text-black/40 tracking-widest">PLAYER OF THE MATCH</span>
                          <div className="flex items-center gap-2 text-[12px] font-black italic text-black uppercase">
                            <Star className="h-3 w-3 text-accent fill-current" />
                            <span>{allPlayers.find(p => p.id === (match.teamAPlayers.find(s => s.isMvp)?.playerId || match.teamBPlayers.find(s => s.isMvp)?.playerId))?.name}</span>
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
              className="flex-1 font-bebas font-black uppercase tracking-[0.2em] text-xs bg-black text-white hover:bg-black/90 rounded-none h-12 transition-colors"
            >
              BROADCAST TO WHATSAPP
            </button>
          )}
          <button 
            onClick={handleClose} 
            className={cn(
              "font-bebas font-black uppercase tracking-[0.2em] text-xs rounded-none h-12 px-8 transition-colors",
              isAdmin ? "bg-transparent text-black border border-black/10 hover:bg-black/5" : "bg-black text-white hover:bg-black/90 flex-1"
            )}
          >
            DISMISS
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
