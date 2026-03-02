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
    if (lastSeenMatchId !== match.id) setIsOpen(true);
  }, [match, forceOpen]);

  const handleClose = () => {
    setIsOpen(false);
    if (!forceOpen && match) localStorage.setItem('lastSeenGacetaId', match.id);
    onClose?.();
  };

  if (!match || !match.aiSummary) return null;

  const { aiSummary } = match;
  const coverPhoto = match.photos && match.photos.length > 0 ? match.photos[0] : null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-4xl p-0 overflow-hidden border-none editorial-paper shadow-2xl flex flex-col h-[92vh] sm:h-auto sm:max-h-[85vh] bottom-0 sm:bottom-auto translate-y-0 sm:translate-y-[-50%] top-auto sm:top-[50%] bg-white text-black">
        <DialogHeader className="sr-only">
          <DialogTitle>La Gaceta de Real Acade</DialogTitle>
          <DialogDescription>Crónica oficial del encuentro</DialogDescription>
        </DialogHeader>
        
        <div className="shrink-0 p-4 sm:p-6 bg-black z-20">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="bg-white text-black p-1.5 rounded-none">
                <Newspaper className="h-4 w-4 sm:h-5 sm:w-5" />
              </div>
              <span className="font-bebas font-black uppercase tracking-[0.3em] text-[10px] sm:text-sm text-white">THE ACADEMY GAZETTE</span>
            </div>
            <div className="flex items-center gap-2 sm:gap-4 font-oswald text-[8px] sm:text-[10px] font-bold uppercase text-white/60">
              <span className="text-primary font-black">SPECIAL EDITION</span>
              <span>{format(new Date(match.date), "eeee, dd MMMM yyyy", { locale: es })}</span>
              <button onClick={handleClose} className="ml-2 p-2 hover:bg-white/10 rounded-full transition-colors text-white"><X className="h-5 w-5" /></button>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto overscroll-contain bg-white">
          {coverPhoto && (
            <div className="w-full aspect-video sm:aspect-[21/9] overflow-hidden border-b-4 border-black relative">
              <img src={coverPhoto} alt="Tapa" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            </div>
          )}

          <div className="p-6 sm:p-10 md:p-12 bg-white">
            <article className="space-y-10">
              <div className="space-y-6 text-center max-w-2xl mx-auto">
                <h1 className="editorial-title text-4xl sm:text-6xl md:text-7xl font-black leading-[0.9] tracking-tighter uppercase italic text-black">
                  {aiSummary.title}
                </h1>
                <div className="editorial-divider" />
                <p className="font-lora text-xl sm:text-2xl font-bold text-black italic leading-tight">
                  {aiSummary.subtitle}
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                <div className="lg:col-span-8 space-y-6 lg:border-r lg:border-black/10 lg:pr-10">
                  <div className="relative">
                    <Quote className="absolute -left-8 -top-6 h-16 w-16 text-black/[0.05] pointer-events-none" />
                    <p className="text-xl sm:text-2xl leading-relaxed text-justify text-black font-lora first-letter:text-8xl first-letter:font-black first-letter:float-left first-letter:mr-4 first-letter:mt-3 first-letter:text-black">
                      {aiSummary.summary}
                    </p>
                  </div>
                </div>

                <div className="lg:col-span-4 space-y-6">
                  <div className="bg-black/5 p-6 rounded-none border-t-4 border-black space-y-6">
                    <h3 className="font-bebas text-sm font-black uppercase tracking-widest flex items-center justify-between border-b border-black/10 pb-3 text-black">
                      OFFICIAL REPORT <Trophy className="h-4 w-4 text-accent" />
                    </h3>
                    <div className="flex items-center justify-between font-bebas italic">
                      <div className="text-center">
                        <p className="text-[10px] font-black text-primary uppercase mb-1 tracking-widest">AZUL</p>
                        <p className="text-5xl font-black text-black">{match.teamAScore}</p>
                      </div>
                      <div className="text-black/20 text-3xl font-light">vs</div>
                      <div className="text-center">
                        <p className="text-[10px] font-black text-accent uppercase mb-1 tracking-widest">ROJO</p>
                        <p className="text-5xl font-black text-black">{match.teamBScore}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </article>
          </div>
        </div>

        <div className="shrink-0 p-4 sm:p-6 bg-white border-t border-black/10 flex flex-col sm:flex-row gap-3 z-20">
          <button onClick={handleClose} className="bg-black text-white hover:bg-black/90 font-bebas font-black uppercase tracking-[0.2em] text-sm rounded-none h-14 w-full transition-colors">
            CLOSE GAZETTE
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}