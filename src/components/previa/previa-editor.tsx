'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { createDraft, chooseStory, prepareEdition, type PreviaDraft, type EditorialChoice } from '@/lib/previa/edition';
import { generateStories } from '@/lib/previa/story-engine';
import type { Match, Player } from '@/lib/definitions';
import { EditionView } from './edition-view';

const choiceLabels: Record<EditorialChoice, string> = { headline: 'Titular', secondary: 'Secundaria', available: 'Disponible', discarded: 'Descartada' };

export function PreviaEditor({ seasonId, seasonName, players, matches, initialDraft, onSave }: {
  seasonId: string; seasonName: string; players: Player[]; matches: Match[]; initialDraft: PreviaDraft | null;
  onSave: (draft: PreviaDraft, action: 'save' | 'publish') => Promise<PreviaDraft>;
}) {
  const [draft, setDraft] = React.useState(initialDraft);
  const [dirty, setDirty] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [message, setMessage] = React.useState('');
  const [error, setError] = React.useState('');
  const [preview, setPreview] = React.useState(false);
  const generation = React.useMemo(() => generateStories(players, matches, seasonId), [players, matches, seasonId]);
  React.useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ''; };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);
  function edit(next: PreviaDraft) {
    setDraft({ ...next, status: 'draft' }); setDirty(true); setMessage(''); setError(''); setPreview(false);
  }
  function generate() {
    const generated = createDraft(generation, seasonName, new Date().toISOString(), draft?.revision ?? 0);
    // Regeneration replaces automatic candidates, but keeps the one manually authored item.
    generated.picante = draft?.picante ?? '';
    edit(generated);
  }
  async function save(action: 'save' | 'publish') {
    if (!draft || busy) return;
    setError(''); setMessage('');
    try {
      prepareEdition(draft, draft.revision, draft.revision, action, new Date().toISOString());
      setBusy(true);
      const saved = await onSave(draft, action);
      setDraft(saved); setDirty(false);
      setMessage(action === 'publish' ? 'La Previa está publicada.' : 'Borrador guardado.');
    } catch (err) {
      setError(err instanceof Error && !('issues' in err) ? err.message : 'Revisá los títulos (1–180 caracteres), textos (1–2000) y el Picante (hasta 600).');
    } finally { setBusy(false); }
  }
  let previewEdition = null;
  if (draft && preview) {
    try { previewEdition = prepareEdition(draft, draft.revision, draft.revision, 'publish', new Date().toISOString()).published; } catch { /* Inline selection guidance below. */ }
  }
  return <div className="space-y-6">
    <header className="space-y-3">
      <p className="section-kicker text-primary">Redacción · {seasonName}</p>
      <h1 className="text-3xl md:text-5xl font-extrabold uppercase tracking-tight">La Previa</h1>
      <div className="flex flex-wrap gap-2 items-center">
        <Badge variant="outline">{dirty ? 'Cambios sin guardar' : draft?.status === 'published' ? 'Publicada' : 'Borrador'}</Badge>
        <p className="text-sm text-muted-foreground">{generation.seasonMatches} partidos jugados · Mínimo para porcentajes: {generation.minimumEligibleMatches} PJ</p>
      </div>
      <p className="text-sm text-muted-foreground">Elegí un titular y hasta tres secundarias. La edición pública cambia al publicar.</p>
    </header>
    {message && <p role="status" className="text-emerald-400">{message}</p>}
    {error && <p role="alert" className="text-destructive">{error}</p>}
    <div className="flex flex-wrap gap-3">
      {draft ? <AlertDialog>
        <AlertDialogTrigger asChild><Button variant="outline" disabled={busy}>Regenerar historias</Button></AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>¿Regenerar las historias?</AlertDialogTitle><AlertDialogDescription>Se reemplazarán las selecciones y ediciones de las historias del borrador. El Picante de la Fecha se conserva.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={generate}>Regenerar</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog> : <Button onClick={generate} disabled={busy}>Generar historias</Button>}
      <Button variant="outline" disabled={!draft || busy} onClick={() => void save('save')}>Guardar borrador</Button>
      <Button variant="outline" disabled={!draft || busy} onClick={() => setPreview(!preview)}>{preview ? 'Cerrar vista previa' : 'Vista previa'}</Button>
      <Button disabled={!draft || busy || !draft.stories.some(s => s.choice === 'headline')} onClick={() => void save('publish')}>{busy ? 'Guardando...' : 'Publicar La Previa'}</Button>
    </div>
    {preview && (previewEdition ? <div className="border border-primary/30 rounded-2xl p-3 space-y-3"><p className="section-kicker">Vista previa · Sin publicar</p><EditionView edition={previewEdition} /></div> : <p role="alert">Seleccioná un titular y revisá los textos para previsualizar.</p>)}
    {!draft && <p className="p-8 border border-dashed border-white/10 rounded-2xl text-muted-foreground">Generá las historias de esta temporada para comenzar la edición.</p>}
    {draft && <fieldset disabled={busy} className="space-y-5 min-w-0">
      <legend className="sr-only">Historias de La Previa</legend>
      {!draft.stories.length && <p role="status" className="text-muted-foreground">Todavía no hay historias destacadas con los datos de esta temporada. Podés guardar el borrador y generar nuevamente cuando haya más partidos.</p>}
      {draft.stories.map((story, index) => <article key={story.id} className="bg-[#111827] border border-white/[0.08] rounded-2xl p-5 space-y-4">
        <div className="flex flex-wrap justify-between gap-3 items-center">
          <div className="flex flex-wrap items-center gap-2"><h2 className="font-bold">{story.playerName}</h2><Badge variant="outline">StoryScore {story.score}</Badge><Badge variant="secondary">{story.signals.length} señales</Badge></div>
          <div className="flex items-center gap-2">
            <Label htmlFor={`choice-${index}`} className="sr-only">Selección de {story.playerName}</Label>
            <select id={`choice-${index}`} className="bg-background border border-input rounded-md p-2 text-sm" value={story.choice} onChange={e => edit(chooseStory(draft, story.id, e.target.value as EditorialChoice))}>
              {Object.entries(choiceLabels).map(([value, label]) => <option key={value} value={value} disabled={value === 'secondary' && story.choice !== 'secondary' && draft.stories.filter(s => s.choice === 'secondary').length >= 3}>{label}</option>)}
            </select>
          </div>
        </div>
        {story.choice !== 'discarded' && <>
          <div className="space-y-2"><Label htmlFor={`title-${index}`}>Título</Label><Input id={`title-${index}`} maxLength={180} value={story.title} onChange={e => edit({ ...draft, stories: draft.stories.map(s => s.id === story.id ? { ...s, title: e.target.value } : s) })} /></div>
          <div className="space-y-2"><Label htmlFor={`body-${index}`}>Texto</Label><Textarea id={`body-${index}`} rows={4} maxLength={2000} value={story.body} onChange={e => edit({ ...draft, stories: draft.stories.map(s => s.id === story.id ? { ...s, body: e.target.value } : s) })} /></div>
        </>}
        <details className="text-xs text-muted-foreground"><summary className="cursor-pointer">Datos y puntuación de origen</summary>
          <ul className="mt-3 space-y-3">{story.signals.map(signal => <li key={signal.kind}><span className="font-semibold text-foreground">{signal.title} · {signal.score} puntos</span><p className="mt-1">{signal.body}</p></li>)}</ul>
        </details>
      </article>)}
      <div className="border border-accent/20 bg-accent/5 rounded-2xl p-5 space-y-3">
        <Label htmlFor="picante" className="text-lg font-semibold text-accent">Picante de la Fecha</Label>
        <p className="text-xs text-muted-foreground">Un único comentario manual, opcional.</p>
        <Textarea id="picante" rows={3} maxLength={600} value={draft.picante} placeholder="Escribí el Picante de esta fecha..." onChange={e => edit({ ...draft, picante: e.target.value })} />
        <p className="text-xs text-muted-foreground text-right">{draft.picante.length}/600</p>
      </div>
    </fieldset>}
  </div>;
}
