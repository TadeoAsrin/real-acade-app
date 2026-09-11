'use client';

import * as React from 'react';
import { useFirestore, useDoc, useCollection, useMemoFirebase, useUser } from '@/firebase';
import { doc, collection, query, orderBy, getDocs, writeBatch } from 'firebase/firestore';
import { useParams, useRouter } from 'next/navigation';
import type { Match, Player } from '@/lib/definitions';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { BestGoalVote } from '@/components/matches/best-goal-vote';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { getInitials } from '@/lib/utils';
import { Calendar, MapPin, Loader2, ArrowLeft, Edit3, Trash2, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

const DELETE_CONFIRMATION = 'realacade';

export default function MatchDetailPage() {
  const { id } = useParams<{ id: string }>();
  const firestore = useFirestore();
  const { user } = useUser();
  const router = useRouter();
  const { toast } = useToast();
  const [deleteConfirmation, setDeleteConfirmation] = React.useState('');
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);

  const matchRef = useMemoFirebase(() => {
    if (!firestore || !id) return null;
    return doc(firestore, 'matches', id);
  }, [firestore, id]);

  const playersRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'players'), orderBy('name', 'asc'));
  }, [firestore]);

  const adminRoleRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'roles_admin', user.uid);
  }, [firestore, user]);

  const { data: match, isLoading: matchLoading } = useDoc<Match>(matchRef);
  const { data: players, isLoading: playersLoading } = useCollection<Player>(playersRef);
  const { data: adminRole } = useDoc<{isAdmin: boolean}>(adminRoleRef);

  const isAdmin = !!adminRole?.isAdmin || user?.email === 'tadeoasrin@gmail.com';

  const handleDelete = async () => {
    if (!firestore || !matchRef || !isAdmin || deleteConfirmation !== DELETE_CONFIRMATION) return;

    setIsDeleting(true);
    try {
      const batch = writeBatch(firestore);
      const votesSnapshot = await getDocs(collection(matchRef, 'votes'));
      votesSnapshot.forEach(vote => batch.delete(vote.ref));
      batch.delete(matchRef);
      await batch.commit();

      toast({ title: 'Partido eliminado', description: 'El historial y las estadísticas ya fueron actualizados.' });
      router.push('/matches');
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'No se pudo eliminar', description: error?.message || 'Intentá nuevamente.' });
      setIsDeleting(false);
    }
  };

  if (matchLoading || playersLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="font-bebas text-xl tracking-widest text-muted-foreground uppercase">Abriendo ficha del partido...</p>
      </div>
    );
  }

  if (!match) return <div className="p-8 text-center text-muted-foreground uppercase font-black">Partido no encontrado</div>;

  const goalScorers = [
    ...(match.teamAPlayers || []).filter(p => p.goals > 0),
    ...(match.teamBPlayers || []).filter(p => p.goals > 0)
  ].map(s => {
    const p = players?.find(pl => pl.id === s.playerId);
    return { ...p!, goals: s.goals, hasBestGoal: s.hasBestGoal };
  });

  return (
    <div className="space-y-8 p-4 lg:p-8 animate-in fade-in duration-700 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <Link href="/matches" className="flex items-center gap-2 text-[10px] font-black uppercase text-muted-foreground hover:text-primary transition-colors tracking-widest">
          <ArrowLeft className="h-3 w-3" /> VOLVER AL HISTORIAL
        </Link>
        
        {isAdmin && (
          <Button asChild variant="outline" size="sm" className="h-8 border-primary/20 hover:bg-primary/10 text-primary font-black uppercase text-[10px] tracking-widest">
            <Link href={`/matches/${id}/edit`}>
              <Edit3 className="h-3 w-3 mr-2" /> EDITAR FICHA
            </Link>
          </Button>
        )}
      </div>

      <Card className="competition-card overflow-hidden bg-black/40 border-white/5 shadow-2xl">
        <div className="p-8 md:p-12 flex flex-col items-center justify-center gap-8 bg-gradient-to-b from-primary/10 via-transparent to-accent/10">
          <div className="flex items-center gap-2 text-[10px] font-black uppercase text-muted-foreground tracking-[0.4em] bg-white/5 px-4 py-1.5 rounded-full">
            <Calendar className="h-3 w-3 text-primary" />
            {format(parseISO(match.date), "eeee, dd MMMM yyyy", { locale: es })}
          </div>
          
          <div className="flex items-center justify-center gap-12 md:gap-24">
            <div className="flex flex-col items-center gap-4">
               <div className="w-24 h-24 md:w-32 md:h-32 rounded-3xl bg-primary/20 border-2 border-primary flex items-center justify-center shadow-[0_0_50px_rgba(59,130,246,0.2)]">
                  <span className="text-6xl md:text-8xl font-bebas text-white">{match.teamAScore}</span>
               </div>
               <span className="text-xs font-black uppercase tracking-widest text-primary">TEAM AZUL</span>
            </div>

            <div className="text-2xl font-light text-muted-foreground/20 italic select-none">VS</div>

            <div className="flex flex-col items-center gap-4">
               <div className="w-24 h-24 md:w-32 md:h-32 rounded-3xl bg-accent/20 border-2 border-accent flex items-center justify-center shadow-[0_0_50px_rgba(244,63,94,0.2)]">
                  <span className="text-6xl md:text-8xl font-bebas text-white">{match.teamBScore}</span>
               </div>
               <span className="text-xs font-black uppercase tracking-widest text-accent">TEAM ROJO</span>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
           
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <Card className="competition-card border-primary/10">
                 <CardHeader className="bg-primary/5">
                    <CardTitle className="text-sm font-black uppercase text-primary tracking-widest">Goleadores Azul</CardTitle>
                 </CardHeader>
                 <CardContent className="p-4 space-y-3">
                    {match.teamAPlayers?.filter(p => p.goals > 0).map(p => (
                      <div key={p.playerId} className="flex items-center justify-between p-2 rounded-lg bg-white/5 border border-white/5">
                        <div className="flex items-center gap-3">
                           <Avatar className="h-8 w-8">
                              <AvatarFallback className="text-[10px] bg-zinc-900">{getInitials(players?.find(pl => pl.id === p.playerId)?.name || 'U')}</AvatarFallback>
                           </Avatar>
                           <span className="font-bold text-xs uppercase">{players?.find(pl => pl.id === p.playerId)?.name}</span>
                        </div>
                        <span className="font-bebas text-xl text-primary">x{p.goals}</span>
                      </div>
                    ))}
                 </CardContent>
              </Card>

              <Card className="competition-card border-accent/10">
                 <CardHeader className="bg-accent/5">
                    <CardTitle className="text-sm font-black uppercase text-accent tracking-widest">Goleadores Rojo</CardTitle>
                 </CardHeader>
                 <CardContent className="p-4 space-y-3">
                    {match.teamBPlayers?.filter(p => p.goals > 0).map(p => (
                      <div key={p.playerId} className="flex items-center justify-between p-2 rounded-lg bg-white/5 border border-white/5">
                        <div className="flex items-center gap-3">
                           <Avatar className="h-8 w-8">
                              <AvatarFallback className="text-[10px] bg-zinc-900">{getInitials(players?.find(pl => pl.id === p.playerId)?.name || 'U')}</AvatarFallback>
                           </Avatar>
                           <span className="font-bold text-xs uppercase">{players?.find(pl => pl.id === p.playerId)?.name}</span>
                        </div>
                        <span className="font-bebas text-xl text-accent">x{p.goals}</span>
                      </div>
                    ))}
                 </CardContent>
              </Card>
           </div>
        </div>

        <div className="space-y-8">
           <BestGoalVote matchId={match.id} scorers={goalScorers} />
           
           <Card className="competition-card">
              <CardHeader>
                 <CardTitle className="text-lg font-bebas tracking-widest">DATOS DE CAMPO</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                 <div className="flex items-center justify-between py-2">
                    <span className="text-[10px] font-black uppercase text-muted-foreground">UBICACIÓN</span>
                    <span className="text-xs font-bold text-white flex items-center gap-1.5 uppercase">
                       <MapPin className="h-3 w-3 text-primary" /> {match.venue || 'El Pinar Arena'}
                    </span>
                 </div>
                 {match.matchNumber && (
                   <div className="flex items-center justify-between py-2 border-t border-white/5">
                      <span className="text-[10px] font-black uppercase text-muted-foreground">FECHA</span>
                      <span className="text-xs font-bold text-white">N.º {match.matchNumber}</span>
                   </div>
                 )}
              </CardContent>
           </Card>
        </div>
      </div>

      {isAdmin && (
        <Card className="border-destructive/30 bg-destructive/[0.04]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive font-bebas tracking-widest">
              <AlertTriangle className="h-5 w-5" /> ZONA DE PELIGRO
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col md:flex-row md:items-center justify-between gap-5">
            <div>
              <p className="font-bold text-sm uppercase">Eliminar este partido</p>
              <p className="text-xs text-muted-foreground mt-1">Se quitará del historial y dejará de contar en todas las estadísticas.</p>
            </div>
            <AlertDialog open={deleteDialogOpen} onOpenChange={(open) => {
              setDeleteDialogOpen(open);
              if (!open) setDeleteConfirmation('');
            }}>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="font-black uppercase tracking-widest text-xs">
                  <Trash2 className="h-4 w-4" /> Eliminar partido
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="border-destructive/30">
                <AlertDialogHeader>
                  <AlertDialogTitle className="flex items-center gap-2 text-destructive">
                    <AlertTriangle className="h-5 w-5" /> ¿Eliminar definitivamente?
                  </AlertDialogTitle>
                  <AlertDialogDescription className="space-y-2">
                    <span className="block">Vas a eliminar el partido del {format(parseISO(match.date), 'dd/MM/yyyy')} — Azul {match.teamAScore} a {match.teamBScore} Rojo.</span>
                    <span className="block font-bold text-foreground">Esta acción no se puede deshacer.</span>
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="space-y-2 py-2">
                  <Label htmlFor="delete-confirmation" className="text-xs">Escribí <span className="font-mono font-bold text-destructive">realacade</span> para confirmar</Label>
                  <Input
                    id="delete-confirmation"
                    type="password"
                    autoComplete="off"
                    value={deleteConfirmation}
                    onChange={(event) => setDeleteConfirmation(event.target.value)}
                    placeholder="Contraseña de confirmación"
                    disabled={isDeleting}
                  />
                </div>
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={(event) => {
                      event.preventDefault();
                      void handleDelete();
                    }}
                    disabled={deleteConfirmation !== DELETE_CONFIRMATION || isDeleting}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                    {isDeleting ? 'Eliminando…' : 'Eliminar definitivamente'}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
