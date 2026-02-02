
'use client';

import * as React from 'react';
import { calculateAggregatedStats } from "@/lib/data";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useCollection, useMemoFirebase, useFirestore, useUser, useDoc } from "@/firebase";
import { collection, doc, setDoc } from "firebase/firestore";
import type { Player, Match } from "@/lib/definitions";
import { Loader2, UserPlus } from "lucide-react";
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
import { PlaceHolderImages } from '@/lib/placeholder-images';

export default function PlayersPage() {
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  const [isAddingPlayer, setIsAddingPlayer] = React.useState(false);
  const [newPlayerName, setNewPlayerName] = React.useState('');

  const playersQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'players');
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

  const handleAddPlayer = async () => {
    if (!firestore || !newPlayerName) return;
    setIsAddingPlayer(true);
    try {
      const playerId = crypto.randomUUID();
      // Usamos un avatar aleatorio de los placeholders
      const randomAvatar = PlaceHolderImages[Math.floor(Math.random() * PlaceHolderImages.length)].imageUrl;
      
      await setDoc(doc(firestore, 'players', playerId), {
        name: newPlayerName,
        avatar: randomAvatar,
        role: 'player'
      });

      toast({
        title: "Jugador Creado",
        description: `${newPlayerName} ha sido añadido al club.`,
      });
      setNewPlayerName('');
    } catch (error) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo crear el jugador.",
      });
    } finally {
      setIsAddingPlayer(false);
    }
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
  const playerStats = calculateAggregatedStats(allPlayers, allMatches);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Jugadores</h1>
          <p className="text-muted-foreground">Estadísticas acumuladas de todos los miembros.</p>
        </div>
        {isAdmin && (
          <Dialog>
            <DialogTrigger asChild>
              <Button><UserPlus className="mr-2 h-4 w-4" /> Nuevo Jugador</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Añadir Nuevo Jugador</DialogTitle>
                <DialogDescription>
                  Ingresa el nombre del jugador para registrarlo en el sistema.
                </DialogDescription>
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
              </div>
              <DialogFooter>
                <Button onClick={handleAddPlayer} disabled={isAddingPlayer || !newPlayerName}>
                  {isAddingPlayer && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Guardar Jugador
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Card>
          <CardContent className="p-0">
              <Table>
                  <TableHeader>
                      <TableRow>
                      <TableHead className="pl-6">Jugador</TableHead>
                      <TableHead className="text-center">Partidos</TableHead>
                      <TableHead className="text-center">Goles</TableHead>
                      <TableHead className="text-center">Efectividad</TableHead>
                      <TableHead className="text-center">Capitán</TableHead>
                      <TableHead className="text-center">MVP</TableHead>
                      <TableHead className="text-center pr-6">Mejor Gol</TableHead>
                      </TableRow>
                  </TableHeader>
                  <TableBody>
                      {playerStats.map((player) => (
                      <TableRow key={player.playerId}>
                          <TableCell className="pl-6">
                          <div className="flex items-center gap-3">
                              <Avatar className="h-9 w-9">
                              <AvatarImage src={player.avatar} alt={player.name} />
                              <AvatarFallback>{player.name.charAt(0)}</AvatarFallback>
                              </Avatar>
                              <Link href={`/players/${player.playerId}`} className="font-medium hover:underline">{player.name}</Link>
                          </div>
                          </TableCell>
                          <TableCell className="text-center font-mono">{player.matchesPlayed}</TableCell>
                          <TableCell className="text-center font-mono">{player.totalGoals}</TableCell>
                          <TableCell className="text-center font-mono">{player.winPercentage}%</TableCell>
                          <TableCell className="text-center font-mono">{player.totalCaptaincies}</TableCell>
                          <TableCell className="text-center font-mono">{player.totalMvp}</TableCell>
                          <TableCell className="text-center font-mono pr-6">{player.totalBestGoals}</TableCell>
                      </TableRow>
                      ))}
                      {playerStats.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                            No hay jugadores registrados.
                          </TableCell>
                        </TableRow>
                      )}
                  </TableBody>
              </Table>
          </CardContent>
      </Card>
    </div>
  );
}
