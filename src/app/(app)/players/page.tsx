'use client';

import * as React from 'react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import type { Player } from '@/lib/definitions';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Users, Search, ChevronRight, Star } from 'lucide-react';
import Link from 'next/link';
import { getInitials } from '@/lib/utils';

export default function PlayersPage() {
  const firestore = useFirestore();
  const [searchTerm, setSearchTerm] = React.useState('');

  const playersRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'players'), orderBy('name', 'asc'));
  }, [firestore]);

  const { data: players } = useCollection<Player>(playersRef);

  const filteredPlayers = players?.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 p-4 lg:p-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <h2 className="text-4xl lg:text-7xl font-black uppercase tracking-tighter italic text-white flex items-center gap-4">
            <Users className="h-8 w-8 lg:h-14 lg:w-14 text-primary shrink-0" />
            PLANTILLA ÉLITE
          </h2>
          <p className="text-[10px] lg:text-xs font-black uppercase tracking-[0.3em] text-primary/60 ml-1">
            ESTADÍSTICAS OFICIALES • MIEMBROS DEL CLUB
          </p>
        </div>
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="BUSCAR LEYENDA..." 
            className="pl-10 h-12 bg-black/40 border-white/10 font-bold tracking-widest uppercase"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {filteredPlayers?.map((player) => (
          <Link key={player.id} href={`/players/${player.id}`}>
            <Card className="competition-card official-table-row hover-lift h-full flex flex-col items-center p-6 text-center group">
               <div className="relative mb-4">
                  <Avatar className="h-20 w-20 md:h-24 md:w-24 border-2 border-white/5 transition-transform duration-500 group-hover:scale-110">
                    <AvatarImage src={player.avatar} alt={player.name} />
                    <AvatarFallback className="bg-surface-900 text-xl font-bebas text-primary">
                      {getInitials(player.name)}
                    </AvatarFallback>
                  </Avatar>
                  {player.role === 'admin' && (
                    <div className="absolute -top-1 -right-1 bg-primary text-white p-1 rounded-full shadow-lg">
                      <Star className="h-3 w-3 fill-current" />
                    </div>
                  )}
               </div>
               <h3 className="font-bold text-sm lg:text-base uppercase tracking-tighter text-white truncate w-full group-hover:text-primary transition-colors">
                 {player.name}
               </h3>
               <p className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/40 mt-1 mb-4">
                 {player.position || 'COMODÍN'}
               </p>
               <div className="mt-auto w-full pt-4 border-t border-white/5 flex items-center justify-between text-[10px] font-black uppercase text-muted-foreground/20 group-hover:text-primary/40">
                  <span>VER PERFIL</span>
                  <ChevronRight className="h-3 w-3" />
               </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
