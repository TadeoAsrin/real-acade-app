'use client';

import * as React from 'react';
import { useSeason } from '@/context/season-context';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CalendarDays, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SeasonSelectorProps {
  className?: string;
}

export function SeasonSelector({ className }: SeasonSelectorProps) {
  const { seasons, selectedSeasonId, setSelectedSeasonId, loading } = useSeason();

  if (loading && !selectedSeasonId) {
    return (
      <div className={cn("flex items-center gap-2 px-3 py-2 bg-white/5 rounded-lg border border-white/10 animate-pulse", className)}>
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Cargando Temporada...</span>
      </div>
    );
  }

  if (seasons.length === 0) return null;

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <span className="text-[8px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 ml-1">Temporada Seleccionada</span>
      <Select value={selectedSeasonId || ""} onValueChange={setSelectedSeasonId}>
        <SelectTrigger className="h-10 bg-black/40 border-white/10 font-bebas text-lg tracking-widest hover:bg-white/5 transition-colors">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-primary" />
            <SelectValue placeholder="Seleccionar Temporada" />
          </div>
        </SelectTrigger>
        <SelectContent className="bg-zinc-900 border-white/10 font-bebas tracking-widest text-lg">
          {seasons.map((season) => (
            <SelectItem key={season.id} value={season.id} className="focus:bg-primary/20">
              {season.name.toUpperCase()} ({season.year})
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
