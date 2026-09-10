
'use client';

import * as React from 'react';
import { useFirestore, useDoc, useCollection, useMemoFirebase, useUser } from '@/firebase';
import { doc, collection, query, orderBy, where, getDocs, updateDoc, deleteField } from 'firebase/firestore';
import { useParams } from 'next/navigation';
import { calculateAggregatedStats } from '@/lib/data';
import type { Player, Match } from '@/lib/definitions';
import { PlayerPerformanceChart } from '@/components/players/player-performance-chart';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { getInitials } from '@/lib/utils';
import { Loader2, Pencil, Save } from 'lucide-react';
import { useSeason } from '@/context/season-context';
import { useToast } from '@/hooks/use-toast';
import { normalizePersonName } from '@/lib/whatsapp-match-import';

export default function PlayerProfilePage() {
  const { id } = useParams<{ id: string }>();
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  const { selectedSeasonId, loading: seasonLoading } = useSeason();
  const [editDialogOpen, setEditDialogOpen] = React.useState(false);
  const [editedName, setEditedName] = React.useState('');
  const [editedJerseyNumber, setEditedJerseyNumber] = React.useState('');
  const [isSavingPlayer, setIsSavingPlayer] = React.useState(false);

  const playerRef = useMemoFirebase(() => {
    if (!firestore || !id) return null;
    return doc(firestore, 'players', id);
  }, [firestore, id]);

  const matchesRef = useMemoFirebase(() => {
    if (!firestore || !selectedSeasonId) return null;
    return query(
      collection(firestore, 'matches'),
      where('seasonId', '==', selectedSeasonId)
    );
  }, [firestore, selectedSeasonId]);

  const adminRoleRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'roles_admin', user.uid);
  }, [firestore, user]);

  const { data: player, isLoading: playerLoading } = useDoc<Player>(playerRef);
  const { data: matchesRaw, isLoading: matchesLoading } = useCollection<Match>(matchesRef);
  const { data: adminRole } = useDoc<{ isAdmin: boolean }>(adminRoleRef);
  const isAdmin = !!adminRole?.isAdmin || user?.email === 'tadeoasrin@gmail.com';

  React.useEffect(() => {
    if (player) {
      setEditedName(player.name);
      setEditedJerseyNumber(player.jerseyNumber?.toString() ?? '');
    }
  }, [player]);

  const handleUpdatePlayer = async () => {
    const nextName = editedName.trim().replace(/\s+/g, ' ');
    const numberText = editedJerseyNumber.trim();
    const nextNumber = numberText === '' ? null : Number(numberText);

    if (!firestore || !playerRef || !player || !isAdmin || !nextName) return;
    if (nextNumber !== null && (!Number.isInteger(nextNumber) || nextNumber < 0 || nextNumber > 99)) {
      toast({ variant: 'destructive', title: 'Dorsal inválido', description: 'Usá un número entero entre 0 y 99.' });
      return;
    }

    setIsSavingPlayer(true);
    try {
      const playersSnapshot = await getDocs(query(collection(firestore, 'players'), orderBy('name', 'asc')));
      const duplicateName = playersSnapshot.docs.some(playerDoc =>
        playerDoc.id !== player.id && normalizePersonName(String(playerDoc.data().name || '')) === normalizePersonName(nextName)
      );
      if (duplicateName) {
        toast({ variant: 'destructive', title: 'Nombre duplicado', description: 'Ya existe otro jugador con ese nombre.' });
        setIsSavingPlayer(false);
        return;
      }

      const duplicateNumber = nextNumber !== null && playersSnapshot.docs.some(playerDoc =>
        playerDoc.id !== player.id && Number(playerDoc.data().jerseyNumber) === nextNumber
      );
      if (duplicateNumber) {
        toast({ variant: 'destructive', title: 'Dorsal ocupado', description: `El número ${nextNumber} ya pertenece a otro jugador.` });
        setIsSavingPlayer(false);
        return;
      }

      await updateDoc(playerRef, {
        name: nextName,
        jerseyNumber: nextNumber === null ? deleteField() : nextNumber,
      });
      toast({
        title: 'Jugador actualizado',
        description: nextNumber === null ? `${nextName} quedó sin dorsal.` : `${nextName} ahora usa el dorsal ${nextNumber}.`,
      });
      setEditDialogOpen(false);
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'No se pudo actualizar', description: error?.message || 'Intentá nuevamente.' });
    } finally {
      setIsSavingPlayer(false);
    }
  };

  const matches = React.useMemo(() => {
    if (!matchesRaw) return [];
    return [...matchesRaw].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [matchesRaw]);

  const stats = React.useMemo(() => {
    if (!player || !matches) return null;
    return calculateAggregatedStats([player], matches)[0];
  }, [player, matches]);

  const matchHistory = React.useMemo(() => {
    if (!player || !matches) return [];
    return matches
      .filter(m => [...m.teamAPlayers, ...m.teamBPlayers].some(s => s.playerId === player.id))
      .map(m => {
        const myStat = [...m.teamAPlayers, ...m.teamBPlayers].find(s => s.playerId === player.id);
        return { ...myStat!, matchId: m.id, date: m.date };
      });
  }, [player, matches]);

  if (playerLoading || matchesLoading || seasonLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="font-bebas text-xl tracking-widest text-muted-foreground uppercase">Escaneando métricas de élite...</p>
      </div>
    );
  }

  if (!player || !stats) return <div className="p-8 text-center text-muted-foreground">Jugador no encontrado</div>;

  return (
    <div className="space-y-8 p-4 lg:p-8 animate-in fade-in duration-700 max-w-7xl mx-auto">
      <div className="flex flex-col lg:flex-row gap-8 items-start">
        <div className="w-full lg:w-80 space-y-6">
           <Card className="competition-card border-white/5 bg-black/40 overflow-hidden text-center p-6 lg:p-8">
              <div className="relative mx-auto w-28 h-28 lg:w-32 lg:h-32 mb-5 lg:mb-6">
                <Avatar className="h-full w-full border-4 border-primary bg-zinc-950 shadow-[0_0_30px_rgba(59,130,246,0.2)]">
                  <AvatarFallback className="text-5xl lg:text-6xl font-bebas italic bg-zinc-950 text-primary">
                    {player.jerseyNumber ?? getInitials(player.name)}
                  </AvatarFallback>
                </Avatar>
              </div>
              <h2 className="text-2xl font-black uppercase tracking-tighter italic">{player.name}</h2>
              <p className="text-[10px] font-black uppercase tracking-widest text-primary mt-1">
                {player.position || 'COMODÍN'}{player.jerseyNumber != null ? ` • DORSAL ${player.jerseyNumber}` : ''}
              </p>
              {isAdmin && (
                <Dialog open={editDialogOpen} onOpenChange={(open) => {
                  setEditDialogOpen(open);
                  if (open) {
                    setEditedName(player.name);
                    setEditedJerseyNumber(player.jerseyNumber?.toString() ?? '');
                  }
                }}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="mt-5 border-primary/20 text-primary font-black uppercase tracking-widest text-[10px]">
                      <Pencil className="h-3 w-3" /> Editar jugador
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Editar jugador</DialogTitle>
                      <DialogDescription>Podés cambiar el nombre y asignar el dorsal sin alterar su historial ni estadísticas.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-2 text-left">
                      <div className="space-y-2">
                        <Label htmlFor="player-name">Nombre</Label>
                        <Input
                          id="player-name"
                          value={editedName}
                          onChange={(event) => setEditedName(event.target.value)}
                          disabled={isSavingPlayer}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="player-number">Dorsal</Label>
                        <Input
                          id="player-number"
                          type="number"
                          min="0"
                          max="99"
                          inputMode="numeric"
                          placeholder="Ej: 10"
                          value={editedJerseyNumber}
                          onChange={(event) => setEditedJerseyNumber(event.target.value)}
                          onKeyDown={(event) => {
                            if (event.key === 'Enter' && editedName.trim() && !isSavingPlayer) void handleUpdatePlayer();
                          }}
                          disabled={isSavingPlayer}
                        />
                        <p className="text-[10px] text-muted-foreground">Dejalo vacío si todavía no tiene número.</p>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setEditDialogOpen(false)} disabled={isSavingPlayer}>Cancelar</Button>
                      <Button onClick={() => void handleUpdatePlayer()} disabled={!editedName.trim() || isSavingPlayer}>
                        {isSavingPlayer ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                        {isSavingPlayer ? 'Guardando…' : 'Guardar jugador'}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}
              <div className="flex flex-wrap gap-2 justify-center mt-6">
                 {stats.totalMvp > 0 && <Badge className="bg-yellow-500 font-bold">{stats.totalMvp} MVP</Badge>}
                 {stats.wins > 5 && <Badge className="bg-primary font-bold">VETERANO</Badge>}
              </div>
           </Card>

           <div className="grid grid-cols-2 gap-4">
              <StatCard label="PJ" value={stats.matchesPlayed} sub="PARTIDOS" />
              <StatCard label="GOLES" value={stats.totalGoals} sub="TOTALES" />
              <StatCard label="WIN %" value={`${stats.winPercentage}%`} sub="EFECTIVIDAD" />
              <StatCard label="PROM" value={stats.goalsPerMatch} sub="POR PARTIDO" />
           </div>
        </div>

        <div className="flex-1 space-y-8">
           <PlayerPerformanceChart matchHistory={matchHistory} />
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, sub }: { label: string, value: any, sub: string }) {
  return (
    <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex flex-col items-center justify-center text-center">
       <span className="text-[8px] font-black uppercase text-muted-foreground tracking-widest">{label}</span>
       <span className="text-3xl font-bebas text-white mt-1 leading-none">{value}</span>
       <span className="text-[7px] font-bold text-primary/40 uppercase mt-1">{sub}</span>
    </div>
  );
}
