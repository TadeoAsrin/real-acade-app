// Requires running Firestore (8088) + Auth (9099) emulators, firebase and @firebase/rules-unit-testing.
// Safety: all tests use a demo project and explicit loopback emulator endpoints.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
require.extensions['.ts'] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText, filename);
const { initializeTestEnvironment, assertFails, assertSucceeds } = require('@firebase/rules-unit-testing');
const { initializeApp, deleteApp } = require('firebase/app');
const { getFirestore, connectFirestoreEmulator, getDoc, doc } = require('firebase/firestore');
const { getAuth, connectAuthEmulator, signInWithEmailAndPassword } = require('firebase/auth');
const { generateStories } = require('../src/lib/previa/story-engine.ts');
const { createDraft } = require('../src/lib/previa/edition.ts');
const { savePrevia } = require('../src/lib/previa/repository.ts');
const projectId = 'demo-real-acade-previa';
const players = ['Ana', 'Beto', 'Caro', 'Diego'].map((name, i) => ({ id: `p${i}`, name, role: 'player' }));
const matches = Array.from({ length: 8 }, (_, i) => ({ id: `m${i+1}`, seasonId: 's1', date: `2026-03-${String(i+1).padStart(2, '0')}T20:00:00Z`, teamAScore: 4, teamBScore: 1,
  teamAPlayers: [{ playerId: 'p0', goals: 2, isMvp: true }, { playerId: 'p2', goals: 2 }], teamBPlayers: [{ playerId: 'p1', goals: 1 }, { playerId: 'p3', goals: 0 }] }));
let env, app, db, roleDb;
test.before(async () => {
  env = await initializeTestEnvironment({ projectId, firestore: { host: '127.0.0.1', port: 8088, rules: fs.readFileSync('firestore.rules', 'utf8') } });
  await env.clearFirestore();
  app = initializeApp({ projectId, apiKey: 'emulator-only' }, 'previa-repository-tests');
  db = getFirestore(app); connectFirestoreEmulator(db, '127.0.0.1', 8088);
  const auth = getAuth(app); connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
  await fetch('http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:signUp?key=emulator-only', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 'editor@example.test', password: 'test-only-password', returnSecureToken: true }) });
  const user = await signInWithEmailAndPassword(auth, 'editor@example.test', 'test-only-password');
  await env.withSecurityRulesDisabled(async ctx => {
    const seed = ctx.firestore();
    await seed.doc(`roles_admin/${user.user.uid}`).set({ isAdmin: true });
    await seed.doc('roles_admin/role-editor').set({ isAdmin: true });
    await seed.doc('app_settings/global').set({ activeSeasonId: 's1' });
    await seed.doc('seasons/s1').set({ name: 'Apertura 2026', year: 2026, type: 'Apertura', half: 1, startDate: '2026-01-01', createdAt: new Date().toISOString() });
    await seed.doc('seasons/s2').set({ name: 'Clausura 2026', year: 2026, type: 'Clausura', half: 2, startDate: '2026-07-01', createdAt: new Date().toISOString() });
    for (const player of players) await seed.doc(`players/${player.id}`).set(player);
    for (const match of matches) await seed.doc(`matches/${match.id}`).set(match);
  });
  roleDb = env.authenticatedContext('role-editor', { email: 'role@example.test' }).firestore();
});
test.after(async () => { await deleteApp(app); await env.cleanup(); });
const makeDraft = () => createDraft(generateStories(players, matches, 's1'), 'Apertura 2026', new Date().toISOString());

test('anonymous and ordinary signed-in users cannot read or write drafts', async () => {
  await savePrevia(db, makeDraft(), 'save');
  for (const ctx of [env.unauthenticatedContext(), env.authenticatedContext('player', { email: 'player@example.test' })]) {
    const store = ctx.firestore();
    await assertFails(store.doc('previa_drafts/s1').get());
    await assertFails(store.doc('previa_drafts/s1').set(makeDraft()));
    await assertFails(store.doc('published_previas/s1').set({ status: 'published' }));
  }
  await assertSucceeds(roleDb.doc('previa_drafts/s1').get());
});
test('repository atomically publishes; draft changes leave the public snapshot unchanged', async () => {
  const current = (await getDoc(doc(db, 'previa_drafts', 's1'))).data();
  current.stories[0].title = 'Titular publicado de prueba';
  const published = await savePrevia(db, current, 'publish');
  const publicDb = env.unauthenticatedContext().firestore();
  const visible = (await assertSucceeds(publicDb.doc('published_previas/s1').get())).data();
  assert.equal(visible.headline.title, 'Titular publicado de prueba');
  assert.equal(visible.revision, published.revision);
  await savePrevia(db, { ...published, picante: 'Borrador privado' }, 'save');
  assert.equal((await publicDb.doc('published_previas/s1').get()).data().picante, '');
});
test('two simultaneous saves preserve one winner and reject the stale editor', async () => {
  const current = (await getDoc(doc(db, 'previa_drafts', 's1'))).data();
  const results = await Promise.allSettled([savePrevia(db, { ...current, picante: 'Editor A' }, 'save'), savePrevia(db, { ...current, picante: 'Editor B' }, 'save')]);
  assert.equal(results.filter(r => r.status === 'fulfilled').length, 1);
  assert.equal(results.filter(r => r.status === 'rejected').length, 1);
});
test('rules reject cross-season and draft-status publication; existing stats remain publicly readable', async () => {
  const published = (await roleDb.doc('published_previas/s1').get()).data();
  await assertFails(roleDb.doc('published_previas/s2').set(published));
  await assertFails(roleDb.doc('published_previas/s1').set({ ...published, status: 'draft' }));
  await assertSucceeds(env.unauthenticatedContext().firestore().doc('matches/m1').get());
  await assertSucceeds(env.unauthenticatedContext().firestore().doc('players/p0').get());
});
test('backup admin identity retains editorial access', async () => {
  await assertSucceeds(env.authenticatedContext('backup', { email: 'tadeoasrin@gmail.com' }).firestore().doc('previa_drafts/s1').get());
});
// Leave seed data for browser QA, with no existing edition.
test('reset only demo editorial documents for browser tests', async () => {
  await env.withSecurityRulesDisabled(async ctx => {
    await ctx.firestore().doc('previa_drafts/s1').delete();
    await ctx.firestore().doc('published_previas/s1').delete();
  });
});
