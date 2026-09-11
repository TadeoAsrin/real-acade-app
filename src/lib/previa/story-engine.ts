import { calculateAggregatedStats } from '../data';
import type { AggregatedPlayerStats, Match, Player } from '../definitions';

export const STORY_KINDS = ['winning-streak', 'losing-streak', 'recent-form', 'recent-goals', 'ranking-position', 'ranking-movement', 'mvp-form', 'win-rate'] as const;
export type StoryKind = typeof STORY_KINDS[number];
export type StoryRule = { base: number; perUnit: number; cap: number };
export type StoryRules = {
  weights: Record<StoryKind, StoryRule>;
  recencyBonus: number;
  supportingBonus: number;
  supportingCap: number;
  secondaryCount: number;
};
export const DEFAULT_STORY_RULES: StoryRules = {
  weights: {
    'winning-streak': { base: 65, perUnit: 6, cap: 30 },
    'losing-streak': { base: 55, perUnit: 5, cap: 25 },
    'recent-form': { base: 40, perUnit: 4, cap: 20 },
    'recent-goals': { base: 50, perUnit: 4, cap: 32 },
    'ranking-position': { base: 45, perUnit: 5, cap: 15 },
    'ranking-movement': { base: 55, perUnit: 6, cap: 30 },
    'mvp-form': { base: 60, perUnit: 8, cap: 32 },
    'win-rate': { base: 40, perUnit: 0.3, cap: 30 },
  },
  recencyBonus: 10,
  supportingBonus: 4,
  supportingCap: 12,
  secondaryCount: 3,
};
export type StorySignal = {
  kind: StoryKind;
  title: string;
  body: string;
  score: number;
  matchIds: string[];
  facts: Record<string, number | string>;
};
export type StoryCandidate = {
  id: string;
  seasonId: string;
  playerId: string;
  playerName: string;
  context: string;
  title: string;
  body: string;
  score: number;
  signals: StorySignal[];
};
export type StoryEngineResult = {
  seasonId: string;
  seasonMatches: number;
  minimumEligibleMatches: number;
  sourceMatchIds: string[];
  candidates: StoryCandidate[];
  headlineId: string | null;
  secondaryIds: string[];
};

export function percentageEligibility(seasonMatches: number): number {
  return Math.max(3, Math.ceil(seasonMatches * 0.4));
}
const compareId = (a: string, b: string) => a < b ? -1 : a > b ? 1 : 0;
// Identical sporting criteria to the default standings: points, efficiency, goal difference.
const compareStanding = (a: AggregatedPlayerStats, b: AggregatedPlayerStats) =>
  (b.wins * 3 + b.draws) - (a.wins * 3 + a.draws) || b.efficiency - a.efficiency || b.goalDifference - a.goalDifference;
function positions(stats: AggregatedPlayerStats[]) {
  const sorted = stats.filter(p => p.matchesPlayed > 0).sort((a, b) => compareStanding(a, b) || compareId(a.playerId, b.playerId));
  const result = new Map<string, number>();
  let rank = 0;
  sorted.forEach((p, index) => {
    if (!index || compareStanding(sorted[index - 1], p)) rank = index + 1;
    result.set(p.playerId, rank);
  });
  return result;
}

/** Pure, season-scoped editorial layer. Never mutates inputs or statistics. No clock, randomness or AI. */
export function generateStories(players: Player[], matches: Match[], seasonId: string, rules: StoryRules = DEFAULT_STORY_RULES): StoryEngineResult {
  const played = matches.filter(m => m.seasonId === seasonId && (m.teamAScore > 0 || m.teamBScore > 0))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime() || (a.matchNumber ?? 0) - (b.matchNumber ?? 0) || compareId(a.id, b.id));
  const orderedPlayers = [...players].sort((a, b) => compareId(a.id, b.id));
  const stats = calculateAggregatedStats(orderedPlayers, played);
  const currentPositions = positions(stats);
  const previousPositions = positions(calculateAggregatedStats(orderedPlayers, played.slice(0, -1)));
  const minimumEligibleMatches = percentageEligibility(played.length);
  const recentIds = new Set(played.slice(-5).map(m => m.id));
  const candidates: StoryCandidate[] = [];

  for (const p of stats) {
    const appearances = played.flatMap((match, index) => {
      const a = match.teamAPlayers.find(s => s.playerId === p.playerId);
      const entry = a ?? match.teamBPlayers.find(s => s.playerId === p.playerId);
      if (!entry) return [];
      const own = a ? match.teamAScore : match.teamBScore;
      const other = a ? match.teamBScore : match.teamAScore;
      return [{ match, index, entry, result: own === other ? 'D' : own > other ? 'W' : 'L' }];
    });
    const latest = appearances.at(-1);
    const recent = appearances.filter(a => recentIds.has(a.match.id));
    if (!latest || !recent.length) continue;
    const signals: StorySignal[] = [];
    const add = (kind: StoryKind, magnitude: number, title: string, body: string, facts: StorySignal['facts'], matchIds: string[]) => {
      const weight = rules.weights[kind];
      const freshness = rules.recencyBonus * Math.max(0, 1 - (played.length - 1 - latest.index) / 5);
      const score = Math.round((weight.base + Math.min(weight.cap, magnitude * weight.perUnit) + freshness) * 100) / 100;
      signals.push({ kind, title, body, facts, matchIds, score });
    };
    let streak = 0;
    if (latest.result !== 'D') {
      for (const appearance of [...appearances].reverse()) {
        if (appearance.result !== latest.result) break;
        streak++;
      }
    }
    if (streak >= 3) {
      const winning = latest.result === 'W';
      add(winning ? 'winning-streak' : 'losing-streak', streak,
        `${p.name}: ${streak} ${winning ? 'victorias' : 'derrotas'} al hilo`,
        `Acumula ${streak} ${winning ? 'victorias' : 'derrotas'} consecutivas en sus participaciones de esta temporada.`,
        { streak }, appearances.slice(-streak).map(a => a.match.id));
    }
    const wins = recent.filter(a => a.result === 'W').length;
    const draws = recent.filter(a => a.result === 'D').length;
    const losses = recent.length - wins - draws;
    if (recent.length >= 3 && (wins >= 3 || losses >= 3 || losses === 0)) {
      add('recent-form', Math.max(wins, losses, draws), `${p.name}: ${losses === 0 ? 'presente invicto' : wins >= 3 ? 'buen presente' : 'busca recuperarse'}`,
        `En las últimas cinco fechas jugadas participó ${recent.length} veces: ${wins} victorias, ${draws} empates y ${losses} derrotas.`,
        { appearances: recent.length, wins, draws, losses }, recent.map(a => a.match.id));
    }
    const goals = recent.reduce((sum, a) => sum + a.entry.goals, 0);
    if (goals >= 3) add('recent-goals', goals, `${p.name} llega con ${goals} goles recientes`,
      `Marcó ${goals} goles en ${recent.length} participaciones dentro de las últimas cinco fechas jugadas.`,
      { goals, appearances: recent.length }, recent.map(a => a.match.id));
    // Match the existing statistics engine's legacy MVP flag compatibility.
    const mvps = recent.filter(a => a.entry.isMvp === true || String(a.entry.isMvp) === 'true' || Number(a.entry.isMvp) === 1);
    if (mvps.length >= 2) add('mvp-form', mvps.length, `${p.name}, ${mvps.length} veces MVP en las últimas cinco fechas`,
      `Recibió ${mvps.length} premios MVP en sus ${recent.length} participaciones de ese período.`,
      { mvps: mvps.length, appearances: recent.length }, mvps.map(a => a.match.id));
    const rank = currentPositions.get(p.playerId)!;
    if (rank <= 3) add('ranking-position', 4 - rank, `${p.name} ocupa el puesto ${rank} de la clasificación`,
      `Está en el puesto ${rank} con ${p.wins * 3 + p.draws} puntos; los empates completos comparten posición.`,
      { rank, points: p.wins * 3 + p.draws }, played.map(m => m.id));
    const previous = previousPositions.get(p.playerId);
    if (previous !== undefined && previous !== rank) {
      const movement = previous - rank;
      add('ranking-movement', Math.abs(movement), `${p.name} ${movement > 0 ? 'sube' : 'baja'} ${Math.abs(movement)} ${Math.abs(movement) === 1 ? 'puesto' : 'puestos'}`,
        `Tras la última fecha pasó del puesto ${previous} al ${rank} de la clasificación.`,
        { previousRank: previous, rank, movement }, played.slice(-1).map(m => m.id));
    }
    if (p.matchesPlayed >= minimumEligibleMatches && p.winPercentage >= 60) {
      add('win-rate', p.winPercentage, `${p.name} gana el ${p.winPercentage}% de sus partidos`,
        `Suma ${p.wins} victorias en ${p.matchesPlayed} partidos de temporada. El mínimo para esta comparación es ${minimumEligibleMatches} participaciones.`,
        { wins: p.wins, appearances: p.matchesPlayed, winPercentage: p.winPercentage, minimumEligibleMatches }, appearances.map(a => a.match.id));
    }
    if (!signals.length) continue;
    signals.sort((a, b) => b.score - a.score || compareId(a.kind, b.kind));
    // One candidate per player and edition context; preserve all evidence for editorial review.
    const lead = signals[0];
    const context = played.at(-1)!.id;
    candidates.push({
      id: `${seasonId}:${context}:${p.playerId}`, seasonId, playerId: p.playerId, playerName: p.name, context,
      title: lead.title, body: signals.map(s => s.body).join(' '), signals,
      score: Math.round((lead.score + Math.min(rules.supportingCap, (signals.length - 1) * rules.supportingBonus)) * 100) / 100,
    });
  }
  candidates.sort((a, b) => b.score - a.score || compareId(a.id, b.id));
  return {
    seasonId, seasonMatches: played.length, minimumEligibleMatches, sourceMatchIds: played.map(m => m.id), candidates,
    headlineId: candidates[0]?.id ?? null,
    secondaryIds: candidates.slice(1, 1 + rules.secondaryCount).map(s => s.id),
  };
}
