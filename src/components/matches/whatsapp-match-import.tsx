'use client';

import * as React from 'react';
import { AlertTriangle, CheckCircle2, ClipboardPaste, Loader2, WandSparkles } from 'lucide-react';
import type { Player, Season } from '@/lib/definitions';
import {
  findImportedSeason,
  parseWhatsAppMatch,
  resolvePlayerName,
  sameImportedName,
  type ParsedWhatsAppMatch,
} from '@/lib/whatsapp-match-import';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

export type WhatsAppImportValue = {
  date: string;
  venue: string;
  matchNumber: number | null;
  seasonId: string;
  players: Array<{
    playerId: string;
    team: 'A' | 'B';
    goals: number;
    isCaptain: boolean;
    isMvp: boolean;
    hasBestGoal: boolean;
  }>;
};

type Props = {
  players: Player[];
  seasons: Season[];
  activeSeasonId: string | null;
  onApply: (value: WhatsAppImportValue) => void;
};

export function WhatsAppMatchImport({ players, seasons, activeSeasonId, onApply }: Props) {
  const [message, setMessage] = React.useState('');
  const [parsed, setParsed] = React.useState<ParsedWhatsAppMatch | null>(null);
  const [resolutions, setResolutions] = React.useState<Record<number, string>>({});
  const [seasonId, setSeasonId] = React.useState('');
  const [mvpPlayerId, setMvpPlayerId] = React.useState('');
  const [bestGoalPlayerId, setBestGoalPlayerId] = React.useState('');

  const analyze = () => {
    const next = parseWhatsAppMatch(message);
    const initialResolutions: Record<number, string> = {};
    next.players.forEach((row, index) => {
      const resolution = resolvePlayerName(row.sourceName, players);
      if (resolution.playerId) initialResolutions[index] = resolution.playerId;
    });
    const resolvedAward = (awardName: string | null) => {
      if (!awardName) return '';
      const rowIndex = next.players.findIndex(row => sameImportedName(awardName, row.sourceName));
      return rowIndex >= 0 ? initialResolutions[rowIndex] || '' : '';
    };
    setParsed(next);
    setResolutions(initialResolutions);
    setSeasonId(findImportedSeason(next, seasons)?.id || '');
    setMvpPlayerId(resolvedAward(next.mvpName));
    setBestGoalPlayerId(resolvedAward(next.bestGoalName));
  };

  const duplicateIds = React.useMemo(() => {
    const counts = Object.values(resolutions).reduce<Record<string, number>>((acc, id) => {
      acc[id] = (acc[id] || 0) + 1;
      return acc;
    }, {});
    return new Set(Object.entries(counts).filter(([, count]) => count > 1).map(([id]) => id));
  }, [resolutions]);

  const unresolvedCount = parsed
    ? parsed.players.filter((_, index) => !resolutions[index]).length
    : 0;
  const selectedIds = new Set(Object.values(resolutions));
  const rosterPlayerIds = new Set(Object.values(resolutions));
  const awardMissing = parsed
    ? [parsed.mvpName && !mvpPlayerId ? `MVP “${parsed.mvpName}”` : '', parsed.bestGoalName && !bestGoalPlayerId ? `mejor gol “${parsed.bestGoalName}”` : ''].filter(Boolean)
    : [];
  const awardOutsideRoster = (!!mvpPlayerId && !rosterPlayerIds.has(mvpPlayerId)) || (!!bestGoalPlayerId && !rosterPlayerIds.has(bestGoalPlayerId));
  const canApply = !!parsed?.date && !!seasonId && parsed.players.length > 0 && unresolvedCount === 0 && duplicateIds.size === 0 && awardMissing.length === 0 && !awardOutsideRoster;

  const apply = () => {
    if (!parsed?.date || !canApply) return;
    onApply({
      date: parsed.date,
      venue: parsed.venue || '',
      matchNumber: parsed.matchNumber,
      seasonId,
      players: parsed.players.map((row, index) => ({
        playerId: resolutions[index],
        team: row.team,
        goals: row.goals,
        isCaptain: row.isCaptain,
        isMvp: resolutions[index] === mvpPlayerId,
        hasBestGoal: resolutions[index] === bestGoalPlayerId,
      })),
    });
  };

  return (
    <Card className="competition-card border-emerald-500/20 bg-emerald-500/[0.03]">
      <CardHeader>
        <CardTitle className="flex items-center gap-3 font-bebas text-2xl tracking-wider uppercase">
          <ClipboardPaste className="h-5 w-5 text-emerald-400" /> Importar desde WhatsApp
        </CardTitle>
        <CardDescription>Pegá el mensaje del grupo. Nada se carga hasta que revises la vista previa y lo apliques.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <Textarea
          value={message}
          onChange={event => setMessage(event.target.value)}
          placeholder="Pegá acá el mensaje completo del partido…"
          className="min-h-40 bg-black/40 border-white/10"
        />
        <Button type="button" onClick={analyze} disabled={!message.trim()} className="bg-emerald-500 text-black hover:bg-emerald-400">
          <WandSparkles className="h-4 w-4" /> Analizar mensaje
        </Button>

        {parsed && (
          <div className="space-y-5 border-t border-white/10 pt-5">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              <PreviewDatum label="Cancha" value={parsed.venue || 'No detectada'} />
              <PreviewDatum label="Fecha" value={parsed.date || 'No detectada'} />
              <PreviewDatum label="N.º de fecha" value={parsed.matchNumber?.toString() || 'No detectado'} />
              <PreviewDatum label="Resultado" value={`${parsed.players.filter(p => p.team === 'A').reduce((s, p) => s + p.goals, 0)} - ${parsed.players.filter(p => p.team === 'B').reduce((s, p) => s + p.goals, 0)}`} />
            </div>

            <div className="space-y-2">
              <Label>Temporada</Label>
              <Select value={seasonId} onValueChange={setSeasonId}>
                <SelectTrigger className="bg-black/40 border-white/10"><SelectValue placeholder="Seleccionar temporada" /></SelectTrigger>
                <SelectContent>
                  {seasons.map(season => <SelectItem key={season.id} value={season.id}>{season.name} ({season.type} {season.year}){season.id === activeSeasonId ? ' · activa' : ''}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {(parsed.mvpName || parsed.bestGoalName) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {parsed.mvpName && <AwardSelect label={`MVP detectado: ${parsed.mvpName}`} value={mvpPlayerId} onChange={setMvpPlayerId} players={players} />}
                {parsed.bestGoalName && <AwardSelect label={`Mejor gol detectado: ${parsed.bestGoalName}`} value={bestGoalPlayerId} onChange={setBestGoalPlayerId} players={players} />}
              </div>
            )}

            <div className="space-y-2">
              {parsed.players.map((row, index) => {
                const selected = resolutions[index];
                const duplicated = !!selected && duplicateIds.has(selected);
                return (
                  <div key={`${row.sourceName}-${index}`} className="grid grid-cols-1 md:grid-cols-[1fr_auto_1.4fr] items-center gap-3 rounded-xl border border-white/10 bg-black/30 p-3">
                    <div>
                      <div className="font-bold">{row.sourceName}</div>
                      <div className="flex gap-2 mt-1">
                        <Badge className={row.team === 'A' ? 'bg-primary' : 'bg-accent'}>{row.team === 'A' ? 'AZUL' : 'ROJO'}</Badge>
                        <Badge variant="outline">{row.goals} gol{row.goals === 1 ? '' : 'es'}</Badge>
                        {row.isCaptain && <Badge className="bg-yellow-500 text-black">CAPITÁN</Badge>}
                        {sameImportedName(parsed.mvpName, row.sourceName) && <Badge className="bg-white text-black">MVP</Badge>}
                        {sameImportedName(parsed.bestGoalName, row.sourceName) && <Badge className="bg-orange-500">MEJOR GOL</Badge>}
                      </div>
                    </div>
                    {selected && !duplicated ? <CheckCircle2 className="h-5 w-5 text-emerald-400" /> : <AlertTriangle className="h-5 w-5 text-amber-400" />}
                    <Select value={selected || ''} onValueChange={value => setResolutions(current => ({ ...current, [index]: value }))}>
                      <SelectTrigger className={duplicated ? 'border-destructive' : 'bg-black/40 border-white/10'}><SelectValue placeholder="Revisar y elegir jugador" /></SelectTrigger>
                      <SelectContent>
                        {players.map(player => (
                          <SelectItem key={player.id} value={player.id} disabled={selectedIds.has(player.id) && selected !== player.id}>{player.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                );
              })}
            </div>

            {(parsed.warnings.length > 0 || unresolvedCount > 0 || duplicateIds.size > 0 || awardMissing.length > 0 || awardOutsideRoster || !seasonId) && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Revisión necesaria</AlertTitle>
                <AlertDescription>
                  {[...parsed.warnings,
                    unresolvedCount ? `${unresolvedCount} jugador(es) sin asociar.` : '',
                    duplicateIds.size ? 'Un jugador fue asociado más de una vez.' : '',
                    awardMissing.length ? `Revisá la asociación de ${awardMissing.join(' y ')}.` : '',
                    awardOutsideRoster ? 'MVP y mejor gol deben pertenecer a un jugador del partido.' : '',
                    !seasonId ? 'Seleccioná la temporada.' : '',
                  ].filter(Boolean).join(' ')}
                </AlertDescription>
              </Alert>
            )}

            <Button type="button" onClick={apply} disabled={!canApply} className="w-full h-12 font-bold uppercase tracking-wider">
              {canApply ? <CheckCircle2 className="h-4 w-4" /> : <Loader2 className="h-4 w-4" />} Aplicar al formulario
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function PreviewDatum({ label, value }: { label: string; value: string }) {
  return <div className="rounded-lg bg-black/30 border border-white/5 p-3"><div className="text-[9px] uppercase tracking-widest text-muted-foreground">{label}</div><div className="font-bold mt-1">{value}</div></div>;
}

function AwardSelect({ label, value, onChange, players }: { label: string; value: string; onChange: (value: string) => void; players: Player[] }) {
  return <div className="space-y-2"><Label>{label}</Label><Select value={value} onValueChange={onChange}><SelectTrigger className="bg-black/40 border-white/10"><SelectValue placeholder="Elegir jugador" /></SelectTrigger><SelectContent>{players.map(player => <SelectItem key={player.id} value={player.id}>{player.name}</SelectItem>)}</SelectContent></Select></div>;
}
