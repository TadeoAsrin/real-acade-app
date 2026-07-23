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
import { CalendarDays, Loader2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface SeasonSelectorProps {
  className?: string;
}

export function SeasonSelector({ className }: SeasonSelectorProps) {
  const { seasons, selectedSeasonId, setSelectedSeasonId, loading } = useSeason();

  if (loading && !selectedSeasonId) {
    return (
      <div className={cn("flex items-center gap-2 px-3 py-2 bg-white/5 rounded-lg border border-white/10 animate-pulse", className)}>
        <Loader2 className="h-3 w-3 animate-spin text-primary" />
        <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Sincronizando...</span>
      </div>
    );
  }

  if (seasons.length === 0) {
    return (
      <Link href="/admin/migration" className={cn(
        "flex items-center gap-3 px-3 py-2.5 bg-orange-500/10 border border-dashed border-orange-500/40 rounded-lg hover:bg-orange-500/20 transition-all group",
        className
      )}>
        <AlertCircle className="h-4 w-4 text-orange-500 shrink-0" />
        <div className="flex flex-col min-w-0">
          <span className="text-[9px] font-black uppercase tracking-widest text-orange-500 truncate">Configurar Club</span>
        </div>
      </Link>
    );
  }

  /**
   * Evita mostrar "APERTURA 2026 (2026)" si el año ya está en el nombre.
   */
  const getDisplayName = (name: string, year: number) => {
    const upperName = name.toUpperCase();
    if (upperName.includes(year.toString())) return upperName;
    return `${upperName} (${year})`;
  };

  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <span className="text-[7px] font-black uppercase tracking-[0.2em] text-primary/60 ml-1 font-oswald">TEMPORADA</span>
      <Select value={selectedSeasonId || ""} onValueChange={setSelectedSeasonId}>
        <SelectTrigger className="h-10 bg-black/40 border-white/10 font-bebas text-lg tracking-widest hover:border-primary/40 hover:bg-primary/5 transition-all shadow-none rounded-lg group overflow-hidden">
          <div className="flex items-center gap-2 truncate pr-2">
            <CalendarDays className="h-4 w-4 text-primary shrink-0 group-hover:scale-110 transition-transform" />
            <SelectValue placeholder="SELECCIONAR..." />
          </div>
        </SelectTrigger>
        <SelectContent className="bg-zinc-950 border-white/10 font-bebas tracking-widest text-lg shadow-2xl">
          {seasons.map((season) => (
            <SelectItem 
              key={season.id} 
              value={season.id} 
              className="focus:bg-primary/20 py-2.5 cursor-pointer"
            >
              {getDisplayName(season.name, season.year)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
