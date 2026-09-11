'use client';

import { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { Eye, Flame, Snowflake, Newspaper } from 'lucide-react';
import { useFirestore } from '@/firebase';
import { useSeason } from '@/context/season-context';
import type { PublishedPrevia, EditorialStory } from '@/lib/previa/edition';
import type { StorySignal } from '@/lib/previa/story-engine';

const n = (signal: StorySignal, key: string) => Number(signal.facts[key] ?? 0);

function signalText(signal: StorySignal): string {
  switch (signal.kind) {
    case 'winning-streak': return `${n(signal, 'streak')} victorias consecutivas`;
    case 'losing-streak': return `${n(signal, 'streak')} derrotas consecutivas`;
    case 'recent-goals': return `${n(signal, 'goals')} goles en ${n(signal, 'appearances')} partidos`;
    case 'mvp-form': return `${n(signal, 'mvps')} MVP en ${n(signal, 'appearances')} partidos`;
    case 'win-rate': return `${n(signal, 'wins')} triunfos en ${n(signal, 'appearances')} partidos`;
    case 'ranking-position': return n(signal, 'rank') === 1 ? `líder con ${n(signal, 'points')} puntos` : `puesto ${n(signal, 'rank')} con ${n(signal, 'points')} puntos`;
    case 'ranking-movement': return `pasó del #${n(signal, 'previousRank')} al #${n(signal, 'rank')}`;
    case 'recent-form': return `${n(signal, 'wins')} victorias, ${n(signal, 'draws')} empates y ${n(signal, 'losses')} derrotas en sus últimas ${n(signal, 'appearances')} apariciones`;
    default: return signal.body.replace(/\.$/, '');
  }
}

function storySentence(story: EditorialStory) {
  const facts = story.signals.slice(0, 3).map(signalText).filter(Boolean);
  if (!facts.length) return story.body;
  return `${story.playerName} llega con ${facts[0]}${facts[1] ? ` y ${facts[1]}` : ''}${facts[2] ? `. Además, ${facts[2]}` : ''}.`;
}

function SeasonExpanded({ seasonId }: { seasonId: string }) {
  const firestore = useFirestore();
  const [edition, setEdition] = useState<PublishedPrevia | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const published = await getDoc(doc(firestore, 'published_previas', seasonId));
        if (cancelled || !published.exists()) return;
        const data = published.data() as PublishedPrevia;
        if (data.status === 'published') setEdition(data);
      } catch (error) {
        console.error('No se pudo cargar La Previa ampliada:', error);
      }
    }
    void load();
    return () => { cancelled = true; };
  }, [firestore, seasonId]);

  if (!edition) return null;
  const coldStories = edition.coldStories ?? [];

  return (
    <article className="overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0d1422]">
      <header className="border-b border-white/[0.07] px-5 py-5 md:px-8">
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-primary"><Newspaper className="h-4 w-4" /> La Previa · {edition.seasonName}</div>
        <h1 className="mt-3 text-2xl font-black uppercase tracking-tight text-white md:text-4xl">Todo listo para la próxima batalla</h1>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-400">Los que llegan volando, los que vienen haciendo ruido y también los que necesitan cortar la malaria.</p>
      </header>

      <div className="grid md:grid-cols-2">
        <section className="border-b border-white/[0.07] px-5 py-6 md:border-r md:px-8">
          <div className="mb-3 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.18em] text-yellow-500"><Flame className="h-4 w-4" /> El que llega prendido</div>
          <h2 className="text-xl font-black uppercase text-white md:text-2xl"><span className="text-yellow-500">{edition.headline.playerName}</span>: {edition.headline.title.replace(new RegExp(`^${edition.headline.playerName}:?\\s*`, 'i'), '')}</h2>
          <p className="mt-3 text-sm font-medium leading-7 text-slate-300">{storySentence(edition.headline)} Ya no alcanza con decir que está en buen momento: llega a la fecha como el nombre que todos van a querer bajar.</p>
          {edition.picante && <div className="mt-4 flex items-start gap-2 border-t border-red-500/15 pt-3"><Flame className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-400" /><p className="text-sm font-semibold leading-6 text-slate-200">{edition.picante}</p></div>}
        </section>

        <section className="border-b border-white/[0.07] bg-orange-500/[0.025] px-5 py-6 md:px-8">
          <div className="mb-4 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.18em] text-orange-500"><Eye className="h-4 w-4" /> Los que vienen pidiendo pista</div>
          <div className="space-y-4">
            {edition.secondary.map(story => <div key={story.id}><h3 className="font-extrabold text-orange-500">{story.playerName}</h3><p className="mt-1 text-sm leading-6 text-slate-300">{storySentence(story)}</p></div>)}
          </div>
        </section>

        <section className="px-5 py-6 md:col-span-2 md:px-8">
          <div className="mb-4 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.18em] text-sky-400"><Snowflake className="h-4 w-4" /> Está fresco por acá</div>
          {coldStories.length > 0 ? (
            <div className="grid gap-5 md:grid-cols-2">
              {coldStories.map(story => (
                <div key={story.playerId} className="rounded-xl border border-sky-400/10 bg-sky-400/[0.025] p-4">
                  <h2 className="text-lg font-black uppercase text-white"><span className="text-sky-400">{story.playerName}</span> necesita reaccionar</h2>
                  <p className="mt-2 text-sm leading-7 text-slate-300">
                    {story.playerName} sumó {story.points} {story.points === 1 ? 'punto' : 'puntos'} en sus últimas {story.appearances} apariciones, con {story.losses} {story.losses === 1 ? 'derrota' : 'derrotas'}.
                    {story.losingStreak >= 2 ? ` Además, arrastra ${story.losingStreak} derrotas consecutivas.` : ''} La próxima fecha es una buena oportunidad para cortar la malaria.
                  </p>
                </div>
              ))}
            </div>
          ) : <p className="text-sm text-slate-400">Por ahora no corre tanto frío por acá. Nadie viene lo suficientemente torcido para entrar en esta sección.</p>}
        </section>
      </div>
    </article>
  );
}

export function ExpandedPrevia() {
  const { selectedSeasonId, loading } = useSeason();
  if (loading || !selectedSeasonId) return null;
  return <SeasonExpanded key={selectedSeasonId} seasonId={selectedSeasonId} />;
}
