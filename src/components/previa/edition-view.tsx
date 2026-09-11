import { Flame, Newspaper } from 'lucide-react';
import type { PublishedPrevia } from '@/lib/previa/edition';

export function EditionView({ edition }: { edition: PublishedPrevia }) {
  return (
    <section aria-label="La Previa publicada" className="space-y-5 relative z-10">
      <div className="cinematic-banner p-5 md:p-10 space-y-5">
        <div className="flex flex-wrap items-center gap-3 text-xs font-semibold uppercase tracking-widest text-primary">
          <Newspaper className="h-5 w-5" /><span>La Previa</span>
          <span className="text-muted-foreground">{edition.seasonName}</span>
        </div>
        <p className="text-xs text-muted-foreground">Edición publicada · {new Date(edition.publishedAt).toLocaleDateString('es-AR', { timeZone: 'America/Argentina/Cordoba' })}</p>
        <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight uppercase text-white break-words">{edition.headline.title}</h2>
        <p className="text-base md:text-lg text-muted-foreground leading-relaxed whitespace-pre-line break-words max-w-4xl">{edition.headline.body}</p>
      </div>
      {!!edition.secondary.length && <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {edition.secondary.map(story => <article key={story.id} className="bg-[#111827] border border-white/[0.06] rounded-2xl p-5 space-y-3 min-w-0">
          <p className="section-kicker text-primary">{story.playerName}</p>
          <h3 className="text-xl font-bold tracking-tight break-words">{story.title}</h3>
          <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line break-words">{story.body}</p>
        </article>)}
      </div>}
      {edition.picante && <aside className="rounded-2xl border border-accent/25 bg-accent/5 p-5 space-y-3">
        <h3 className="flex items-center gap-2 text-accent font-semibold"><Flame className="h-5 w-5" />Picante de la Fecha</h3>
        <p className="text-sm leading-relaxed whitespace-pre-line break-words">{edition.picante}</p>
      </aside>}
    </section>
  );
}
