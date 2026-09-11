import test from 'node:test';
import assert from 'node:assert/strict';
import { generateStories, percentageEligibility, DEFAULT_STORY_RULES, type StoryKind } from '../src/lib/previa/story-engine';
import { createDraft, chooseStory, prepareEdition, validateDraft } from '../src/lib/previa/edition';
import { calculateAggregatedStats } from '../src/lib/data';
import type { Match, Player } from '../src/lib/definitions';

const players: Player[] = ['Ana', 'Beto', 'Caro', 'Diego'].map((name, i) => ({ id: `p${i}`, name, role: 'player' }));
function match(i: number, changes: Partial<Match> = {}): Match {
  return { id: `m${i}`, seasonId: 's1', date: `2026-03-${String(i).padStart(2, '0')}T20:00:00Z`, teamAScore: 4, teamBScore: 1,
    teamAPlayers: [{ playerId: 'p0', goals: 2, isMvp: true }, { playerId: 'p2', goals: 2 }],
    teamBPlayers: [{ playerId: 'p1', goals: 1 }, { playerId: 'p3', goals: 0 }], ...changes };
}
const matches = Array.from({ length: 8 }, (_, i) => match(i + 1));
const signal = (data: Match[], playerId: string, kind: StoryKind) => generateStories(players, data, 's1').candidates.find(p => p.playerId === playerId)?.signals.find(s => s.kind === kind);
const now = '2026-03-10T12:00:00.000Z';
const draft = () => createDraft(generateStories(players, matches, 's1'), 'Apertura 2026', now);

test('dynamic eligibility rounds up and keeps the three-appearance floor', () => {
  assert.deepEqual([0, 1, 5, 7, 8, 10, 11, 20].map(percentageEligibility), [3, 3, 3, 3, 4, 4, 5, 8]);
});
test('empty seasons have no invented headline; 0–0 keeps the existing unplayed convention', () => {
  const result = generateStories(players, [match(1, { teamAScore: 0, teamBScore: 0 }), match(2, { seasonId: 's2' })], 's1');
  assert.equal(result.seasonMatches, 0); assert.equal(result.headlineId, null); assert.deepEqual(result.candidates, []);
});
test('generation is deterministic across reordered data and does not mutate existing statistics or inputs', () => {
  const before = JSON.stringify({ players, matches });
  const stats = calculateAggregatedStats(players, matches);
  assert.deepEqual(generateStories(players, matches, 's1'), generateStories([...players].reverse(), [...matches].reverse(), 's1'));
  assert.equal(JSON.stringify({ players, matches }), before);
  assert.deepEqual(calculateAggregatedStats(players, matches), stats);
  assert.equal(stats[0].winPercentage, 100); assert.equal(stats[0].totalGoals, 16);
});
test('winning and losing streaks include more than the five-game form window', () => {
  assert.equal(signal(matches, 'p0', 'winning-streak')?.facts.streak, 8);
  assert.equal(signal(matches, 'p1', 'losing-streak')?.facts.streak, 8);
});
test('a draw or reversed result breaks a streak, while absence does not count as a loss', () => {
  assert.equal(signal([...matches, match(9, { teamAScore: 2, teamBScore: 2 })], 'p0', 'winning-streak'), undefined);
  assert.equal(signal([...matches, match(9, { teamAScore: 1, teamBScore: 3 })], 'p0', 'winning-streak'), undefined);
  const absent = match(9, { teamAPlayers: [{ playerId: 'p2', goals: 4 }] });
  assert.equal(signal([...matches, absent], 'p0', 'winning-streak')?.facts.streak, 8);
});
test('recent form, goals and MVPs use the last five season matches and preserve MVP flag compatibility', () => {
  assert.equal(signal(matches, 'p0', 'recent-goals')?.facts.goals, 10);
  assert.equal(signal(matches, 'p0', 'recent-form')?.facts.wins, 5);
  assert.equal(signal(matches, 'p0', 'mvp-form')?.facts.mvps, 5);
  const legacy = matches.map(m => ({ ...m, teamAPlayers: [{ playerId: 'p0', goals: 2, isMvp: 'true' as unknown as boolean }] }));
  assert.equal(signal(legacy, 'p0', 'mvp-form')?.facts.mvps, 5);
  const absent = Array.from({ length: 5 }, (_, i) => match(i + 9, { teamAPlayers: [{ playerId: 'p2', goals: 4 }] }));
  assert.equal(generateStories(players, [...matches, ...absent], 's1').candidates.some(s => s.playerId === 'p0'), false);
});
test('win-rate stories require the season threshold, without changing other stories or aggregate win rate', () => {
  const data = matches.map((m, i) => i < 5 ? { ...m, teamAPlayers: [{ playerId: 'p2', goals: 4 }] } : m);
  assert.equal(signal(data, 'p0', 'win-rate'), undefined);
  assert.ok(signal(data, 'p0', 'winning-streak'));
  assert.equal(calculateAggregatedStats(players, data)[0].winPercentage, 100);
  const eligible = data.map((m, i) => i === 4 ? match(5) : m);
  assert.equal(signal(eligible, 'p0', 'win-rate')?.facts.minimumEligibleMatches, 4);
});
test('all player stories merge, score order is stable, headline and secondaries never overlap', () => {
  const result = generateStories(players, matches, 's1');
  assert.equal(new Set(result.candidates.map(s => s.playerId)).size, result.candidates.length);
  assert.ok(result.candidates[0].signals.length >= 5);
  assert.equal(result.headlineId, result.candidates[0].id);
  assert.equal(result.secondaryIds.includes(result.headlineId!), false);
  assert.equal(result.secondaryIds.length, 3);
});
test('configurable scoring can prioritize a different story kind', () => {
  const rules = structuredClone(DEFAULT_STORY_RULES);
  rules.weights['losing-streak'].base = 500;
  const result = generateStories(players, matches, 's1', rules);
  assert.equal(result.candidates[0].signals[0].kind, 'losing-streak');
  assert.equal(result.candidates[0].playerId, 'p1');
});
test('ranking follows points/efficiency/goal difference, shares exact ties, and detects movement', () => {
  assert.equal(signal(matches, 'p0', 'ranking-position')?.facts.rank, 1);
  assert.equal(signal(matches, 'p2', 'ranking-position')?.facts.rank, 1);
  const before = [match(1), match(2, { teamAScore: 1, teamBScore: 4 })];
  const result = [...before, match(3, { teamAScore: 1, teamBScore: 4 })];
  assert.equal(signal(result, 'p0', 'ranking-movement')?.facts.movement, -2);
  assert.equal(signal([match(1)], 'p0', 'ranking-movement'), undefined);
});
test('equal-date ordering is stable and other seasons cannot influence stories', () => {
  const tied = matches.map(m => ({ ...m, date: now }));
  assert.deepEqual(generateStories(players, tied, 's1'), generateStories(players, [...tied].reverse(), 's1'));
  assert.deepEqual(generateStories(players, matches, 's1'), generateStories(players, [...matches, match(20, { seasonId: 's2' })], 's1'));
});
test('selecting a headline demotes the old headline; discarded stories can be restored', () => {
  let edited = draft(); const id = edited.stories[1].id;
  edited = chooseStory(edited, id, 'headline');
  assert.equal(edited.stories.filter(s => s.choice === 'headline').length, 1);
  edited = chooseStory(edited, id, 'discarded'); assert.equal(edited.stories[1].choice, 'discarded');
  edited = chooseStory(edited, id, 'secondary'); assert.equal(edited.stories[1].choice, 'secondary');
});
test('publication includes edited selected copy and one manual Picante, with no available/discarded stories', () => {
  const edited = draft(); edited.stories[0].title = 'El titular del editor'; edited.picante = 'Hoy se juega con todo.';
  edited.stories[1].choice = 'discarded'; edited.stories[2].choice = 'available';
  const result = prepareEdition(edited, 0, 0, 'publish', now);
  assert.equal(result.published?.headline.title, 'El titular del editor');
  assert.equal(result.published?.secondary.length, 1); assert.equal(result.published?.picante, edited.picante);
  assert.equal(result.draft.status, 'published'); assert.equal(result.draft.revision, 1);
});
test('saving edits after publication does not produce a new public snapshot', () => {
  const first = prepareEdition(draft(), 0, 0, 'publish', now);
  const next = { ...first.draft, picante: 'Texto en borrador' };
  const saved = prepareEdition(next, 1, 1, 'save', now);
  assert.equal(saved.published, null); assert.equal(saved.draft.status, 'draft');
  assert.equal(first.published?.picante, '');
});
test('concurrent changes are rejected instead of overwriting another editor', () => {
  assert.throws(() => prepareEdition(draft(), 0, 1, 'save', now), /Otra sesión/);
  assert.throws(() => prepareEdition(draft(), 0, 1, 'publish', now), /Otra sesión/);
});
test('publication requires one headline and validates lengths, season identity and duplicates', () => {
  const edited = draft(); edited.stories.forEach(s => { s.choice = 'available'; });
  assert.throws(() => prepareEdition(edited, 0, 0, 'publish', now), /titular/);
  assert.doesNotThrow(() => prepareEdition(edited, 0, 0, 'save', now));
  assert.throws(() => validateDraft({ ...draft(), picante: 'x'.repeat(601) }));
  const mixed = draft(); mixed.stories[0].seasonId = 's2'; assert.throws(() => validateDraft(mixed), /temporada/);
  const duplicated = draft(); duplicated.stories.push(duplicated.stories[0]); assert.throws(() => validateDraft(duplicated), /duplicadas/);
  const tooMany = draft(); tooMany.stories.forEach(s => { s.choice = 'secondary'; }); assert.throws(() => validateDraft(tooMany), /tres/);
});
