import { Eye, Flame, Newspaper } from 'lucide-react';
import type { PublishedPrevia } from '@/lib/previa/edition';

function compactFact(text: string) {
  return text
    .replace(/^Acumula\s+/i, '')
    .replace(/\s+en sus participaciones de esta temporada\.?/i, '')
    .replace(/Recibió\s+(\d+)\s+premios? MVP en sus\s+(\d+)\s+participaciones de ese período\.?/i, '$1 MVP en las últimas $2.')
    .replace(/Marcó\s+(\d+)\s+goles en\s+(\d+)\s+participaciones dentro de las últimas cinco fechas jugadas\.?/i, '$1 goles en las últimas $2.')
    .replace(/En las últimas cinco fechas jugadas participó\s+(\d+)\s+veces:\s*(\d+)\s+victorias?,\s*(\d+)\s+empates? y\s*(\d+)\s+derrotas?\.?/i, '$2G · $3E · $4P en las últimas $1.')
    .trim();
}

function firstPunch(body: string) {
  const parts = body.split(/(?<=\.)\s+/).map(compactFact).filter(Boolean);
  return parts.slice(0, 2).join(' · ').replace(/\.\s*·/g, ' ·').replace(/\.$/, '');
}

/**
 * The headline already spends the strongest fact in its title. Its subtitle
 * must earn its place with a different signal instead of translating the same
 * stat ("6 al hilo" -> "6 consecutivas"). Secondary stories keep both facts
 * because their title is not rendered in the compact list.
 */
function headlineSupport(edition: PublishedPrevia): string {
  const supportingSignals = edition.headline.signals.slice(1);
  if (supportingSignals.length) {
    return firstPunch(supportingSignals.slice(0, 2).map(signal => signal.body).join(' '));
  }
  return '';
}

export function EditionView({ edition }: { edition: PublishedPrevia }) {
  const support = headlineSupport(edition);

  return (
    <article aria-label="La Previa publicada" className="relative z-10 overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0d1422]">
      <div className="flex items-center justify-between gap-3 border-b border-white/[0.07] px-5 py-3">
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-primary">
          <Newspaper className="h-3.5 w-3.5" />
          <span>La Previa · {edition.seasonName}</span>
        </div>
        <span className="text-[10px] text-muted-foreground">{new Date(edition.publishedAt).toLocaleDateString('es-AR', { timeZone: 'America/Argentina/Cordoba' })}</span>
      </div>

      <div className="grid gap-0 lg:grid-cols-[1.45fr_1fr]">
        <section className="px-5 py-5 md:px-7">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-orange-400">🔥 Historia de la fecha</p>
          <h2 className="text-2xl font-black uppercase leading-none tracking-tight text-white md:text-3xl">{edition.headline.title}</h2>
          {support && <p className="mt-3 text-base font-bold leading-snug text-slate-300">{support}</p>}
        </section>

        <section className="border-t border-white/[0.07] bg-white/[0.018] px-5 py-5 lg:border-l lg:border-t-0">
          <div className="mb-3 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500"><Eye className="h-3.5 w-3.5" /> Ojo con estos</div>
          <div className="space-y-3">
            {edition.secondary.slice(0, 2).map(story => (
              <div key={story.id} className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                <p className="text-sm font-semibold leading-snug text-slate-200"><span className="text-white">{story.playerName}</span> · {firstPunch(story.body)}</p>
              </div>
            ))}
          </div>
        </section>
      </div>

      {edition.picante && (
        <aside className="flex items-start gap-3 border-t border-red-500/15 bg-red-500/[0.045] px-5 py-4 md:px-7">
          <Flame className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
          <div className="min-w-0">
            <span className="mr-2 text-[10px] font-black uppercase tracking-[0.16em] text-red-400">🌶️ Picante</span>
            <span className="text-sm font-semibold text-slate-200">{edition.picante}</span>
          </div>
        </aside>
      )}
    </article>
  );
}
