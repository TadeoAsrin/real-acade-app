import { Eye, Flame, Newspaper } from 'lucide-react';
import type { PublishedPrevia } from '@/lib/previa/edition';

export function EditionView({ edition }: { edition: PublishedPrevia }) {
  return (
    <section aria-label="La Previa publicada" className="relative z-10 space-y-4">
      <article className="overflow-hidden rounded-3xl border border-white/[0.08] bg-[#0d1422] shadow-2xl">
        <div className="border-b border-white/[0.07] px-5 py-4 md:px-7">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.22em] text-primary">
              <Newspaper className="h-4 w-4" />
              <span>La Previa · {edition.seasonName}</span>
            </div>
            <p className="text-xs text-muted-foreground">
              {new Date(edition.publishedAt).toLocaleDateString('es-AR', { timeZone: 'America/Argentina/Cordoba' })}
            </p>
          </div>
        </div>

        <div className="space-y-4 px-5 py-7 md:px-8 md:py-9">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-orange-400">🔥 Historia de la fecha</p>
          <h2 className="max-w-4xl text-3xl font-black uppercase leading-[0.96] tracking-tight text-white md:text-5xl">
            {edition.headline.title}
          </h2>
          <p className="max-w-3xl text-lg font-medium leading-relaxed text-slate-300 md:text-xl">
            {edition.headline.body}
          </p>
        </div>

        {!!edition.secondary.length && (
          <div className="border-t border-white/[0.07] bg-white/[0.02] px-5 py-5 md:px-8">
            <div className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
              <Eye className="h-4 w-4" /> Para mirar esta fecha
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {edition.secondary.slice(0, 2).map(story => (
                <article key={story.id} className="rounded-2xl border border-white/[0.07] bg-black/10 p-4">
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-primary">{story.playerName}</p>
                  <h3 className="text-base font-extrabold text-white">{story.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-slate-400">{story.body}</p>
                </article>
              ))}
            </div>
          </div>
        )}
      </article>

      {edition.picante && (
        <aside className="rounded-2xl border border-red-500/20 bg-red-500/[0.05] p-5">
          <h3 className="mb-2 flex items-center gap-2 font-bold text-red-400">
            <Flame className="h-5 w-5" /> 🌶️ Picante de la Fecha
          </h3>
          <p className="text-sm font-medium leading-relaxed text-slate-200">{edition.picante}</p>
        </aside>
      )}
    </section>
  );
}
