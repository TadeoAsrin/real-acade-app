
'use client';

import * as React from 'react';
import { useCollection, useMemoFirebase, useFirestore, useUser, useDoc } from "@/firebase";
import { collection, doc, query, orderBy, serverTimestamp, setDoc } from "firebase/firestore";
import type { Player, Match } from "@/lib/definitions";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getInitials, cn } from "@/lib/utils";
import { Loader2, Swords, UserPlus, Trophy, Share2, Copy } from "lucide-react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function NewDraftPage() {
  const firestore = useFirestore();
  const { user } = useUser();
  const router = useRouter();
  const { toast } = useToast();

  const [selectedPlayerIds, setSelectedPlayerIds] = React.useState<string[]>([]);
  const [capAId, setCapAId] = React.useState<string>("");
  const [capBId, setCapBId] = React.useState<string>("");
  const [isCreating, setIsCreating] = React.useState(false);

  const playersRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'players'), orderBy('name', 'asc'));
  }, [firestore]);

  const adminRoleRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'roles_admin', user.uid);
  }, [firestore, user]);

  const { data: players, isLoading: playersLoading } = useCollection<Player>(playersRef);
  const { data: adminRole } = useDoc<{isAdmin: boolean}>(adminRoleRef);

  if (playersLoading) return <div className="flex h-[50vh] items-center justify-center"><Loader2 className="animate-spin" /></div>;
  if (!adminRole?.isAdmin) return <div className="p-10 text-center">Acceso restringido. Solo para administradores.</div>;

  const handleTogglePlayer = (id: string) => {
    setSelectedPlayerIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleCreateDraft = async () => {
    if (!firestore || selectedPlayerIds.length !== 14 || !capAId || !capBId) return;
    
    setIsCreating(true);
    const draftId = Math.random().toString(36).substring(2, 15);
    const draftRef = doc(firestore, 'drafts', draftId);

    const playerList = (players || []).filter(p => selectedPlayerIds.includes(p.id));
    const capA = playerList.find(p => p.id === capAId)!;
    const capB = playerList.find(p => p.id === capBId)!;
    const remaining = playerList.filter(p => p.id !== capAId && p.id !== capBId);

    await setDoc(draftRef, {
      id: draftId,
      date: new Date().toISOString(),
      status: 'pending',
      captainA: capA,
      captainB: capB,
      availablePlayers: remaining,
      teamAPlayers: [capA],
      teamBPlayers: [capB],
      picks: [],
      createdAt: serverTimestamp()
    });

    toast({ title: "Draft Creado", description: "El pan y queso está listo para empezar." });
    router.push(`/drafts/${draftId}`);
  };

  const selectedPlayers = (players || []).filter(p => selectedPlayerIds.includes(p.id));

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-end gap-4">
        <div>
          <h1 className="text-4xl font-black uppercase italic tracking-tighter flex items-center gap-3">
            <Swords className="h-10 w-10 text-primary" />
            Configurar Pan y Queso
          </h1>
          <p className="text-muted-foreground">Selecciona a los 14 jugadores y define a los capitanes.</p>
        </div>
        <Button 
          onClick={handleCreateDraft} 
          disabled={selectedPlayerIds.length !== 14 || !capAId || !capBId || isCreating}
          size="lg"
          className="font-black uppercase italic"
        >
          {isCreating ? <Loader2 className="animate-spin mr-2" /> : "Iniciar Draft"}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>1. Seleccionar Plantilla (14/14)</CardTitle>
            <CardDescription>Marca a los que juegan hoy.</CardDescription>
          </CardHeader>
          <CardContent className="max-h-[500px] overflow-y-auto space-y-2">
            {players?.map(p => (
              <div 
                key={p.id} 
                className={cn(
                  "flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer",
                  selectedPlayerIds.includes(p.id) ? "bg-primary/10 border-primary/40" : "bg-white/5 border-transparent"
                )}
                onClick={() => handleTogglePlayer(p.id)}
              >
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-[10px] font-black">{getInitials(p.name)}</AvatarFallback>
                  </Avatar>
                  <span className="font-bold text-sm">{p.name}</span>
                </div>
                <Checkbox checked={selectedPlayerIds.includes(p.id)} />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle>2. Definir Capitanes</CardTitle>
            <CardDescription>Los que armarán los equipos.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Capitán Equipo Azul (Elige 1º)</label>
              <Select onValueChange={setCapAId} value={capAId}>
                <SelectTrigger className="font-bold">
                  <SelectValue placeholder="Seleccionar Capitán A" />
                </SelectTrigger>
                <SelectContent>
                  {selectedPlayers.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Capitán Equipo Rojo (Elige 2º)</label>
              <Select onValueChange={setCapBId} value={capBId}>
                <SelectTrigger className="font-bold">
                  <SelectValue placeholder="Seleccionar Capitán B" />
                </SelectTrigger>
                <SelectContent>
                  {selectedPlayers.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedPlayerIds.length !== 14 && (
              <div className="p-4 bg-orange-500/10 border border-orange-500/20 rounded-xl text-orange-500 text-xs font-bold text-center">
                Debes seleccionar exactamente 14 jugadores.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
