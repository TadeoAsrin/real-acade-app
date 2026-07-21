
'use client';

import * as React from 'react';
import { useFirestore, useCollection, useMemoFirebase, useDoc } from '@/firebase';
import { collection, query, orderBy, where, doc } from 'firebase/firestore';
import type { GalleryItem, AppSettings } from '@/lib/definitions';
import { Card, CardContent } from '@/components/ui/card';
import { Image as ImageIcon, Play, Calendar, Trophy, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

export default function GalleryPage() {
  const firestore = useFirestore();

  const settingsRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, 'app_settings', 'global');
  }, [firestore]);

  const { data: settings } = useDoc<AppSettings>(settingsRef);
  const activeSeasonId = settings?.activeSeasonId;

  const galleryRef = useMemoFirebase(() => {
    if (!firestore || !activeSeasonId) return null;
    return query(
      collection(firestore, 'gallery'), 
      where('seasonId', '==', activeSeasonId),
      orderBy('date', 'desc')
    );
  }, [firestore, activeSeasonId]);

  const { data: items, isLoading } = useCollection<GalleryItem>(galleryRef);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="font-bebas text-xl tracking-widest text-muted-foreground uppercase">Revelando carrete oficial...</p>
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
          <p className="text-[10px] lg:text-xs font-black uppercase tracking-[0.3em] text-primary/60 ml-1">
            MOMENTOS DE ÉLITE • REAL ACADE
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {items?.map((item) => (
          <Card key={item.id} className="competition-card group overflow-hidden border-white/5 bg-black/40 shadow-2xl">
            <div className="relative aspect-video">
              <img src={item.url} alt={item.description} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
              {item.type === 'video' && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="bg-primary/80 p-4 rounded-full shadow-2xl">
                    <Play className="h-8 w-8 text-white fill-current" />
                  </div>
                </div>
              )}
              <div className="absolute top-4 right-4">
                 <Badge className="bg-black/60 backdrop-blur-md border-white/20 font-bold uppercase text-[8px] tracking-widest">
                   {item.type === 'video' ? 'VIDEO' : 'IMAGEN'}
                 </Badge>
              </div>
            </div>
            <CardContent className="p-4 space-y-2">
               <div className="flex items-center gap-2 text-[8px] font-black uppercase text-muted-foreground/60 tracking-widest">
                  <Calendar className="h-3 w-3" />
                  {format(parseISO(item.date), "dd MMMM yyyy", { locale: es })}
               </div>
               <p className="font-bold text-sm uppercase tracking-tight text-white/90 line-clamp-2">{item.description}</p>
            </CardContent>
          </Card>
        ))}

        {items?.length === 0 && (
          <div className="col-span-full py-20 text-center opacity-40">
            <Trophy className="h-12 w-12 mx-auto mb-4" />
            <p className="font-bebas text-xl tracking-widest uppercase text-muted-foreground">Aún no hay medios en esta temporada</p>
          </div>
        )}
      </div>
    </div>
  );
}
