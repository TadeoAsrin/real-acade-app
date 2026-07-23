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

  // DIAGNÓSTICO TEMPORAL: SeasonSelector
  console.log('DIAGNOSTICO: SeasonSelector', {
    seasonsCount: seasons.length,
    selectedSeasonId,
    loading
  });

  if (loading && !selectedSeasonId) {
    return (
      <div className={cn("flex items-center gap-2 px-4 py-2 bg-white/5 rounded-xl border border-white/10 animate-pulse", className)}>
        <Loader2 className="h-4 w-4 animate-spin text-primary" />
        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Sincronizando...</span>
      </div>
    );
  }

  // Si no hay temporadas, mostrar un aviso claro en lugar de ocultar el componente
  if (seasons.length === 0) {
    return (
      <Link href="/admin/migration" className={cn(
        "flex items-center gap-3 px-4 py-3 bg-orange-500/10 border-2 border-dashed border-orange-500/40 rounded-xl hover:bg-orange-500/20 transition-all group",
        className
      )}>
        <AlertCircle className="h-5 w-5 text-orange-500 animate-bounce" />
        <div className="flex flex-col">
          <span className="text-[10px] font-black uppercase tracking-widest text-orange-500">Temporadas no detectadas</span>
          <span className="text-[8px] font-bold text-orange-500/60 uppercase">Click para configurar el club</span>
        </div>
      </Link>
    );
  }

  return (
    <div className={cn("flex flex-col gap-1.5 relative z-50", className)}>
      <span className="text-[8px] font-black uppercase tracking-[0.2em] text-primary/80 ml-1 font-oswald">TEMPORADA SELECCIONADA</span>
      <Select value={selectedSeasonId || ""} onValueChange={setSelectedSeasonId}>
        <SelectTrigger className="h-12 bg-black/60 border-2 border-white/10 font-bebas text-xl tracking-widest hover:border-primary/40 hover:bg-primary/5 transition-all shadow-xl">
          <div className="flex items-center gap-3">
            <CalendarDays className="h-5 w-5 text-primary" />
            <SelectValue placeholder="SELECCIONAR..." />
          </div>
        </SelectTrigger>
        <SelectContent className="bg-zinc-900 border-2 border-white/10 font-bebas tracking-widest text-xl shadow-2xl">
          {seasons.map((season) => (
            <SelectItem key={season.id} value={season.id} className="focus:bg-primary/20 py-3">
              {season.name.toUpperCase()} <span className="text-muted-foreground ml-2 text-sm">({season.year})</span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
