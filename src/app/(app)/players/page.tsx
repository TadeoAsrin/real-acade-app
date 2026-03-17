'use client';

import * as React from 'react';
import { useSearchParams } from 'next/navigation';
import { calculateAggregatedStats } from "@/lib/data";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { useCollection, useMemoFirebase, useFirestore, useUser, useDoc, setDocumentNonBlocking, updateDocumentNonBlocking, deleteDocumentNonBlocking } from "@/firebase";
import { collection, doc, query, orderBy } from "firebase/firestore";
import type { Player, Match, AggregatedPlayerStats, PlayerPosition } from "@/lib/definitions";
import { Loader2, UserPlus, Trash2, Pencil, ArrowUpDown, ChevronUp, ChevronDown, ShieldCheck, Users, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getInitials } from '@/lib/utils';
import { Badge } from "@/components/ui/badge";

type SortConfig = {
  key: keyof AggregatedPlayerStats;
  direction: 'asc' | 'desc';
};

const POSITIONS: PlayerPosition[] = ["Arquero", "Lateral Derecho", "Defensor Central", "Lateral Izquierdo", "Mediocampista", "Delantero"];

function PlayersList() {
  const searchParams = useSearchParams();
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  
  const [newPlayerName, setNewPlayerName] = React.useState('');
  const [newPlayerPosition, setNewPlayerPosition] = React.useState<PlayerPosition | ''>('');
  
  const [editingPlayerId, setEditingPlayerId] = React.useState<string | null>(null);
  const [editPlayerName, setEditPlayerName] = React.useState('');
  const [editPlayerPosition, setEditPlayerPosition] = React.useState<PlayerPosition | ''>('');
  const [isUpdatingPlayer, setIsUpdatingPlayer] = React.useState(false);

  const [sortConfig, setSortConfig] = React.useState<SortConfig>({ key: 'name', direction: 'asc' });

  React.useEffect(() => {
    const sortParam = searchParams.get('sort');
    if (sortParam === 'totalGoals') {
      setSortConfig({ key: 'totalGoals', direction: 'desc' });
    }
  }, [searchParams]); // CORREGIDO: Usando searchParams en lugar de sortParams inexistente

  const playersQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'players'), orderBy('name', 'asc'));
  }, [firestore]);

  const matchesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'matches');
  }, [firestore]);

  const adminRoleRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'roles_admin', user.uid);
  }, [firestore, user]);

  const { data: playersData, isLoading: playersLoading } = useCollection<Player>(playersQuery);
  const { data: matchesData, isLoading: matchesLoading } = useCollection<Match>(matchesQuery);
  const { data: adminRole } = useDoc<{isAdmin: boolean}>(adminRoleRef);

  const isAdmin = adminRole?.isAdmin;

  const handleAddPlayer = () => {
    if (!firestore || !newPlayerName) return;
    setIsUpdatingPlayer(true);
    const playerRef = doc(collection(firestore, 'players'));
    setDocumentNonBlocking(playerRef, {
      name: newPlayerName,
      position: newPlayerPosition || null,
      role: 'player'
    }, {});

    toast({
      title: "Jugador Creado",
      description: `${newPlayerName} ha sido añadido al club.`,
    });
    setNewPlayerName('');
    setNewPlayerPosition('');
    setIsUpdatingPlayer(false);
  };

  const handleUpdatePlayer = () => {
    if (!firestore || !editingPlayerId || !editPlayerName) return;
    setIsUpdatingPlayer(true);
    const playerRef = doc(firestore, 'players', editingPlayerId);
    updateDocumentNonBlocking(playerRef, {
      name: editPlayerName,
      position: editPlayerPosition || null
    });

    toast({
      title: "Jugador Actualizado",
      description: "Los datos han sido modificados correctamente.",
    });
    setEditingPlayerId(null);
    setEditPlayerName('');
    setEditPlayerPosition('');
    setIsUpdatingPlayer(false);
  };

  const handleDeletePlayer = (playerId: string) => {
    if (!firestore) return;
    const playerRef = doc(firestore, 'players', playerId);
    deleteDocumentNonBlocking(playerRef);
    toast({ title: "Jugador Eliminado", description: "El registro ha sido borrado del club." });
  };

  const handleSort = (key: keyof AggregatedPlayerStats) => {
    let direction: 'asc' | 'desc' = 'desc';
    if (sortConfig.key === key && sortConfig.direction === 'desc') {
      direction = 'asc';
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key: keyof AggregatedPlayerStats) => {
    if (sortConfig.key !== key) return <ArrowUpDown className="ml-2 h-4 w-4 opacity-50" />;
    return sortConfig.direction === 'asc' ? <ChevronUp className="ml-2 h-4 w-4 text-primary" /> : <ChevronDown className="ml-2 h-4 w-4 text-primary" />;
  };

  if (playersLoading || matchesLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  const allPlayers = playersData || [];
  const allMatches = matchesData || [];
  const rawStats = calculateAggregatedStats(allPlayers, allMatches);
  
  const suggestedLeaderIds = rawStats
    .filter(p => p.isActive)
    .sort((a, b) => {
      if (a.totalCaptaincies === 0 && b.totalCaptaincies > 0) return -1;
      if (a.totalCaptaincies > 0 && b.totalCaptaincies === 0) return 1;
      if (a.totalCaptaincies === 0 && b.totalCaptaincies === 0) return b.matchesPlayed - a.matchesPlayed;
      return b.captaincyPriorityScore - a.captaincyPriorityScore;
    })
    .slice(0, 2)
    .map(p => p.playerId);

  const playerStats = rawStats.sort((a, b) => {
    const aValue = a[sortConfig.key];
    const bValue = b[sortConfig.key];
    if (typeof aValue === 'string' && typeof bValue === 'string') return sortConfig.direction === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
    if (typeof aValue === 'number' && typeof bValue === 'number') return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
    return 0;
  });

  return (
    <div className="flex flex-col gap-10 max-w-7xl mx-auto pb-20">
      {/* 1. CINEMATIC HEADER */}
      <section className="cinematic-banner p-8 md:p-12 flex flex-col md:flex-row justify-between items-center gap-8">
        <div className="absolute inset-0 bg-black/40 pointer-events-none" />
        <div className="relative z-10 space-y-4 text-center md:text-left">
          <div className="flex items-center justify-center md:justify-start gap-3">
            <Badge className="bg-primary text-primary-foreground font-bebas tracking-widest px-3 py-1 text-sm rounded-none shadow-lg shadow-primary/20">EDICIÓN ESPECIAL</Badge>
            <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em] font-oswald">MERCADO DE PASES</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-bebas text-white tracking-wider leading-none uppercase">PLANTILLA ÉLITE</h1>
          <p className="text-lg md:text-xl text-muted-foreground font-lora italic max-w-2xl">Perfiles tácticos y estadísticas oficiales de todos los cracks del club.</p>
        </div>

        {isAdmin && (
          <div className="relative z-10">
            <Dialog>
              <DialogTrigger asChild>
                <Button size="lg" className="h-16 px-10 font-bebas text-2xl tracking-[0.2em] bg-white text-black hover:bg-white/90 shadow-[0_0_40px_rgba(255,255,255,0.25)] rounded-none transition-all group hover:px-12">
                  <UserPlus className="mr-3 h-6 w-6" /> NUEVO CRACK
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-surface-900 border-white/10 text-white">
                <DialogHeader>
                  <DialogTitle className="font-bebas text-3xl tracking-widest text-primary italic">AÑADIR NUEVO JUGADOR</DialogTitle>
                  <DialogDescription className="font-oswald uppercase text-[10px] tracking-widest text-muted-foreground/60">Ingresa los datos para darlo de alta en el club.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-6 py-6">
                  <div className="grid gap-2">
                    <Label htmlFor="name" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Nombre Completo</Label>
                    <Input id="name" value={newPlayerName} onChange={(e) => setNewPlayerName(e.target.value)} placeholder="Ej. Juan Pérez" className="bg-black/40 border-white/10 h-12 font-bold uppercase italic" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="position" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Posición Táctica</Label>
                    <Select onValueChange={(val) => setNewPlayerPosition(val as PlayerPosition)} value={newPlayerPosition}>
                      <SelectTrigger className="bg-black/40 border-white/10 h-12 font-bold uppercase italic">
                          <SelectValue placeholder="Seleccionar rol" />
                      </SelectTrigger>
                      <SelectContent className="bg-surface-900 border-white/10">
                          {POSITIONS.map(pos => (
                              <SelectItem key={pos} value={pos} className="font-bold uppercase italic">{pos}</SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={handleAddPlayer} disabled={isUpdatingPlayer || !newPlayerName} className="w-full h-14 font-bebas text-xl tracking-widest bg-primary text-white">
                    {isUpdatingPlayer && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                    GUARDAR EN PLANTILLA
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </section>

      <Card className="competition-card border-none bg-black/20 backdrop-blur-md">
          <CardContent className="p-0">
              <Table>
                  <TableHeader>
                      <TableRow className="bg-black/40 border-white/5 h-14">
                      <TableHead className="pl-8 cursor-pointer hover:text-primary transition-colors font-bebas text-sm" onClick={() => handleSort('name')}>
                        <div className="flex items-center">JUGADOR {getSortIcon('name')}</div>
                      </TableHead>
                      <TableHead className="text-center font-bebas text-sm">POSICIÓN</TableHead>
                      <TableHead className="text-center cursor-pointer hover:text-primary transition-colors font-bebas text-sm" onClick={() => handleSort('matchesPlayed')}>
                        <div className="flex items-center justify-center">PJ {getSortIcon('matchesPlayed')}</div>
                      </TableHead>
                      <TableHead className="text-center cursor-pointer hover:text-primary transition-colors font-bebas text-sm" onClick={() => handleSort('totalGoals')}>
                        <div className="flex items-center justify-center">GF {getSortIcon('totalGoals')}</div>
                      </TableHead>
                      <TableHead className="text-center cursor-pointer hover:text-primary transition-colors font-bebas text-sm" onClick={() => handleSort('totalCaptaincies')}>
                        <div className="flex items-center justify-center">MANDO {getSortIcon('totalCaptaincies')}</div>
                      </TableHead>
                      {isAdmin && <TableHead className="text-right pr-8 font-bebas text-sm">ACCIONES</TableHead>}
                      </TableRow>
                  </TableHeader>
                  <TableBody>
                      {playerStats.map((player) => {
                        const isSuggested = suggestedLeaderIds.includes(player.playerId);
                        return (
                          <TableRow key={player.playerId} className="official-table-row h-20">
                              <TableCell className="pl-8">
                              <div className="flex items-center gap-4">
                                  <Avatar className="h-12 w-12 border-2 border-white/10 shadow-xl">
                                    <AvatarFallback className="bg-primary/20 text-primary font-black text-lg">{getInitials(player.name)}</AvatarFallback>
                                  </Avatar>
                                  <div className="flex flex-col">
                                    <Link href={`/players/${player.playerId}`} className="font-black uppercase tracking-tight hover:text-primary transition-colors text-lg italic">
                                      {player.name}
                                    </Link>
                                    {isSuggested && (
                                      <div className="flex items-center gap-1 mt-0.5">
                                        <Sparkles className="h-2.5 w-2.5 text-emerald-500" />
                                        <span className="text-[7px] font-black text-emerald-500 uppercase tracking-widest font-oswald">LÍDER SUGERIDO</span>
                                      </div>
                                    )}
                                  </div>
                              </div>
                              </TableCell>
                              <TableCell className="text-center">
                                {player.position ? (
                                    <Badge variant="outline" className="font-black text-[9px] uppercase tracking-[0.2em] italic border-white/10 px-3 py-1 bg-white/5">
                                        {player.position}
                                    </Badge>
                                ) : (
                                    <span className="text-muted-foreground text-[10px] font-bold uppercase tracking-widest opacity-20 italic">Sin rol</span>
                                )}
                              </TableCell>
                              <TableCell className="text-center font-bebas text-2xl text-white/80">{player.matchesPlayed}</TableCell>
                              <TableCell className="text-center font-bebas text-2xl text-yellow-500/80">{player.totalGoals}</TableCell>
                              <TableCell className="text-center">
                                <div className="flex items-center justify-center gap-2">
                                  <span className="font-bebas text-2xl text-emerald-500/80">{player.totalCaptaincies}</span>
                                  {player.totalCaptaincies > 0 && <ShieldCheck className="h-4 w-4 text-emerald-500" />}
                                </div>
                              </TableCell>
                              {isAdmin && (
                                <TableCell className="text-right pr-8">
                                  <div className="flex justify-end gap-2">
                                    <Dialog open={editingPlayerId === player.playerId} onOpenChange={(open) => {
                                      if (open) {
                                        setEditingPlayerId(player.playerId);
                                        setEditPlayerName(player.name);
                                        setEditPlayerPosition(player.position || '');
                                      } else {
                                        setEditingPlayerId(null);
                                      }
                                    }}>
                                      <DialogTrigger asChild>
                                        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary transition-colors">
                                          <Pencil className="h-4 w-4" />
                                        </Button>
                                      </DialogTrigger>
                                      <DialogContent className="bg-surface-900 border-white/10 text-white">
                                        <DialogHeader>
                                          <DialogTitle className="font-bebas text-3xl tracking-widest text-primary italic">EDITAR JUGADOR</DialogTitle>
                                          <DialogDescription className="font-oswald uppercase text-[10px] tracking-widest text-muted-foreground/60">Modifica los datos oficiales de {player.name}.</DialogDescription>
                                        </DialogHeader>
                                        <div className="grid gap-6 py-6">
                                          <div className="grid gap-2">
                                            <Label htmlFor="edit-name" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Nombre Completo</Label>
                                            <Input id="edit-name" value={editPlayerName} onChange={(e) => setEditPlayerName(e.target.value)} className="bg-black/40 border-white/10 h-12 font-bold uppercase italic" />
                                          </div>
                                          <div className="grid gap-2">
                                            <Label htmlFor="edit-position" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Posición Táctica</Label>
                                            <Select onValueChange={(val) => setEditPlayerPosition(val as PlayerPosition)} value={editPlayerPosition}>
                                                <SelectTrigger className="bg-black/40 border-white/10 h-12 font-bold uppercase italic">
                                                    <SelectValue placeholder="Seleccionar rol" />
                                                </SelectTrigger>
                                                <SelectContent className="bg-surface-900 border-white/10">
                                                    {POSITIONS.map(pos => (
                                                        <SelectItem key={pos} value={pos} className="font-bold uppercase italic">{pos}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                          </div>
                                        </div>
                                        <DialogFooter>
                                          <Button onClick={handleUpdatePlayer} disabled={isUpdatingPlayer || !editPlayerName} className="w-full h-14 font-bebas text-xl tracking-widest bg-primary text-white">
                                            {isUpdatingPlayer && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                                            GUARDAR CAMBIOS
                                          </Button>
                                        </DialogFooter>
                                      </DialogContent>
                                    </Dialog>

                                    <AlertDialog>
                                      <AlertDialogTrigger asChild>
                                        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive transition-colors">
                                          <Trash2 className="h-4 w-4" />
                                        </Button>
                                      </AlertDialogTrigger>
                                      <AlertDialogContent className="bg-surface-900 border-white/10 text-white">
                                        <AlertDialogHeader>
                                          <AlertDialogTitle className="font-bebas text-3xl tracking-widest text-destructive italic">¿BAJA DEFINITIVA?</AlertDialogTitle>
                                          <AlertDialogDescription className="font-oswald uppercase text-[10px] tracking-widest text-muted-foreground/60">Atención: Al eliminar a {player.name}, sus datos desaparecerán del historial del club.</AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                          <AlertDialogCancel className="bg-white/5 border-white/10 text-white font-bebas tracking-widest rounded-none h-12">CANCELAR</AlertDialogCancel>
                                          <AlertDialogAction onClick={() => handleDeletePlayer(player.playerId)} className="bg-destructive text-white font-bebas tracking-widest rounded-none h-12 px-8">ELIMINAR PERMANENTEMENTE</AlertDialogAction>
                                        </AlertDialogFooter>
                                      </AlertDialogContent>
                                    </AlertDialog>
                                  </div>
                                </TableCell>
                              )}
                          </TableRow>
                        );
                      })}
                  </TableBody>
              </Table>
          </CardContent>
      </Card>
    </div>
  );
}

export default function PlayersPage() {
  return (
    <React.Suspense fallback={<div className="flex h-[50vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}>
      <PlayersList />
    </React.Suspense>
  );
}
