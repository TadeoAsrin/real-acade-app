'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { createDraft, prepareEdition, type PreviaDraft } from '@/lib/previa/edition';
import { generateStories } from '@/lib/previa/story-engine';
import type { Match, Player } from '@/lib/definitions';
import { EditionView } from './edition-view';

export function PreviaEditor({ seasonId, seasonName, players, matches, initialDraft, onSave }: {
  seasonId: string;
  seasonName: string;
  players: Player[];
  matches: Match[];
  initialDraft: PreviaDraft | null;
  onSave: (draft: PreviaDraft, action: 'save' | 'publish') => Promise<PreviaDraft>;
}) {
  const generation = React.useMemo(() => generateStories(players, matches, seasonId), [players, matches, seasonId]);
  const [draft, setDraft] = React.useState<PreviaDraft | null>(() =>
    initialDraft ?? createDraft(generation, seasonName, new Date().toISOString(), 0),
  );
  const [dirty, setDirty] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [message, setMessage] = React.useState('');
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  function edit(next: PreviaDraft) {
    setDraft({ ...next, status: 'draft' });
    setDirty(true);
    setMessage('');
    setError('');
  }

  function refreshFromData() {
    const generated = createDraft(generation, seasonName, new Date().toISOString(), draft?.revision ?? 0);
    generated.picante = draft?.picante ?? '';
    edit(generated);
  }

  async function save(action: 'save' | 'publish') {
    if (!draft || busy) return;
    setError('');
    setMessage('');
    try {
      prepareEdition(draft, draft.revision, draft.revision, action, new Date().toISOString());
      setBusy(true);
      const saved = await onSave(draft, action);
      setDraft(saved);
      setDirty(false);
      setMessage(action === 'publish' ? 'La Previa está publicada.' : 'Borrador guardado.');
    } catch (err) {
      setError(err instanceof Error && !('issues' in err) ? err.message : 'No se pudo guardar La Previa. Revisá los datos e intentá de nuevo.');
    } finally {
      setBusy(false);
    }
  }

  let previewEdition = null;
  if (draft) {
    try {
      previewEdition = prepareEdition(draft, draft.revision, draft.revision, 'publish', new Date().toISOString()).published;
    } catch {
      previewEdition = null;
    }
  }

  return (
    <div className="space-y-6">
      <header className="space-y-3">
        <p className="section-kicker text-primary">Redacción · {seasonName}</p>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold uppercase tracking-tight md:text-5xl">La Previa</h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Real Acade analiza la temporada y arma automáticamente la mejor previa disponible. Vos solo agregás el Picante y publicás.
            </p>
          </div>
          <Badge variant="outline">{dirty ? 'Cambios sin guardar' : draft?.status === 'published' ? 'Publicada' : 'Lista para revisar'}</Badge>
        </div>
      </header>

      {message && <p role="status" className="text-emerald-400">{message}</p>}
      {error && <p role="alert" className="text-destructive">{error}</p>}

      {!previewEdition && (
        <div className="rounded-2xl border border-dashed border-white/10 p-8 text-muted-foreground">
          Todavía no hay suficientes datos para construir una previa destacada.
        </div>
      )}

      {previewEdition && <EditionView edition={previewEdition} />}

      {draft && (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/[0.04] p-5 space-y-3">
          <Label htmlFor="picante" className="text-lg font-semibold text-red-400">🌶️ Picante de la Fecha</Label>
          <p className="text-xs text-muted-foreground">Comentario manual y opcional. Acá entra lo que solo sabe el grupo.</p>
          <Textarea
            id="picante"
            rows={3}
            maxLength={280}
            value={draft.picante}
            placeholder="Ej: Hoy la pelota no se esconde..."
            onChange={e => edit({ ...draft, picante: e.target.value })}
          />
          <p className="text-right text-xs text-muted-foreground">{draft.picante.length}/280</p>
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        <Button variant="outline" disabled={busy} onClick={refreshFromData}>Actualizar con datos</Button>
        <Button variant="outline" disabled={!draft || busy} onClick={() => void save('save')}>Guardar borrador</Button>
        <Button disabled={!previewEdition || busy} onClick={() => void save('publish')}>
          {busy ? 'Publicando...' : 'Publicar La Previa'}
        </Button>
      </div>

      <details className="text-xs text-muted-foreground">
        <summary className="cursor-pointer">Ver diagnóstico del motor</summary>
        <div className="mt-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 space-y-1">
          <p>{generation.seasonMatches} partidos jugados</p>
          <p>{generation.candidates.length} historias analizadas</p>
          <p>Mínimo para métricas porcentuales: {generation.minimumEligibleMatches} PJ</p>
        </div>
      </details>
    </div>
  );
}
