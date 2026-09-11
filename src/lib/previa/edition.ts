import { z } from 'zod';
import { STORY_KINDS, type StoryCandidate, type StoryEngineResult } from './story-engine';
import { generatePicante } from './picante-engine';
import type { ColdFormEntry } from './cold-form';

export const PREVIA_GENERATION_VERSION = 6;

export type EditorialChoice = 'headline' | 'secondary' | 'available' | 'discarded';
export type EditorialStory = StoryCandidate & { choice: EditorialChoice };
export type PreviaDraft = {
  seasonId: string;
  seasonName: string;
  status: 'draft' | 'published';
  revision: number;
  generationVersion?: number;
  generatedAt: string;
  updatedAt: string;
  sourceMatchIds: string[];
  sourceFingerprint?: string;
  minimumEligibleMatches: number;
  stories: EditorialStory[];
  coldStories?: ColdFormEntry[];
  picante: string;
};
export type PublishedPrevia = {
  seasonId: string;
  seasonName: string;
  status: 'published';
  revision: number;
  publishedAt: string;
  headline: EditorialStory;
  secondary: EditorialStory[];
  coldStories?: ColdFormEntry[];
  picante: string;
};

const text = (max: number) => z.string().trim().min(1).max(max);
const signalSchema = z.object({
  kind: z.enum(STORY_KINDS), title: z.string(), body: z.string(), score: z.number().finite(),
  matchIds: z.array(z.string()), facts: z.record(z.union([z.string(), z.number().finite()])),
});
const storySchema = z.object({
  id: text(1000), seasonId: text(200), playerId: text(200), playerName: text(200), context: text(200),
  title: text(180), body: text(2000), score: z.number().finite(), signals: z.array(signalSchema).min(1),
  choice: z.enum(['headline', 'secondary', 'available', 'discarded']),
});
const coldStorySchema = z.object({
  playerId: text(200),
  playerName: text(200),
  appearances: z.number().int().min(0).max(5),
  wins: z.number().int().nonnegative(),
  draws: z.number().int().nonnegative(),
  losses: z.number().int().nonnegative(),
  points: z.number().int().nonnegative(),
  pointsPerGame: z.number().finite().nonnegative(),
  losingStreak: z.number().int().nonnegative(),
  score: z.number().finite().nonnegative(),
  eligible: z.boolean(),
  reason: z.string(),
  recentMatchIds: z.array(z.string()),
});
const draftSchema = z.object({
  seasonId: text(200), seasonName: text(200), status: z.enum(['draft', 'published']),
  revision: z.number().int().nonnegative(), generationVersion: z.number().int().positive().optional(),
  generatedAt: z.string().datetime(), updatedAt: z.string().datetime(),
  sourceMatchIds: z.array(z.string()), sourceFingerprint: z.string().optional(), minimumEligibleMatches: z.number().int().min(3),
  stories: z.array(storySchema).max(300), coldStories: z.array(coldStorySchema).max(2).optional(), picante: z.string().trim().max(600),
});

export function validateDraft(draft: PreviaDraft): PreviaDraft {
  const parsed = draftSchema.parse(draft);
  if (new Set(parsed.stories.map(s => s.id)).size !== parsed.stories.length) throw new Error('Hay historias duplicadas.');
  if (new Set(parsed.stories.map(s => `${s.playerId}:${s.context}`)).size !== parsed.stories.length) throw new Error('Hay historias superpuestas.');
  if (parsed.stories.some(s => s.seasonId !== parsed.seasonId)) throw new Error('Las historias deben pertenecer a esta temporada.');
  if (parsed.stories.filter(s => s.choice === 'headline').length > 1) throw new Error('Seleccioná un único titular.');
  if (parsed.stories.filter(s => s.choice === 'secondary').length > 3) throw new Error('Podés elegir hasta tres historias secundarias.');
  return parsed;
}

export function createDraft(result: StoryEngineResult, seasonName: string, now: string, revision = 0): PreviaDraft {
  return {
    seasonId: result.seasonId, seasonName, status: 'draft', revision, generationVersion: PREVIA_GENERATION_VERSION,
    generatedAt: now, updatedAt: now,
    sourceMatchIds: [...result.sourceMatchIds], minimumEligibleMatches: result.minimumEligibleMatches,
    stories: result.candidates.map(s => ({ ...s, choice: s.id === result.headlineId ? 'headline' : result.secondaryIds.includes(s.id) ? 'secondary' : 'available' })),
    picante: generatePicante(result),
  };
}

export function chooseStory(draft: PreviaDraft, id: string, choice: EditorialChoice): PreviaDraft {
  if (!draft.stories.some(s => s.id === id)) return draft;
  return {
    ...draft, status: 'draft',
    stories: draft.stories.map(s => s.id === id ? { ...s, choice } : choice === 'headline' && s.choice === 'headline' ? { ...s, choice: 'available' } : s),
  };
}

export function prepareEdition(draft: PreviaDraft, expectedRevision: number, currentRevision: number, action: 'save' | 'publish', now: string) {
  if (expectedRevision !== currentRevision) throw new Error('Otra sesión actualizó esta edición. Recargá el borrador antes de guardar.');
  const validated = validateDraft(draft);
  const saved: PreviaDraft = { ...validated, revision: currentRevision + 1, updatedAt: now, status: action === 'publish' ? 'published' : 'draft' };
  if (action === 'save') return { draft: saved, published: null };
  const headline = saved.stories.find(s => s.choice === 'headline');
  if (!headline) throw new Error('Seleccioná un titular antes de publicar.');
  const secondary = saved.stories.filter(s => s.choice === 'secondary');
  const published: PublishedPrevia = {
    seasonId: saved.seasonId,
    seasonName: saved.seasonName,
    status: 'published',
    revision: saved.revision,
    publishedAt: now,
    headline,
    secondary,
    coldStories: saved.coldStories ?? [],
    picante: saved.picante,
  };
  return { draft: saved, published };
}
