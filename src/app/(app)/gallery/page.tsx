'use client';

import * as React from 'react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import type { GalleryItem, Match } from '@/lib/definitions';
import { Card, CardContent } from '@/components/ui/card';
import { Image as ImageIcon, Play, Calendar, Trophy, Loader2, ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { useSeason } from '@/context/season-context';
import Link from 'next/link';

/**
 * Galería de Élite: Fusiona elementos de la colección 'gallery' con las fotos
 * adjuntas en cada partido ('matches') de la temporada seleccionada.
 */
export default function GalleryPage() {
  const firestore = useFirestore();
  const { selectedSeasonId, loading: seasonLoading } = useSeason();

  // 1. Obtener elementos explícitos de la galería
  const galleryRef = useMemoFirebase(() => {
    if (!firestore || !selectedSeasonId) return null;
    return query(
      collection(firestore, 'gallery'), 
      where('seasonId', '==', selectedSeasonId)
    );
  }, [firestore, selectedSeasonId]);

  // 2. Obtener partidos para extraer sus fotos
  const matchesRef = useMemoFirebase(() => {
    if (!firestore || !selectedSeasonId) return null;
    return query(
      collection(firestore, 'matches'),
      where('seasonId', '==', selectedSeasonId)
    );
  }, [firestore, selectedSeasonId]);

  const { data: galleryData, isLoading: galleryLoading } = useCollection<GalleryItem>(galleryRef);
  const { data: matchesData, isLoading: matchesLoading } = useCollection<Match>(matchesRef);

  // Fusión y procesamiento de medios
  const items = React.useMemo(() => {
    const combined: GalleryItem[] = [];
    
    // Añadir ítems directos de galería
    if (galleryData) {
      combined.push(...galleryData);
    }
    
    // Extraer fotos de los partidos de la temporada
    if (matchesData) {
      matchesData.forEach(match => {
        if (match.photos && match.photos.length > 0) {
          match.photos.forEach((photoUrl, idx) => {
            combined.push({
              id: `${match.id}_img_${idx}`,
              seasonId: match.seasonId,
              type: 'image',
              url: photoUrl,
              description: match.aiSummary?.title || `Momento del partido del ${format(parseISO(match.date), 'dd/MM')}`,
              date: match.date,
              matchId: match.id
            } as GalleryItem);
          });
        }
      });
    }

    // Ordenar por fecha descendente (lo más nuevo arriba)
    return combined.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [galleryData, matchesData]);

  if (galleryLoading || matchesLoading || seasonLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="font-bebas text-xl tracking-widest text-muted-foreground uppercase">Escaneando carrete oficial...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-4 lg:p-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <h2 className="text-4xl lg:text-7xl font-black uppercase tracking-tighter italic text-white flex items-center gap-4">
            <ImageIcon className="h-8 w-8 lg:h-14 lg:w-14 text-primary shrink-0" />
            GALERÍA DEL CLUB
          </h2>
          <p className="text-[10px] lg:text-xs font-black uppercase tracking-[0.4em] text-primary/60 ml-1">
            MOMENTOS DE ÉLITE • REAL ACADE
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map((item) => (
          <Card key={item.id} className="competition-card group overflow-hidden border-white/5 bg-black/40 shadow-2xl">
            <div className="relative aspect-video">
              <img 
                src={item.url} 
                alt={item.description || "Foto de Real Acade"} 
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
              />
              {item.type === 'video' && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="bg-primary/80 p-4 rounded-full shadow-2xl">
                    <Play className="h-8 w-8 text-white fill-current" />
                  </div>
                </div>
              )}
              <div className="absolute top-4 right-4 flex gap-2">
                 {item.matchId && (
                   <Badge className="bg-primary/60 backdrop-blur-md border-white/20 font-bold uppercase text-[7px] tracking-widest shadow-lg">
                     PARTIDO
                   </Badge>
                 )}
                 <Badge className="bg-black/60 backdrop-blur-md border-white/20 font-bold uppercase text-[7px] tracking-widest shadow-lg">
                   {item.type === 'video' ? 'VIDEO' : 'IMAGEN'}
                 </Badge>
              </div>
            </div>
            <CardContent className="p-4 space-y-3">
               <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-[8px] font-black uppercase text-muted-foreground/60 tracking-widest">
                     <Calendar className="h-3 w-3 text-primary" />
                     {format(parseISO(item.date), "dd MMMM yyyy", { locale: es })}
                  </div>
               </div>
               
               <div className="space-y-3">
                  <p className="font-bold text-sm uppercase tracking-tight text-white/90 line-clamp-2 leading-tight">
                    {item.description}
                  </p>
                  
                  {item.matchId && (
                    <Link 
                      href={`/matches/${item.matchId}`} 
                      className="inline-flex items-center gap-1.5 text-[9px] font-black uppercase tracking-[0.2em] text-primary hover:text-white transition-colors pt-2 border-t border-white/5 w-full"
                    >
                      VER CRÓNICA COMPLETA <ChevronRight className="h-3 w-3" />
                    </Link>
                  )}
               </div>
            </CardContent>
          </Card>
        ))}

        {items.length === 0 && (
          <div className="col-span-full py-20 text-center opacity-40">
            <Trophy className="h-12 w-12 mx-auto mb-4" />
            <p className="font-bebas text-xl tracking-widest uppercase text-muted-foreground">Aún no hay medios en esta temporada</p>
          </div>
        )}
      </div>
    </div>
  );
}
