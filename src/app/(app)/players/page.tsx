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
import { Loader2, UserPlus, Trash2, Pencil, ArrowUpDown, ChevronUp, ChevronDown, ShieldCheck } from "lucide-react";
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
  }, [searchParams]);

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
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const allPlayers = playersData || [];
  const allMatches = matchesData || [];
  
  const rawStats = calculateAggregatedStats(allPlayers, allMatches);
  
  // Jerarquía de capitanes sugeridos (top 2)
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

    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return sortConfig.direction === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
    }

    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
    }

    return 0;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Jugadores</h1>
          <p className="text-muted-foreground">Estadísticas y roles tácticos de todos los miembros.</p>
        </div>
        {isAdmin && (
          <Dialog>
            <DialogTrigger asChild>
              <Button><UserPlus className="mr-2 h-4 w-4" /> Nuevo Jugador</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Añadir Nuevo Jugador</DialogTitle>
                <DialogDescription>Ingresa los datos para darlo de alta en el club.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Nombre Completo</Label>
                  <Input
                    id="name"
                    value={newPlayerName}
                    onChange={(e) => setNewPlayerName(e.target.value)}
                    placeholder="Ej. Juan Pérez"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="position">Posición</Label>
                  <Select onValueChange={(val) => setNewPlayerPosition(val as PlayerPosition)} value={newPlayerPosition}>
                    <SelectTrigger>
                        <SelectValue placeholder="Selecciona una posición" />
                    </SelectTrigger>
                    <SelectContent>
                        {POSITIONS.map(pos => (
                            <SelectItem key={pos} value={pos}>{pos}</SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleAddPlayer} disabled={isUpdatingPlayer || !newPlayerName}>
                  {isUpdatingPlayer && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Guardar Jugador
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Card className="competition-card">
          <CardContent className="p-0">
              <Table>
                  <TableHeader>
                      <TableRow className="bg-muted/30">
                      <TableHead 
                        className="pl-6 cursor-pointer hover:text-primary transition-colors"
                        onClick={() => handleSort('name')}
                      >
                        <div className="flex items-center">Jugador {getSortIcon('name')}</div>
                      </TableHead>
                      <TableHead className="text-center">Posición</TableHead>
                      <TableHead className="text-center cursor-pointer hover:text-primary transition-colors" onClick={() => handleSort('matchesPlayed')}>
                        <div className="flex items-center justify-center">Partidos {getSortIcon('matchesPlayed')}</div>
                      </TableHead>
                      <TableHead className="text-center cursor-pointer hover:text-primary transition-colors" onClick={() => handleSort('totalGoals')}>
                        <div className="flex items-center justify-center">Goles {getSortIcon('totalGoals')}</div>
                      </TableHead>
                      <TableHead className="text-center cursor-pointer hover:text-primary transition-colors" onClick={() => handleSort('totalCaptaincies')}>
                        <div className="flex items-center justify-center">Mando {getSortIcon('totalCaptaincies')}</div>
                      </TableHead>
                      {isAdmin && <TableHead className="text-right pr-6">Acciones</TableHead>}
                      </TableRow>
                  </TableHeader>
                  <TableBody>
                      {playerStats.map((player) => {
                        const isSuggested = suggestedLeaderIds.includes(player.playerId);
                        return (
                          <TableRow key={player.playerId} className="official-table-row">
                              <TableCell className="pl-6">
                              <div className="flex items-center gap-3">
                                  <Avatar className="h-9 w-9">
                                    <AvatarFallback className="bg-primary/20 text-primary font-black">{getInitials(player.name)}</AvatarFallback>
                                  </Avatar>
                                  <div className="flex flex-col">
                                    <Link href={`/players/${player.playerId}`} className="font-medium hover:underline flex items-center gap-2">
                                      {player.name}
                                      {isSuggested && (
                                        <Badge variant="outline" className="h-4 border-emerald-500/50 text-emerald-500 bg-emerald-500/5 text-[7px] font-black uppercase px-1.5 py-0 rounded-none">
                                          LÍDER SUGERIDO
                                        </Badge>
                                      )}
                                    </Link>
                                  </div>
                              </div>
                              </TableCell>
                              <TableCell className="text-center">
                                {player.position ? (
                                    <Badge variant="outline" className="font-medium text-[10px] uppercase tracking-wider">
                                        {player.position}
                                    </Badge>
                                ) : (
                                    <span className="text-muted-foreground text-xs italic">Sin asignar</span>
                                )}
                              </TableCell>
                              <TableCell className="text-center font-mono font-bold">{player.matchesPlayed}</TableCell>
                              <TableCell className="text-center font-mono font-bold">{player.totalGoals}</TableCell>
                              <TableCell className="text-center">
                                <div className="flex items-center justify-center gap-1.5">
                                  <span className="font-mono font-bold">{player.totalCaptaincies}</span>
                                  {player.totalCaptaincies > 0 && <ShieldCheck className="h-3 w-3 text-emerald-500" />}
                                </div>
                              </TableCell>
                              {isAdmin && (
                                <TableCell className="text-right pr-6">
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
                                        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary">
                                          <Pencil className="h-4 w-4" />
                                        </Button>
                                      </DialogTrigger>
                                      <DialogContent>
                                        <DialogHeader>
                                          <DialogTitle>Editar Jugador</DialogTitle>
                                          <DialogDescription>Modifica los datos de {player.name}.</DialogDescription>
                                        </DialogHeader>
                                        <div className="grid gap-4 py-4">
                                          <div className="grid gap-2">
                                            <Label htmlFor="edit-name">Nombre Completo</Label>
                                            <Input id="edit-name" value={editPlayerName} onChange={(e) => setEditPlayerName(e.target.value)} />
                                          </div>
                                          <div className="grid gap-2">
                                            <Label htmlFor="edit-position">Posición</Label>
                                            <Select onValueChange={(val) => setEditPlayerPosition(val as PlayerPosition)} value={editPlayerPosition}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Selecciona una posición" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {POSITIONS.map(pos => (
                                                        <SelectItem key={pos} value={pos}>{pos}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                          </div>
                                        </div>
                                        <DialogFooter>
                                          <Button onClick={handleUpdatePlayer} disabled={isUpdatingPlayer || !editPlayerName}>
                                            {isUpdatingPlayer && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                            Guardar Cambios
                                          </Button>
                                        </DialogFooter>
                                      </DialogContent>
                                    </Dialog>

                                    <AlertDialog>
                                      <AlertDialogTrigger asChild>
                                        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive">
                                          <Trash2 className="h-4 w-4" />
                                        </Button>
                                      </AlertDialogTrigger>
                                      <AlertDialogContent>
                                        <AlertDialogHeader>
                                          <AlertDialogTitle>¿Eliminar a {player.name}?</AlertDialogTitle>
                                          <AlertDialogDescription>Atención: Si eliminas al jugador, sus datos se perderán en los partidos pasados.</AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                          <AlertDialogAction onClick={() => handleDeletePlayer(player.playerId)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                            Eliminar permanentemente
                                          </AlertDialogAction>
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
