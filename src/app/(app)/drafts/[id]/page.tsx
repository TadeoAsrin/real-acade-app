'use client';

import * as React from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { useDoc, useMemoFirebase, useFirestore, updateDocumentNonBlocking, useUser } from "@/firebase";
import { doc, setDoc, deleteDoc, collection, serverTimestamp } from "firebase/firestore";
import type { Draft, Player, PlayerStats } from "@/lib/definitions";
import { Loader2, Swords, Shield, Zap, Share2, Trophy, Copy, AlertCircle, CheckCircle2, MessageCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getInitials, cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

export default function DraftDetailPage() {
  const { id } = useParams();
  const searchParams = useSearchParams();
  const capType = searchParams.get('cap') as 'A' | 'B' | null;
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  const [isMounted, setIsMounted] = React.useState(false);

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  const draftRef = useMemoFirebase(() => {
    if (!firestore || !id) return null;
    return doc(firestore, 'drafts', id as string);
  }, [firestore, id]);

  const adminRoleRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'roles_admin', user.uid);
  }, [firestore, user]);

  const { data: draft, isLoading } = useDoc<Draft>(draftRef);
  const { data: adminRole } = useDoc<{isAdmin: boolean}>(adminRoleRef);

  if (!isMounted || isLoading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin h-10 w-10 text-primary" /></div>;
  if (!draft) return <div className="p-10 text-center">Draft no encontrado.</div>;

  const currentPickCount = draft.picks.length;
  
  // Turn logic: A (1), B (2), then A, B, A, B...
  let whoseTurn: 'A' | 'B' = 'A';
  let picksLeftInTurn = 1;

  if (currentPickCount === 0) {
    whoseTurn = 'A';
    picksLeftInTurn = 1;
  } else if (currentPickCount === 1 || currentPickCount === 2) {
    whoseTurn = 'B';
    picksLeftInTurn = currentPickCount === 1 ? 2 : 1;
  } else {
    whoseTurn = currentPickCount % 2 === 1 ? 'A' : 'B';
    picksLeftInTurn = 1;
  }

  const isMyTurn = capType === whoseTurn;
  const isFinished = draft.availablePlayers.length === 0;
  
  const isAdmin = adminRole?.isAdmin;

  const handlePick = (player: Player) => {
    if (!isMyTurn || isFinished || !firestore) return;

    let newPicks = [...draft.picks, { playerId: player.id, captain: whoseTurn }];
    let newAvailable = draft.availablePlayers.filter(p => p.id !== player.id);
    let newTeamA = whoseTurn === 'A' ? [...draft.teamAPlayers, player] : draft.teamAPlayers;
    let newTeamB = whoseTurn === 'B' ? [...draft.teamBPlayers, player] : draft.teamBPlayers;

    // Automatic assignment of the very last player
    if (newAvailable.length === 1) {
      const lastPlayer = newAvailable[0];
      const nextPickCount = newPicks.length;
      let nextTurn: 'A' | 'B' = 'A';
      
      if (nextPickCount === 1 || nextPickCount === 2) {
        nextTurn = 'B';
      } else {
        nextTurn = nextPickCount % 2 === 1 ? 'A' : 'B';
      }

      newPicks.push({ playerId: lastPlayer.id, captain: nextTurn });
      newAvailable = [];
      if (nextTurn === 'A') newTeamA.push(lastPlayer);
      else newTeamB.push(lastPlayer);
    }

    updateDocumentNonBlocking(draftRef!, {
      picks: newPicks,
      availablePlayers: newAvailable,
      teamAPlayers: newTeamA,
      teamBPlayers: newTeamB,
      status: newAvailable.length === 0 ? 'completed' : 'pending'
    });

    toast({ title: "¡Elegido!", description: `${player.name} ahora es del equipo ${whoseTurn === 'A' ? 'Azul' : 'Rojo'}.` });
  };

  const copyLink = (type: 'A' | 'B') => {
    const url = `${window.location.origin}/drafts/${id}?cap=${type}`;
    navigator.clipboard.writeText(url);
    toast({ title: "Link Copiado", description: `Enviá este link al Capitán ${type === 'A' ? 'Azul' : 'Rojo'}.` });
  };

  const shareToWhatsApp = () => {
    const text = `⚽ *PAN Y QUESO - REAL ACADE* ⚽\n\n` +
      `🔵 *EQUIPO AZUL* (Cap. ${draft.captainA.name.split(' ')[0]})\n` +
      draft.teamAPlayers.map((p, i) => `${i+1}. ${p.name}`).join('\n') +
      `\n\n🔴 *EQUIPO ROJO* (Cap. ${draft.captainB.name.split(' ')[0]})\n` +
      draft.teamBPlayers.map((p, i) => `${i+1}. ${p.name}`).join('\n') +
      `\n\n🔥 *¡Nos vemos en la cancha!*`;
    
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const handleConvertToMatch = async () => {
    if (!firestore || !isAdmin) return;

    const matchRef = doc(collection(firestore, 'matches'));
    const teamAPlayers: PlayerStats[] = draft.teamAPlayers.map(p => ({
      playerId: p.id,
      goals: 0,
      isCaptain: p.id === draft.captainA.id
    }));
    const teamBPlayers: PlayerStats[] = draft.teamBPlayers.map(p => ({
      playerId: p.id,
      goals: 0,
      isCaptain: p.id === draft.captainB.id
    }));

    await setDoc(matchRef, {
      date: new Date().toISOString(),
      teamAScore: 0,
      teamBScore: 0,
      teamAPlayers,
      teamBPlayers,
      createdAt: serverTimestamp()
    });

    await deleteDoc(draftRef!);
    toast({ title: "Partido Creado", description: "El draft ha sido convertido en un partido oficial." });
    window.location.href = '/matches';
  };

  return (
    <div className="flex flex-col gap-8 max-w-6xl mx-auto pb-20">
      
      {/* Header & Links (Admin Only) */}
      {isAdmin && !isFinished && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Button variant="outline" className="h-16 border-primary/20 bg-primary/5 hover:bg-primary/10" onClick={() => copyLink('A')}>
            <Share2 className="mr-2 h-5 w-5 text-primary" />
            <div className="flex flex-col items-start">
              <span className="text-[10px] font-black uppercase">Capitán Azul</span>
              <span className="text-sm font-bold">Copiar link de invitación</span>
            </div>
          </Button>
          <Button variant="outline" className="h-16 border-accent/20 bg-accent/5 hover:bg-accent/10" onClick={() => copyLink('B')}>
            <Share2 className="mr-2 h-5 w-5 text-accent" />
            <div className="flex flex-col items-start">
              <span className="text-[10px] font-black uppercase">Capitán Rojo</span>
              <span className="text-sm font-bold">Copiar link de invitación</span>
            </div>
          </Button>
        </div>
      )}

      {/* Status Banner */}
      <div className={cn(
        "p-6 rounded-2xl border-2 flex flex-col md:flex-row items-center justify-between gap-4 animate-in fade-in slide-in-from-top-4",
        isFinished ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-500" :
        isMyTurn ? (capType === 'A' ? "bg-primary border-primary text-white shadow-[0_0_30px_rgba(59,130,246,0.3)]" : "bg-accent border-accent text-white shadow-[0_0_30px_rgba(244,63,94,0.3)]") : 
        "bg-white/5 border-white/10 text-muted-foreground"
      )}>
        <div className="flex items-center gap-4">
          {isFinished ? <CheckCircle2 className="h-8 w-8" /> : isMyTurn ? <Zap className="h-8 w-8 animate-pulse" /> : <Loader2 className="h-8 w-8 animate-spin" />}
          <div>
            <h2 className="text-2xl font-black uppercase italic tracking-tighter">
              {isFinished ? "¡Equipos Armados!" : isMyTurn ? "🔥 ¡TU TURNO!" : "⏳ ESPERANDO RIVAL..."}
            </h2>
            <p className="text-sm font-bold opacity-80 uppercase tracking-widest">
              {isFinished ? "Ya pueden saltar a la cancha" : isMyTurn ? `Elegí a ${picksLeftInTurn} crack${picksLeftInTurn > 1 ? 's' : ''}` : "El otro capitán está pensando..."}
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          {isFinished && isAdmin && (
            <Button onClick={shareToWhatsApp} className="bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase italic px-6">
              <MessageCircle className="mr-2 h-5 w-5" />
              Calentar el Partido
            </Button>
          )}
          {isFinished && isAdmin && (
            <Button onClick={handleConvertToMatch} className="bg-white text-black hover:bg-white/90 font-black uppercase italic px-6">
              Confirmar Partido
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Team Azul */}
        <Card className="lg:col-span-3 glass-card border-primary/20 bg-primary/5">
          <CardHeader className="text-center pb-2">
            <Badge className="mx-auto mb-2 bg-primary">Equipo Azul</Badge>
            <CardTitle className="text-2xl font-black italic">{draft.captainA.name.split(' ')[0]}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {draft.teamAPlayers.map((p, i) => (
              <div key={p.id} className="flex items-center gap-3 p-2 bg-white/5 rounded-lg border border-white/5">
                <span className="text-[10px] font-black text-primary/40 w-4">#{i+1}</span>
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="text-[10px] font-black bg-primary/20">{getInitials(p.name)}</AvatarFallback>
                </Avatar>
                <span className="font-bold text-sm truncate">{p.name}</span>
              </div>
            ))}
            {Array.from({ length: 7 - draft.teamAPlayers.length }).map((_, i) => (
              <div key={i} className="h-12 border-2 border-dashed border-white/5 rounded-lg flex items-center justify-center opacity-20">
                <Shield className="h-4 w-4" />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Available Players (Market) */}
        <div className="lg:col-span-6 space-y-4">
          <h3 className="text-xs font-black uppercase tracking-[0.3em] text-center text-muted-foreground/50 italic">Mercado de Pases</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {draft.availablePlayers.length > 0 ? draft.availablePlayers.map(p => (
              <Card 
                key={p.id} 
                className={cn(
                  "group transition-all cursor-pointer relative overflow-hidden",
                  isMyTurn ? "hover:border-primary hover:scale-105 active:scale-95" : "opacity-50 grayscale pointer-events-none"
                )}
                onClick={() => handlePick(p)}
              >
                <CardContent className="p-4 flex items-center gap-4">
                  <Avatar className="h-12 w-12 border-2 border-white/10 group-hover:border-primary/50 transition-colors">
                    <AvatarFallback className="font-black">{getInitials(p.name)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="font-black text-lg uppercase truncate italic leading-none">{p.name}</p>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase mt-1">{p.position || 'Cualquier Posición'}</p>
                  </div>
                  {isMyTurn && <Zap className="ml-auto h-5 w-5 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />}
                </CardContent>
              </Card>
            )) : (
              <div className="col-span-full h-40 flex flex-col items-center justify-center border-2 border-dashed rounded-3xl opacity-30 text-center">
                <Swords className="h-12 w-12 mb-2" />
                <p className="font-bold uppercase italic">Todos los cracks han sido elegidos</p>
              </div>
            )}
          </div>
        </div>

        {/* Team Rojo */}
        <Card className="lg:col-span-3 glass-card border-accent/20 bg-accent/5">
          <CardHeader className="text-center pb-2">
            <Badge className="mx-auto mb-2 bg-accent">Equipo Rojo</Badge>
            <CardTitle className="text-2xl font-black italic">{draft.captainB.name.split(' ')[0]}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {draft.teamBPlayers.map((p, i) => (
              <div key={p.id} className="flex items-center gap-3 p-2 bg-white/5 rounded-lg border border-white/5">
                <span className="text-[10px] font-black text-accent/40 w-4">#{i+1}</span>
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="text-[10px] font-black bg-accent/20">{getInitials(p.name)}</AvatarFallback>
                </Avatar>
                <span className="font-bold text-sm truncate">{p.name}</span>
              </div>
            ))}
            {Array.from({ length: 7 - draft.teamBPlayers.length }).map((_, i) => (
              <div key={i} className="h-12 border-2 border-dashed border-white/5 rounded-lg flex items-center justify-center opacity-20">
                <Shield className="h-4 w-4" />
              </div>
            ))}
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
