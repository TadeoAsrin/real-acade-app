'use client';

import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { generateMatchSummary, type MatchSummaryOutput } from '@/ai/flows/match-summary-flow';
import { useUser } from '@/firebase';
import { Loader2, Newspaper, Quote, Trophy, Star, Award, X } from 'lucide-react';
import { es } from 'date-fns/locale';
import { format } from 'date-fns';
import { Button } from '../ui/button';
import type { Match, Player } from '@/lib/definitions';

interface MatchNewsModalProps {
  match: Match;
  allPlayers: Player[];
  forceOpen?: boolean;
  onClose?: () => void;
}

export function MatchNewsModal({ match, allPlayers, forceOpen, onClose }: MatchNewsModalProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [summary, setSummary] = React.useState<MatchSummaryOutput | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const { user } = useUser();

  React.useEffect(() => {
    if (!match) return;

    if (forceOpen) {
      setIsOpen(true);
      fetchSummary();
      return;
    }

    const lastSeenMatchId = localStorage.getItem('lastSeenGacetaId');
    if (lastSeenMatchId !== match.id) {
      setIsOpen(true);
      fetchSummary();
    }
  }, [match, forceOpen]);

  const fetchSummary = async () => {
    if (!match) return;
    setIsLoading(true);
    try {
      const allPlayerStats = [...match.teamAPlayers, ...match.teamBPlayers];
      const mvpStat = allPlayerStats.find((s) => s.isMvp);
      const bestGoalStat = allPlayerStats.find((s) => s.hasBestGoal);

      const input = {
        date: match.date,
        teamAScore: match.teamAScore,
        teamBScore: match.teamBScore,
        teamAPlayers: match.teamAPlayers.map((s) => ({ 
          name: allPlayers.find(p => p.id === s.playerId)?.name || 'Desconocido', 
          goals: s.goals 
        })),
        teamBPlayers: match.teamBPlayers.map((s) => ({ 
          name: allPlayers.find(p => p.id === s.playerId)?.name || 'Desconocido', 
          goals: s.goals 
        })),
        mvpName: mvpStat ? allPlayers.find(p => p.id === mvpStat.playerId)?.name : undefined,
        bestGoalName: bestGoalStat ? allPlayers.find(p => p.id === bestGoalStat.playerId)?.name : undefined,
      };

      const result = await generateMatchSummary(input);
      setSummary(result);
    } catch (error) {
      console.error('Error fetching summary:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    if (!forceOpen) {
      localStorage.setItem('lastSeenGacetaId', match.id);
    }
    onClose?.();
  };

  if (!isOpen || !match) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-2xl bg-[#f4f1ea] text-[#1a1a1a] border-none shadow-2xl p-0 overflow-hidden font-serif">
        <DialogHeader className="sr-only">
          <DialogTitle>La Gaceta de Real Acade</DialogTitle>
          <DialogDescription>Crónica oficial del encuentro del {format(new Date(match.date), "PPPP", { locale: es })}</DialogDescription>
        </DialogHeader>
        
        <div className="border-b-4 border-double border-black/20 p-6 text-center bg-black/5">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Newspaper className="h-6 w-6 text-black/60" />
            <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-black/60">The Real Acade Gazette</span>
          </div>
          <h2 className="text-xs font-bold border-y border-black/10 py-1.5 uppercase tracking-widest text-black/80">
            Edición Especial • {format(new Date(match.date), "PPPP", { locale: es })}
          </h2>
        </div>

        <div className="p-8 space-y-8 max-h-[70vh] overflow-y-auto">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <Loader2 className="h-12 w-12 animate-spin text-black/20" />
              <p className="italic text-sm text-black/40 animate-pulse">Imprimiendo la crónica oficial del encuentro...</p>
            </div>
          ) : summary ? (
            <>
              <h1 className="text-4xl md:text-6xl font-black leading-[0.9] tracking-tighter text-center italic text-[#1a1a1a] drop-shadow-sm px-4">
                {summary.title}
              </h1>
              
              <div className="grid grid-cols-1 md:grid-cols-12 gap-8 pt-4">
                <div className="md:col-span-8 space-y-4">
                  <div className="relative">
                    <Quote className="absolute -left-6 -top-4 h-12 w-12 text-black/5" />
                    <p className="text-xl leading-relaxed first-letter:text-6xl first-letter:font-black first-letter:float-left first-letter:mr-3 first-letter:mt-1 first-letter:text-black italic text-justify text-[#2a2a2a]">
                      {summary.summary}
                    </p>
                  </div>
                </div>

                <div className="md:col-span-4 space-y-4">
                  <div className="bg-black/5 p-5 rounded-sm border border-black/10 space-y-4 shadow-inner">
                    <h3 className="text-[10px] font-black uppercase border-b border-black/20 pb-1.5 flex items-center gap-2 text-black/60">
                      <Trophy className="h-3 w-3" /> Marcador Final
                    </h3>
                    <div className="flex items-center justify-around text-3xl font-black italic">
                      <div className="flex flex-col items-center">
                        <span className="text-primary text-[10px] uppercase not-italic mb-1">AZU</span>
                        <span>{match.teamAScore}</span>
                      </div>
                      <span className="text-black/20">-</span>
                      <div className="flex flex-col items-center">
                        <span className="text-accent text-[10px] uppercase not-italic mb-1">ROJ</span>
                        <span>{match.teamBScore}</span>
                      </div>
                    </div>
                    <div className="space-y-3 pt-2 border-t border-black/10">
                      {summary.mvpName && (
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[8px] uppercase font-black text-black/40">Héroe de la jornada</span>
                          <div className="flex items-center gap-2 text-xs font-bold italic">
                            <Star className="h-3.5 w-3.5 text-yellow-600 fill-yellow-600" />
                            <span>{summary.mvpName} (MVP)</span>
                          </div>
                        </div>
                      )}
                      {summary.bestGoalName && (
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[8px] uppercase font-black text-black/40">La joya del partido</span>
                          <div className="flex items-center gap-2 text-xs font-bold italic">
                            <Award className="h-3.5 w-3.5 text-primary fill-primary/10" />
                            <span>{summary.bestGoalName}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-10 italic text-muted-foreground">La rotativa se ha detenido. No se pudo cargar la crónica.</div>
          )}
        </div>

        <div className="bg-black/5 p-4 flex justify-center border-t border-black/10">
          <Button 
            variant="ghost" 
            onClick={handleClose} 
            className="font-black uppercase tracking-[0.3em] text-[10px] hover:bg-black/10 transition-all border border-black/10 h-10 px-8"
          >
            Volver a la realidad
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
