'use client';

import * as React from 'react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import type { Player } from '@/lib/definitions';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Users, Search, ChevronRight, Star, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { getInitials } from '@/lib/utils';

function PlayerAvatar({ player, size = 'md' }: { player: Player; size?: 'sm' | 'md' | 'lg' }) {
  const sizeClass = size === 'sm' ? 'h-12 w-12' : size === 'lg' ? 'h-24 w-24' : 'h-20 w-20';
  const textClass = size === 'sm' ? 'text-xl' : size === 'lg' ? 'text-4xl' : 'text-3xl';

  return (
    <Avatar className={`${sizeClass} border border-primary/45 bg-zinc-950 shadow-inner`}>
      <AvatarFallback className={`bg-zinc-950 ${textClass} font-extrabold tabular-nums tracking-[-0.04em] text-primary flex items-center justify-center leading-none pt-[1px]`}>
        {player.jerseyNumber ?? getInitials(player.name)}
      </AvatarFallback>
    </Avatar>
  );
}

export default function PlayersPage() {
  const firestore = useFirestore();
  const [searchTerm, setSearchTerm] = React.useState('');

  const playersRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'players'), orderBy('name', 'asc'));
  }, [firestore]);

  const { data: players, isLoading } = useCollection<Player>(playersRef);

  const filteredPlayers = players?.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">Pasando lista...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 lg:space-y-8 p-4 lg:p-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 lg:gap-6">
        <div className="space-y-2">
          <h2 className="text-3xl lg:text-6xl font-extrabold uppercase tracking-[-0.04em] text-white flex items-center gap-3 lg:gap-4 leading-none">
            <Users className="h-7 w-7 lg:h-12 lg:w-12 text-primary shrink-0" />
            PLANTILLA ÉLITE
          </h2>
          <p className="text-[9px] lg:text-[11px] font-semibold uppercase tracking-[0.16em] text-primary/65 ml-1">
            ESTADÍSTICAS OFICIALES • MIEMBROS DEL CLUB
          </p>
        </div>
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar jugador..."
            className="pl-10 h-11 lg:h-12 rounded-xl bg-black/30 border-white/10 font-medium text-white placeholder:text-muted-foreground/55"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="md:hidden space-y-2">
        {filteredPlayers?.map((player) => (
          <Link key={player.id} href={`/players/${player.id}`} className="block">
            <Card className="competition-card official-table-row border-white/5 bg-black/35 px-4 py-3 flex items-center gap-4">
              <div className="relative shrink-0">
                <PlayerAvatar player={player} size="sm" />
                {player.role === 'admin' && (
                  <div className="absolute -top-1 -right-1 bg-primary text-white p-1 rounded-full shadow-lg">
                    <Star className="h-2.5 w-2.5 fill-current" />
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-sm uppercase tracking-tight text-white truncate">{player.name}</h3>
                <p className="text-[8px] font-medium uppercase tracking-[0.12em] text-muted-foreground/55 mt-1">
                  {player.position || 'COMODÍN'}
                </p>
              </div>
              <div className="flex items-center gap-2 text-primary/55 shrink-0">
                {player.jerseyNumber != null && (
                  <span className="text-[8px] font-semibold uppercase tracking-[0.1em]">N° {player.jerseyNumber}</span>
                )}
                <ChevronRight className="h-4 w-4" />
              </div>
            </Card>
          </Link>
        ))}
      </div>

      <div className="hidden md:grid md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {filteredPlayers?.map((player) => (
          <Link key={player.id} href={`/players/${player.id}`}>
            <Card className="competition-card official-table-row hover-lift h-full flex flex-col items-center p-6 text-center group border-white/[0.06] bg-black/35">
              <div className="relative mb-5 transition-transform duration-200 group-hover:scale-[1.03]">
                <PlayerAvatar player={player} size="lg" />
                {player.role === 'admin' && (
                  <div className="absolute -top-1 -right-1 bg-primary text-white p-1 rounded-full shadow-lg">
                    <Star className="h-3 w-3 fill-current" />
                  </div>
                )}
              </div>
              <h3 className="font-semibold text-sm lg:text-base uppercase tracking-tight text-white truncate w-full group-hover:text-primary transition-colors">
                {player.name}
              </h3>
              <p className="text-[8px] font-medium uppercase tracking-[0.12em] text-muted-foreground/50 mt-1 mb-4">
                {player.position || 'COMODÍN'}
              </p>
              <div className="mt-auto w-full pt-4 border-t border-white/[0.06] flex items-center justify-between text-[9px] font-semibold uppercase tracking-[0.08em] text-muted-foreground/35 group-hover:text-primary/65">
                <span>{player.jerseyNumber != null ? `DORSAL ${player.jerseyNumber}` : 'VER PERFIL'}</span>
                <ChevronRight className="h-3 w-3" />
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
