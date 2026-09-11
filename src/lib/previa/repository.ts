import { doc, runTransaction, type Firestore } from 'firebase/firestore';
import type { Match, Player, Season } from '../definitions';
import { createDraft, prepareEdition, type PreviaDraft } from './edition';
import { generateStories } from './story-engine';

export function buildPreviaSourceFingerprint(matches: Match[], seasonId: string): string {
  const normalized = matches
    .filter(match => match.seasonId === seasonId && (match.teamAScore > 0 || match.teamBScore > 0))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime() || (a.matchNumber ?? 0) - (b.matchNumber ?? 0) || a.id.localeCompare(b.id))
    .map(match => ({
      id: match.id,
      date: match.date,
      matchNumber: match.matchNumber ?? null,
      teamAScore: match.teamAScore,
      teamBScore: match.teamBScore,
      teamAPlayers: [...match.teamAPlayers].sort((a, b) => a.playerId.localeCompare(b.playerId)).map(player => ({
        playerId: player.playerId,
        goals: player.goals,
        isCaptain: Boolean(player.isCaptain),
        isMvp: Boolean(player.isMvp),
        hasBestGoal: Boolean(player.hasBestGoal),
      })),
      teamBPlayers: [...match.teamBPlayers].sort((a, b) => a.playerId.localeCompare(b.playerId)).map(player => ({
        playerId: player.playerId,
        goals: player.goals,
        isCaptain: Boolean(player.isCaptain),
        isMvp: Boolean(player.isMvp),
        hasBestGoal: Boolean(player.hasBestGoal),
      })),
    }));
  return JSON.stringify(normalized);
}

/** Atomic publication; draft-only saves never touch the publicly readable snapshot. */
export async function savePrevia(firestore: Firestore, draft: PreviaDraft, action: 'save' | 'publish') {
  const draftRef = doc(firestore, 'previa_drafts', draft.seasonId);
  const publicRef = doc(firestore, 'published_previas', draft.seasonId);
  return runTransaction(firestore, async transaction => {
    const current = await transaction.get(draftRef);
    const prepared = prepareEdition(draft, draft.revision, current.exists() ? current.data().revision : 0, action, new Date().toISOString());
    transaction.set(draftRef, prepared.draft);
    if (prepared.published) transaction.set(publicRef, prepared.published);
    return prepared.draft;
  });
}

/**
 * Rebuilds and publishes La Previa from official season data.
 * Used after a match is saved so the dashboard is always up to date without
 * asking the admin to choose stories or write the Picante manually.
 */
export async function regenerateAndPublishPrevia(
  firestore: Firestore,
  players: Player[],
  matches: Match[],
  season: Season,
) {
  const result = generateStories(players, matches, season.id);
  if (!result.headlineId) return null;

  const draftRef = doc(firestore, 'previa_drafts', season.id);
  const publicRef = doc(firestore, 'published_previas', season.id);

  return runTransaction(firestore, async transaction => {
    const current = await transaction.get(draftRef);
    const revision = current.exists() ? Number(current.data().revision ?? 0) : 0;
    const now = new Date().toISOString();
    const generated = {
      ...createDraft(result, season.name, now, revision),
      sourceFingerprint: buildPreviaSourceFingerprint(matches, season.id),
    };
    const prepared = prepareEdition(generated, revision, revision, 'publish', now);

    transaction.set(draftRef, prepared.draft);
    if (prepared.published) transaction.set(publicRef, prepared.published);
    return prepared.published;
  });
}
