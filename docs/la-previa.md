# La Previa V1

La Previa replaces the AI front page and match chronicle. The dashboard and `/previa` render only the published edition of the selected season. Administrators use `/admin/previa` (also linked in the sidebar).

## Editorial workflow

1. Select a season and generate stories.
2. Review each candidate's source facts and StoryScore. Each player has one merged candidate per edition context.
3. Choose exactly one headline and up to three secondaries. Available and discarded stories are not published. Selecting another headline demotes the previous headline to available; discarded stories can be restored.
4. Edit titles (180 characters) and bodies (2,000 characters). Optionally write the one manual Picante de la Fecha (600 characters).
5. Save the private draft, preview, or publish. Saving edits to an already published edition leaves the public snapshot unchanged.
6. Regeneration replaces automatic candidates and their edits after confirmation, retaining the manual Picante. New match results do not silently regenerate or republish an edition.

Publication waits for an acknowledged Firestore transaction. A revision check rejects concurrent edits rather than overwriting them. If a conflict is reported, reload before editing again. Unsaved changes are marked; save before switching seasons or navigating away.

## Story Engine

`src/lib/previa/story-engine.ts` is pure: identical inputs and scoring rules return identical candidates and selection. There are no model calls, randomized templates, head-to-head, rivalry, or nemesis calculations.

- Only matches from the requested season participate.
- A played match uses the existing convention: either team score is greater than zero. A recorded 0–0 remains excluded, as in the existing statistics engine; V1 does not introduce a played/status migration.
- Chronology uses match date, then match number, then ID to resolve same-date inputs deterministically.
- Current streaks cover all of the player's consecutive participations, including beyond the five-game form window. Draws and opposite results break a streak; absences do not. Winning/losing streak stories require at least three.
- Recent form, goals, and MVP form use the last five played season matches. Form requires at least three appearances and either three wins, three losses, or no losses. Goals require three total recent goals; MVP form requires two awards. MVP flags retain the existing true/"true"/1 compatibility.
- Players without an appearance in the last five season matches do not generate current stories.
- Rankings use the existing standings criteria: points (`3 × wins + draws`), then efficiency, then goal difference. Exact sporting ties share competition rank (1, 1, 3). Top-three positions generate stories; movement compares with the same season before the latest match. First-time entries do not invent a prior position.
- Win-rate copy uses the existing rounded win percentage, requires at least 60%, and is eligible only at `max(3, ceil(0.40 × played season matches))` appearances. This editorial eligibility does not change dashboard or standings eligibility or any aggregate statistics.

### Configurable StoryScore

Edit `DEFAULT_STORY_RULES` or supply a `StoryRules` object as the fourth argument to `generateStories`. Weights are editorial configuration; they never change sporting statistics.

| Signal | Base | Per unit | Magnitude cap |
| --- | ---: | ---: | ---: |
| Winning streak | 65 | 6 | 30 |
| Losing streak | 55 | 5 | 25 |
| Recent form | 40 | 4 | 20 |
| Recent goals | 50 | 4 | 32 |
| Ranking position | 45 | 5 | 15 |
| Ranking movement | 55 | 6 | 30 |
| MVP form | 60 | 8 | 32 |
| Win rate | 40 | 0.3 | 30 |

Signal score is base + capped magnitude contribution + recency bonus (10 for an appearance in the latest match, reducing by 2 per missed season match). Position magnitude is `4 − rank`, movement uses absolute places moved, and form uses the largest outcome count. Merged score is the highest signal score plus 4 per additional signal, capped at 12. Candidate ID breaks equal scores deterministically. The first candidate is the suggested headline, followed by three secondaries. All supporting evidence remains available to the editor.

## Storage and rollout

Two new collections keep editorial records separate from existing statistical data:

- `previa_drafts/{seasonId}`: admin-only reads/writes; status, revision, generated/updated timestamps, source match IDs, eligibility threshold, candidate evidence, choices, edited copy, and Picante.
- `published_previas/{seasonId}`: public reads, admin writes; contains only the selected headline, secondary stories and Picante, plus edition metadata. An atomic publish writes this snapshot and updates the draft together.

Deploy the updated `firestore.rules` before or together with the application release; otherwise the new collections will be denied by the existing rules. No existing document migration is required. Existing match/player/season types and all formulas in `src/lib/data.ts` are retained. Legacy `Match.aiSummary` remains optional solely for compatibility with persisted records; no application surface reads it and no code writes or generates it. The AI flow, UI components, and Genkit dependencies are removed. Admin-auth policy and existing match comments, media, votes, and statistics are preserved.

## Verification

- `npm run test:previa` compiles and runs 16 deterministic engine/editorial tests with the existing TypeScript dependency and Node test runner.
- `npm run build` builds the application. Use Node 24 as specified by the repository. The existing build configuration skips type validation; `npx tsc --noEmit --incremental false` separately reports three pre-existing `powerPoints` errors in `src/components/dashboard/power-ranking.tsx`. La Previa introduces no additional type errors.
- `tests/previa-firestore.cjs` exercises actual Firestore rules and the production transaction repository. It requires Firebase Auth at localhost:9099 and Firestore at localhost:8088, Java 21, Firebase CLI, and `@firebase/rules-unit-testing@4`. Install those test tools separately and set `NODE_PATH` to their `node_modules` if they are outside this repository. Start with `firebase emulators:start --only firestore,auth --project demo-real-acade-previa` using those ports, then run `node --test tests/previa-firestore.cjs` from this repository. The tests exclusively use the demo project and seed fictional data.
- For browser QA, copy `tests/fixtures/previa-browser.tsx` into `src/app/previa-test/page.tsx`, run the emulator suite to seed data, start Next locally, and visit `/previa-test`. This mounts the actual admin route and public component with emulator providers. Test generation, editing, discard/restore, save, reload, publish, visitor view, and season switching. Remove the temporary route before the release build; it is not part of the shipped application.
