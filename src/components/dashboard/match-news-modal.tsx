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
import { Loader2, Newspaper, Quote, Trophy, Star, Award, ChevronRight } from 'lucide-react';
import { es } from 'date-fns/locale';
import { format } from 'date-fns';
import { Button } from '../ui/button';
import type { Match, Player } from '@/lib/definitions';
import { cn } from '@/lib/utils';

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
      <DialogContent className="max-w-3xl bg-[#fcfcf9] text-[#1a1a1a] border-none shadow-[0_35px_60px_-15px_rgba(0,0,0,0.5)] p-0 overflow-hidden font-serif">
        <DialogHeader className="sr-only">
          <DialogTitle>La Gaceta de Real Acade</DialogTitle>
          <DialogDescription>Crónica oficial del encuentro del {format(new Date(match.date), "PPPP", { locale: es })}</DialogDescription>
        </DialogHeader>
        
        {/* Masthead */}
        <div className="p-6 border-b border-black/10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="bg-black text-white p-1.5 rounded-sm">
                <Newspaper className="h-5 w-5" />
              </div>
              <span className="font-sans font-black uppercase tracking-[0.3em] text-[10px] md:text-xs">The Real Acade Gazette</span>
            </div>
            <div className="flex items-center gap-4 font-sans text-[9px] font-bold uppercase text-black/40">
              <span>Edición Nº {match.id.slice(-4).toUpperCase()}</span>
              <span className="h-3 w-[1px] bg-black/10" />
              <span>{format(new Date(match.date), "dd · MM · yyyy", { locale: es })}</span>
            </div>
          </div>
        </div>

        <div className="p-8 md:p-12 overflow-y-auto max-h-[80vh]">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-32 gap-6">
              <div className="relative">
                <Loader2 className="h-16 w-12 animate-spin text-black/10" />
                <Newspaper className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-6 w-6 text-black/20" />
              </div>
              <p className="font-sans italic text-sm text-black/40 animate-pulse tracking-wide">Imprimiendo edición especial...</p>
            </div>
          ) : summary ? (
            <article className="space-y-10">
              {/* Header Section */}
              <div className="space-y-6 text-center max-w-2xl mx-auto">
                <h1 className="font-sans text-5xl md:text-7xl font-black leading-[0.85] tracking-tighter uppercase italic">
                  {summary.title}
                </h1>
                <p className="font-sans text-lg md:text-xl font-medium text-black/60 italic leading-tight">
                  {summary.subtitle}
                </p>
                <div className="flex items-center justify-center gap-4">
                  <div className="h-[1px] flex-1 bg-black/10" />
                  <div className="flex items-center gap-2 text-[10px] font-sans font-bold uppercase tracking-widest text-black/30">
                    <Star className="h-2 w-2 fill-current" />
                    Crónica Especial
                    <Star className="h-2 w-2 fill-current" />
                  </div>
                  <div className="h-[1px] flex-1 bg-black/10" />
                </div>
              </div>

              {/* Content Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                {/* Main Text */}
                <div className="lg:col-span-8">
                  <div className="relative">
                    <Quote className="absolute -left-8 -top-6 h-16 w-16 text-black/[0.03] pointer-events-none" />
                    <p className="text-xl leading-relaxed text-justify text-[#2a2a2a] first-letter:text-7xl first-letter:font-black first-letter:float-left first-letter:mr-3 first-letter:mt-2 first-letter:text-black first-letter:font-sans">
                      {summary.summary}
                    </p>
                  </div>
                </div>

                {/* technical sidebar */}
                <div className="lg:col-span-4 space-y-8">
                  <div className="bg-black/5 p-6 rounded-none border-l-4 border-black space-y-6">
                    <h3 className="font-sans text-[10px] font-black uppercase tracking-widest flex items-center justify-between border-b border-black/10 pb-2">
                      Ficha Técnica
                      <Trophy className="h-3 w-3" />
                    </h3>
                    
                    {/* Scoreboard */}
                    <div className="flex items-center justify-between font-sans italic">
                      <div className="text-center">
                        <p className="text-[10px] font-black text-primary uppercase not-italic mb-1">AZU</p>
                        <p className="text-4xl font-black">{match.teamAScore}</p>
                      </div>
                      <div className="text-black/20 text-2xl font-light">vs</div>
                      <div className="text-center">
                        <p className="text-[10px] font-black text-accent uppercase not-italic mb-1">ROJ</p>
                        <p className="text-4xl font-black">{match.teamBScore}</p>
                      </div>
                    </div>

                    {/* Honors */}
                    <div className="space-y-4 pt-4 border-t border-black/10 font-sans">
                      {summary.mvpName && (
                        <div className="space-y-1">
                          <span className="text-[8px] uppercase font-black text-black/40 tracking-widest">El Protagonista</span>
                          <div className="flex items-center gap-2 text-xs font-black italic group">
                            <div className="bg-yellow-500 p-1 rounded-full">
                              <Star className="h-2 w-2 text-white fill-current" />
                            </div>
                            <span>{summary.mvpName} (MVP)</span>
                          </div>
                        </div>
                      )}
                      {summary.bestGoalName && (
                        <div className="space-y-1">
                          <span className="text-[8px] uppercase font-black text-black/40 tracking-widest">Pintura del Día</span>
                          <div className="flex items-center gap-2 text-xs font-black italic">
                            <div className="bg-black p-1 rounded-full text-white">
                              <Award className="h-2 w-2 fill-current" />
                            </div>
                            <span>{summary.bestGoalName}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="p-4 border border-dashed border-black/10 text-center">
                    <p className="font-sans text-[9px] font-bold uppercase text-black/30 leading-tight">
                      Esta crónica ha sido redactada por la IA oficial de Real Acade basándose en las estadísticas certificadas.
                    </p>
                  </div>
                </div>
              </div>
            </article>
          ) : (
            <div className="text-center py-20 font-sans italic text-black/20">La rotativa se ha detenido inesperadamente.</div>
          )}
        </div>

        {/* Footer actions */}
        <div className="p-6 bg-black/5 border-t border-black/10 flex justify-center">
          <Button 
            variant="ghost" 
            onClick={handleClose} 
            className="font-sans font-black uppercase tracking-[0.2em] text-[10px] hover:bg-black hover:text-white transition-all rounded-none h-12 px-12 group"
          >
            Cerrar Edición
            <ChevronRight className="ml-2 h-3 w-3 transition-transform group-hover:translate-x-1" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
