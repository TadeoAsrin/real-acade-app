import { doc, runTransaction, type Firestore } from 'firebase/firestore';
import { prepareEdition, type PreviaDraft } from './edition';

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
