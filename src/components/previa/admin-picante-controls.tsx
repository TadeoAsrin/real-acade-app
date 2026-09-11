'use client';

import * as React from 'react';
import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';
import { Pencil, RefreshCw, Save, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useFirestore, useUser } from '@/firebase';
import { useSeason } from '@/context/season-context';
import type { Match, Player } from '@/lib/definitions';
import type { PreviaDraft } from '@/lib/previa/edition';
import { generateStories } from '@/lib/previa/story-engine';
import { generatePicante } from '@/lib/previa/picante-engine';
import { savePrevia } from '@/lib/previa/repository';

export function AdminPicanteControls() {
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();
  const { selectedSeasonId, loading: seasonLoading } = useSeason();
  const [isAdmin, setIsAdmin] = React.useState(false);
  const [editing, setEditing] = React.useState(false);
  const [text, setText] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const [message, setMessage] = React.useState('');

  React.useEffect(() => {
    let active = true;
    async function checkAdmin() {
      if (!user || !firestore) {
        if (active) setIsAdmin(false);
        return;
      }
      if (user.email === 'tadeoasrin@gmail.com') {
        if (active) setIsAdmin(true);
        return;
      }
      try {
        const role = await getDoc(doc(firestore, 'roles_admin', user.uid));
        if (active) setIsAdmin(role.exists() && role.data().isAdmin === true);
      } catch {
        if (active) setIsAdmin(false);
      }
    }
    void checkAdmin();
    return () => { active = false; };
  }, [firestore, user]);

  async function loadDraft(): Promise<PreviaDraft | null> {
    if (!selectedSeasonId) return null;
    const snapshot = await getDoc(doc(firestore, 'previa_drafts', selectedSeasonId));
    return snapshot.exists() ? snapshot.data() as PreviaDraft : null;
  }

  async function regenerate() {
    if (!selectedSeasonId || busy) return;
    setBusy(true);
    setMessage('');
    try {
      const [draft, playersSnapshot, matchesSnapshot] = await Promise.all([
        loadDraft(),
        getDocs(collection(firestore, 'players')),
        getDocs(query(collection(firestore, 'matches'), where('seasonId', '==', selectedSeasonId))),
      ]);
      if (!draft) throw new Error('No hay una Previa disponible para editar.');
      const players = playersSnapshot.docs.map(item => ({ id: item.id, ...item.data() } as Player));
      const matches = matchesSnapshot.docs.map(item => ({ id: item.id, ...item.data() } as Match));
      const generation = generateStories(players, matches, selectedSeasonId);

      let nextPicante = '';
      for (let variant = 1; variant <= 12; variant++) {
        const candidate = generatePicante(generation, variant);
        if (candidate && candidate !== draft.picante) {
          nextPicante = candidate;
          break;
        }
      }
      if (!nextPicante) throw new Error('No hay otra frase disponible para esta historia.');

      const saved = await savePrevia(firestore, { ...draft, picante: nextPicante }, 'publish');
      setText(saved.picante);
      setMessage('Picante actualizado.');
      window.location.reload();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No se pudo actualizar el Picante.');
    } finally {
      setBusy(false);
    }
  }

  async function beginEdit() {
    if (busy) return;
    setBusy(true);
    setMessage('');
    try {
      const draft = await loadDraft();
      if (!draft) throw new Error('No hay una Previa disponible para editar.');
      setText(draft.picante);
      setEditing(true);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No se pudo cargar el Picante.');
    } finally {
      setBusy(false);
    }
  }

  async function saveManual() {
    if (!selectedSeasonId || busy || !text.trim()) return;
    setBusy(true);
    setMessage('');
    try {
      const draft = await loadDraft();
      if (!draft) throw new Error('No hay una Previa disponible para editar.');
      await savePrevia(firestore, { ...draft, picante: text.trim() }, 'publish');
      setEditing(false);
      setMessage('Picante actualizado.');
      window.location.reload();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No se pudo guardar el Picante.');
    } finally {
      setBusy(false);
    }
  }

  if (isUserLoading || seasonLoading || !isAdmin || !selectedSeasonId) return null;

  return (
    <div className="mt-3 flex flex-col gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-muted-foreground/60">Solo administrador</p>
        <p className="text-xs text-muted-foreground">Ajustá únicamente la frase picante sin tocar las estadísticas de La Previa.</p>
        {message && <p className="mt-1 text-[11px] text-slate-400">{message}</p>}
      </div>

      {!editing ? (
        <div className="flex shrink-0 gap-2">
          <Button size="sm" variant="outline" disabled={busy} onClick={() => void regenerate()}>
            <RefreshCw className={`mr-2 h-3.5 w-3.5 ${busy ? 'animate-spin' : ''}`} />
            Otra frase
          </Button>
          <Button size="sm" variant="ghost" disabled={busy} onClick={() => void beginEdit()}>
            <Pencil className="mr-2 h-3.5 w-3.5" />
            Editar
          </Button>
        </div>
      ) : (
        <div className="flex w-full flex-col gap-2 sm:max-w-xl">
          <textarea
            value={text}
            onChange={event => setText(event.target.value)}
            maxLength={600}
            rows={2}
            className="w-full resize-none rounded-lg border border-white/[0.08] bg-black/20 px-3 py-2 text-sm text-slate-100 outline-none transition focus:border-red-400/40"
            aria-label="Editar frase picante"
          />
          <div className="flex justify-end gap-2">
            <Button size="sm" variant="ghost" disabled={busy} onClick={() => setEditing(false)}>
              <X className="mr-2 h-3.5 w-3.5" /> Cancelar
            </Button>
            <Button size="sm" disabled={busy || !text.trim()} onClick={() => void saveManual()}>
              <Save className="mr-2 h-3.5 w-3.5" /> Guardar
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
