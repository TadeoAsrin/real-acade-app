'use client';

import * as React from 'react';
import { useFirestore, useCollection, useDoc, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, doc } from 'firebase/firestore';
import type { Season, AppSettings } from '@/lib/definitions';

interface SeasonContextType {
  seasons: Season[];
  activeSeasonId: string | null;
  selectedSeasonId: string | null;
  selectedSeason: Season | null;
  activeSeason: Season | null;
  setSelectedSeasonId: (id: string) => void;
  loading: boolean;
}

const SeasonContext = React.createContext<SeasonContextType | undefined>(undefined);

export function SeasonProvider({ children }: { children: React.ReactNode }) {
  const firestore = useFirestore();
  const [selectedSeasonId, setSelectedSeasonId] = React.useState<string | null>(null);

  // 1. Cargar configuración global (activeSeasonId)
  const settingsRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, 'app_settings', 'global');
  }, [firestore]);
  const { data: settings, isLoading: settingsLoading } = useDoc<AppSettings>(settingsRef);

  // 2. Cargar todas las temporadas
  const seasonsRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'seasons'), orderBy('year', 'desc'), orderBy('half', 'desc'));
  }, [firestore]);
  const { data: seasons, isLoading: seasonsLoading } = useCollection<Season>(seasonsRef);

  const activeSeasonId = settings?.activeSeasonId || null;

  // 3. Inicializar selectedSeasonId con activeSeasonId la primera vez
  React.useEffect(() => {
    if (activeSeasonId && !selectedSeasonId) {
      setSelectedSeasonId(activeSeasonId);
    }
  }, [activeSeasonId, selectedSeasonId]);

  const contextSeasons = seasons || [];
  const activeSeason = contextSeasons.find(s => s.id === activeSeasonId) || null;
  const selectedSeason = contextSeasons.find(s => s.id === selectedSeasonId) || null;

  const value = {
    seasons: contextSeasons,
    activeSeasonId,
    selectedSeasonId,
    selectedSeason,
    activeSeason,
    setSelectedSeasonId,
    loading: settingsLoading || seasonsLoading,
  };

  return (
    <SeasonContext.Provider value={value}>
      {children}
    </SeasonContext.Provider>
  );
}

export function useSeason() {
  const context = React.useContext(SeasonContext);
  if (context === undefined) {
    throw new Error('useSeason must be used within a SeasonProvider');
  }
  return context;
}
