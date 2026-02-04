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
import { Loader2, Newspaper, Quote, Trophy, Star, Award, ChevronRight, AlertCircle, RefreshCcw, X } from 'lucide-react';
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
  const [error, setError] = React.useState<string | null>(null);

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
    setError(null);
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
      
      if ('error' in result) {
        if (result.error === 'QUOTA_EXCEEDED') {
          setError('La IA está descansando (límite alcanzado). Reintenta en un momento.');
        } else {
          setError('No pudimos conectar con la rotativa en este momento.');
        }
      } else {
        setSummary(result);
      }
    } catch (err: any) {
      setError('Error inesperado al generar la crónica.');
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

  const shareToWhatsApp = () => {
    if (!summary) return;
    const text = `🗞️ *LA GACETA DE REAL ACADE* 🗞️\n\n` +
      `🔥 *${summary.title}*\n` +
      `📅 ${format(new Date(match.date), "dd/MM/yyyy")}\n\n` +
      `"${summary.summary}"\n\n` +
      `🏆 *Final:* Azul ${match.teamAScore} - ${match.teamBScore} Rojo\n` +
      `${summary.mvpName ? `🌟 *MVP:* ${summary.mvpName}\n` : ''}` +
      `🔗 Mirá las fotos y estadísticas acá: ${window.location.origin}/matches/${match.id}`;
    
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  if (!isOpen || !match) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className={cn(
        "max-w-3xl bg-[#fcfcf9] text-[#1a1a1a] border-none p-0 overflow-hidden font-serif",
        "fixed bottom-0 top-auto translate-y-0 sm:relative sm:bottom-auto sm:top-1/2 sm:-translate-y-1/2 rounded-t-3xl sm:rounded-2xl",
        "h-[85vh] sm:h-auto max-h-[90vh]"
      )}>
        <DialogHeader className="sr-only">
          <DialogTitle>La Gaceta de Real Acade</DialogTitle>
          <DialogDescription>Crónica oficial del encuentro</DialogDescription>
        </DialogHeader>
        
        {/* Masthead */}
        <div className="p-4 sm:p-6 border-b border-black/10">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="bg-black text-white p-1.5 rounded-sm">
                <Newspaper className="h-4 w-4 sm:h-5 sm:w-5" />
              </div>
              <span className="font-sans font-black uppercase tracking-[0.2em] sm:tracking-[0.3em] text-[9px] sm:text-xs">The Real Acade Gazette</span>
            </div>
            <div className="flex items-center gap-2 sm:gap-4 font-sans text-[8px] sm:text-[10px] font-bold uppercase text-black/40">
              <span className="hidden xs:inline">Edición Nº {match.id.slice(-4).toUpperCase()}</span>
              <span className="h-3 w-[1px] bg-black/10 hidden xs:inline" />
              <span>{format(new Date(match.date), "dd · MM · yyyy", { locale: es })}</span>
              <button onClick={handleClose} className="ml-2 p-1 hover:bg-black/5 rounded-full transition-colors">
                <X className="h-4 w-4 text-black" />
              </button>
            </div>
          </div>
        </div>

        <div className="p-6 sm:p-10 md:p-12 overflow-y-auto max-h-[calc(85vh-8rem)] sm:max-h-[70vh]">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-24 gap-6">
              <div className="relative">
                <Loader2 className="h-12 w-12 animate-spin text-black/10" />
                <Newspaper className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-5 w-5 text-black/20" />
              </div>
              <p className="font-sans italic text-xs text-black/40 animate-pulse tracking-wide">Imprimiendo edición especial...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-20 text-center space-y-6">
              <AlertCircle className="h-12 w-12 text-orange-600 opacity-20" />
              <p className="font-sans text-xs text-black/60 max-w-xs">{error}</p>
              <Button onClick={fetchSummary} variant="outline" className="font-sans uppercase font-bold tracking-widest text-[10px] rounded-none border-black/20">
                <RefreshCcw className="mr-2 h-3 w-3" /> Reintentar
              </Button>
            </div>
          ) : summary ? (
            <article className="space-y-10">
              <div className="space-y-6 text-center max-w-2xl mx-auto">
                <h1 className="font-sans text-4xl sm:text-6xl md:text-7xl font-black leading-[0.9] tracking-tighter uppercase italic">
                  {summary.title}
                </h1>
                <p className="font-sans text-base sm:text-lg font-medium text-black/60 italic leading-tight">
                  {summary.subtitle}
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
                      {summary.summary}
                    </p>
                  </div>
                </div>

                <div className="lg:col-span-4 space-y-6">
                  <div className="bg-black/5 p-5 rounded-none border-l-2 border-black space-y-5">
                    <h3 className="font-sans text-[9px] font-black uppercase tracking-widest flex items-center justify-between border-b border-black/10 pb-2">
                      Ficha Técnica
                      <Trophy className="h-3 w-3" />
                    </h3>
                    
                    <div className="flex items-center justify-between font-sans italic">
                      <div className="text-center">
                        <p className="text-[9px] font-black text-primary uppercase not-italic mb-1">AZU</p>
                        <p className="text-3xl font-black">{match.teamAScore}</p>
                      </div>
                      <div className="text-black/20 text-xl font-light">vs</div>
                      <div className="text-center">
                        <p className="text-[9px] font-black text-accent uppercase not-italic mb-1">ROJ</p>
                        <p className="text-3xl font-black">{match.teamBScore}</p>
                      </div>
                    </div>

                    <div className="space-y-3 pt-3 border-t border-black/10 font-sans">
                      {summary.mvpName && (
                        <div className="space-y-0.5">
                          <span className="text-[7px] uppercase font-black text-black/40 tracking-widest">El Protagonista</span>
                          <div className="flex items-center gap-2 text-[11px] font-black italic">
                            <Star className="h-2.5 w-2.5 text-yellow-600 fill-current" />
                            <span>{summary.mvpName} (MVP)</span>
                          </div>
                        </div>
                      )}
                      {summary.bestGoalName && (
                        <div className="space-y-0.5">
                          <span className="text-[7px] uppercase font-black text-black/40 tracking-widest">Pintura del Día</span>
                          <div className="flex items-center gap-2 text-[11px] font-black italic">
                            <Award className="h-2.5 w-2.5" />
                            <span>{summary.bestGoalName}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </article>
          ) : null}
        </div>

        <div className="p-4 sm:p-6 bg-black/5 border-t border-black/10 flex flex-col sm:flex-row gap-3">
          <Button 
            onClick={shareToWhatsApp}
            className="flex-1 font-sans font-black uppercase tracking-widest text-[10px] bg-black text-white hover:bg-black/90 rounded-none h-12"
          >
            Enviar a WhatsApp
          </Button>
          <Button 
            variant="ghost" 
            onClick={handleClose} 
            className="font-sans font-black uppercase tracking-widest text-[10px] hover:bg-black/5 rounded-none h-12 px-8"
          >
            Cerrar Edición
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
