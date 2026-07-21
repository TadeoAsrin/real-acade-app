'use client';

import * as React from 'react';
import { useFirestore, useCollection, useMemoFirebase, useUser, useDoc, addDocumentNonBlocking } from '@/firebase';
import { collection, query, orderBy, doc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import type { Player, AppSettings } from '@/lib/definitions';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Save, Goal, UserPlus, Trash2 } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';

export default function NewMatchPage() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const router = useRouter();

  const [date, setDate] = React.useState(new Date().toISOString().split('T')[0]);
  const [teamAScore, setTeamAScore] = React.useState(0);
  const [teamBScore, setTeamBScore] = React.useState(0);
  const [teamAPlayers, setTeamAPlayers] = React.useState<{playerId: string, goals: number, isMvp: boolean, hasBestGoal: boolean}[]>([]);
  const [teamBPlayers, setTeamBPlayers] = React.useState<{playerId: string, goals: number, isMvp: boolean, hasBestGoal: boolean}[]>([]);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const settingsRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, 'app_settings', 'global');
  }, [firestore]);

  const { data: settings } = useDoc<AppSettings>(settingsRef);
  const activeSeasonId = settings?.activeSeasonId;

  const playersRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'players'), orderBy('name', 'asc'));
  }, [firestore]);

  const { data: players } = useCollection<Player>(playersRef);

  const handleAddPlayer = (team: 'A' | 'B') => {
    const newPlayer = { playerId: '', goals: 0, isMvp: false, hasBestGoal: false };
    if (team === 'A') setTeamAPlayers([...teamAPlayers, newPlayer]);
    else setTeamBPlayers([...teamBPlayers, newPlayer]);
  };

  const handleRemovePlayer = (team: 'A' | 'B', index: number) => {
    if (team === 'A') setTeamAPlayers(teamAPlayers.filter((_, i) => i !== index));
    else setTeamBPlayers(teamBPlayers.filter((_, i) => i !== index));
  };

  const handlePlayerChange = (team: 'A' | 'B', index: number, field: string, value: any) => {
    const list = team === 'A' ? [...teamAPlayers] : [...teamBPlayers];
    list[index] = { ...list[index], [field]: value };
    if (team === 'A') setTeamAPlayers(list);
    else setTeamBPlayers(list);
  };

  const handleSubmit = async () => {
    if (!firestore || !activeSeasonId) return;
    if (teamAPlayers.some(p => !p.playerId) || teamBPlayers.some(p => !p.playerId)) {
      toast({ variant: "destructive", title: "Error", description: "Todos los jugadores deben ser seleccionados." });
      return;
    }

    setIsSubmitting(true);
    try {
      const matchData = {
        seasonId: activeSeasonId,
        date: new Date(date).toISOString(),
        teamAScore,
        teamBScore,
        teamAPlayers,
        teamBPlayers,
        createdAt: new Date().toISOString(),
      };

      await addDocumentNonBlocking(collection(firestore, 'matches'), matchData);
      
      toast({ title: "Victoria!", description: "El partido ha sido registrado oficialmente." });
      router.push('/matches');
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message });
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-4 lg:p-8 space-y-8 animate-in fade-in duration-700">
      <div className="space-y-1">
        <h2 className="text-4xl lg:text-7xl font-black uppercase tracking-tighter italic text-white flex items-center gap-4">
          <Goal className="h-8 w-8 lg:h-14 lg:w-14 text-primary shrink-0" />
          NUEVO ENCUENTRO
        </h2>
        <p className="text-[10px] lg:text-xs font-black uppercase tracking-[0.4em] text-primary/60 ml-1">
          CARGA DE RESULTADOS OFICIALES • TEMPORADA {activeSeasonId?.substring(0, 8) || '...'}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <Card className="competition-card">
            <CardHeader className="bg-primary/5 border-b border-white/5">
              <CardTitle className="text-primary font-bebas tracking-widest">EQUIPO AZUL</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">GOLES TOTALES</Label>
                    <Input type="number" value={teamAScore} onChange={(e) => setTeamAScore(parseInt(e.target.value))} className="bg-black/40 h-14 text-3xl font-bebas" />
                 </div>
              </div>
              <div className="space-y-4">
                {teamAPlayers.map((p, i) => (
                  <div key={i} className="flex flex-col md:flex-row gap-4 p-4 bg-white/5 rounded-xl border border-white/5">
                    <div className="flex-1">
                      <select 
                        value={p.playerId} 
                        onChange={(e) => handlePlayerChange('A', i, 'playerId', e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-lg h-10 px-3 text-sm font-bold uppercase"
                      >
                        <option value="">Seleccionar Jugador</option>
                        {players?.map(pl => (
                          <option key={pl.id} value={pl.id}>{pl.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="w-20">
                        <Input type="number" value={p.goals} onChange={(e) => handlePlayerChange('A', i, 'goals', parseInt(e.target.value))} placeholder="G" className="text-center font-bold" />
                      </div>
                      <div className="flex items-center gap-2">
                        <Checkbox checked={p.isMvp} onCheckedChange={(val) => handlePlayerChange('A', i, 'isMvp', val)} />
                        <span className="text-[8px] font-black uppercase text-yellow-500">MVP</span>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => handleRemovePlayer('A', i)} className="text-destructive hover:bg-destructive/10">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                <Button variant="outline" onClick={() => handleAddPlayer('A')} className="w-full border-dashed border-white/10 text-muted-foreground">
                  <UserPlus className="h-4 w-4 mr-2" /> AÑADIR JUGADOR AZUL
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="competition-card">
            <CardHeader className="bg-accent/5 border-b border-white/5">
              <CardTitle className="text-accent font-bebas tracking-widest">EQUIPO ROJO</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">GOLES TOTALES</Label>
                    <Input type="number" value={teamBScore} onChange={(e) => setTeamBScore(parseInt(e.target.value))} className="bg-black/40 h-14 text-3xl font-bebas" />
                 </div>
              </div>
              <div className="space-y-4">
                {teamBPlayers.map((p, i) => (
                  <div key={i} className="flex flex-col md:flex-row gap-4 p-4 bg-white/5 rounded-xl border border-white/5">
                    <div className="flex-1">
                      <select 
                        value={p.playerId} 
                        onChange={(e) => handlePlayerChange('B', i, 'playerId', e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-lg h-10 px-3 text-sm font-bold uppercase"
                      >
                        <option value="">Seleccionar Jugador</option>
                        {players?.map(pl => (
                          <option key={pl.id} value={pl.id}>{pl.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="w-20">
                        <Input type="number" value={p.goals} onChange={(e) => handlePlayerChange('B', i, 'goals', parseInt(e.target.value))} placeholder="G" className="text-center font-bold" />
                      </div>
                      <div className="flex items-center gap-2">
                        <Checkbox checked={p.isMvp} onCheckedChange={(val) => handlePlayerChange('B', i, 'isMvp', val)} />
                        <span className="text-[8px] font-black uppercase text-yellow-500">MVP</span>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => handleRemovePlayer('B', i)} className="text-destructive hover:bg-destructive/10">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                <Button variant="outline" onClick={() => handleAddPlayer('B')} className="w-full border-dashed border-white/10 text-muted-foreground">
                  <UserPlus className="h-4 w-4 mr-2" /> AÑADIR JUGADOR ROJO
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-8">
           <Card className="competition-card">
              <CardHeader>
                 <CardTitle className="text-lg font-bebas tracking-widest">DETALLES</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                 <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">FECHA DEL ENCUENTRO</Label>
                    <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
                 </div>
              </CardContent>
              <CardContent className="pt-0">
                 <Button onClick={handleSubmit} disabled={isSubmitting} className="w-full h-16 font-bebas text-2xl tracking-widest shadow-xl shadow-primary/20">
                    {isSubmitting ? <Loader2 className="h-6 w-6 animate-spin mr-2" /> : <Save className="h-6 w-6 mr-2" />}
                    FINALIZAR CARGA
                 </Button>
              </CardContent>
           </Card>
        </div>
      </div>
    </div>
  );
}
