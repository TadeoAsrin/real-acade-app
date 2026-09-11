import { Eye, Flame, Newspaper } from 'lucide-react';
import type { PublishedPrevia } from '@/lib/previa/edition';
import type { StorySignal } from '@/lib/previa/story-engine';

function factNumber(signal: StorySignal, key: string): number {
  return Number(signal.facts[key] ?? 0);
}

function signalCopy(signal: StorySignal): string {
  switch (signal.kind) {
    case 'winning-streak':
      return `${factNumber(signal, 'streak')} victorias seguidas`;
    case 'losing-streak':
      return `${factNumber(signal, 'streak')} derrotas seguidas`;
    case 'recent-form': {
      const appearances = factNumber(signal, 'appearances');
      return `${factNumber(signal, 'wins')}G · ${factNumber(signal, 'draws')}E · ${factNumber(signal, 'losses')}P en ${appearances}`;
    }
    case 'recent-goals':
      return `${factNumber(signal, 'goals')} goles en ${factNumber(signal, 'appearances')} partidos`;
    case 'mvp-form':
      return `${factNumber(signal, 'mvps')} MVP en ${factNumber(signal, 'appearances')} partidos`;
    case 'ranking-position': {
      const rank = factNumber(signal, 'rank');
      const points = factNumber(signal, 'points');
      return rank === 1 ? `Líder · ${points} pts` : `#${rank} en la tabla · ${points} pts`;
    }
    case 'ranking-movement': {
      const previous = factNumber(signal, 'previousRank');
      const rank = factNumber(signal, 'rank');
      return `#${previous} → #${rank}`;
    }
    case 'win-rate':
      return `${factNumber(signal, 'wins')} triunfos en ${factNumber(signal, 'appearances')} partidos`;
    default:
      return signal.body.replace(/\.$/, '');
  }
}

function uniqueFacts(signals: StorySignal[], limit = 2): string[] {
  const seen = new Set<string>();
  const facts: string[] = [];
  for (const signal of signals) {
    const copy = signalCopy(signal);
    const key = copy.toLocaleLowerCase('es-AR');
    if (seen.has(key)) continue;
    seen.add(key);
    facts.push(copy);
    if (facts.length === limit) break;
  }
  return facts;
}

function HighlightNumbers({ text }: { text: string }) {
  const parts = text.split(/(#?\d+(?:[.,]\d+)?%?)/g);
  return (
    <>
      {parts.map((part, index) =>
        /#?\d/.test(part)
          ? <span key={`${part}-${index}`} className="font-extrabold text-orange-300">{part}</span>
          : <span key={`${part}-${index}`}>{part}</span>
      )}
    </>
  );
}

function FactLine({ facts, className = '' }: { facts: string[]; className?: string }) {
  return (
    <span className={className}>
      {facts.map((fact, index) => (
        <span key={`${fact}-${index}`}>
          {index > 0 && <span className="mx-1.5 text-slate-600">·</span>}
          <HighlightNumbers text={fact} />
        </span>
      ))}
    </span>
  );
}

function HeadlineTitle({ playerName, title }: { playerName: string; title: string }) {
  const lowerTitle = title.toLocaleLowerCase('es-AR');
  const lowerName = playerName.toLocaleLowerCase('es-AR');
  if (!lowerTitle.startsWith(lowerName)) return <>{title}</>;

  const rest = title.slice(playerName.length);
  return (
    <>
      <span className="text-orange-300">{title.slice(0, playerName.length)}</span>
      <span className="text-white">{rest}</span>
    </>
  );
}

function PicanteCopy({ playerName, text }: { playerName: string; text: string }) {
  const index = text.toLocaleLowerCase('es-AR').indexOf(playerName.toLocaleLowerCase('es-AR'));
  if (index < 0) return <>{text}</>;
  return (
    <>
      {text.slice(0, index)}
      <span className="font-bold text-orange-300">{text.slice(index, index + playerName.length)}</span>
      {text.slice(index + playerName.length)}
    </>
  );
}

export function EditionView({ edition }: { edition: PublishedPrevia }) {
  const headlineFacts = uniqueFacts(edition.headline.signals.slice(1), 2);

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
          <h2 className="text-2xl font-black uppercase leading-none tracking-tight text-white md:text-3xl">
            <HeadlineTitle playerName={edition.headline.playerName} title={edition.headline.title} />
          </h2>
          {headlineFacts.length > 0 && (
            <p className="mt-3 text-base font-bold leading-snug text-slate-300">
              <FactLine facts={headlineFacts} />
            </p>
          )}
        </section>

        <section className="border-t border-white/[0.07] bg-white/[0.018] px-5 py-5 lg:border-l lg:border-t-0">
          <div className="mb-3 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500"><Eye className="h-3.5 w-3.5" /> Ojo con estos</div>
          <div className="space-y-3">
            {edition.secondary.slice(0, 2).map(story => {
              const facts = uniqueFacts(story.signals, 2);
              return (
                <div key={story.id} className="flex items-start gap-2">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-orange-400/80" />
                  <p className="text-sm font-semibold leading-snug text-slate-200">
                    <span className="font-bold text-orange-300">{story.playerName}</span>
                    {facts.length > 0 && <><span className="mx-1.5 text-slate-600">·</span><FactLine facts={facts} /></>}
                  </p>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      {edition.picante && (
        <aside className="flex items-start gap-3 border-t border-red-500/15 bg-red-500/[0.045] px-5 py-4 md:px-7">
          <Flame className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
          <div className="min-w-0">
            <span className="mr-2 text-[10px] font-black uppercase tracking-[0.16em] text-red-400">🌶️ Picante</span>
            <span className="text-sm font-semibold text-slate-200"><PicanteCopy playerName={edition.headline.playerName} text={edition.picante} /></span>
          </div>
        </aside>
      )}
    </article>
  );
}
