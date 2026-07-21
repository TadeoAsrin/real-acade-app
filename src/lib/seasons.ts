
'use client';

import { 
  Firestore, 
  doc, 
  getDoc, 
  setDoc, 
  collection, 
  runTransaction, 
  getDocs, 
  writeBatch
} from 'firebase/firestore';
import type { Season, AppSettings } from './definitions';

/**
 * Gets the current active season ID from global settings.
 */
export async function getActiveSeasonId(db: Firestore): Promise<string | null> {
  const settingsRef = doc(db, 'app_settings', 'global');
  const snap = await getDoc(settingsRef);
  if (snap.exists()) {
    return (snap.data() as AppSettings).activeSeasonId;
  }
  return null;
}

/**
 * Returns a preview of what would be migrated.
 */
export async function getMigrationPreview(db: Firestore) {
  const matchesSnap = await getDocs(collection(db, 'matches'));
  const gallerySnap = await getDocs(collection(db, 'gallery'));
  const settingsSnap = await getDoc(doc(db, 'app_settings', 'global'));

  const pendingMatches = [];
  matchesSnap.forEach(doc => {
    if (!doc.data().seasonId) pendingMatches.push(doc.id);
  });

  const pendingGallery = [];
  gallerySnap.forEach(doc => {
    if (!doc.data().seasonId) pendingGallery.push(doc.id);
  });

  return {
    alreadyMigrated: settingsSnap.exists() && (settingsSnap.data() as any).isMigrated,
    pendingMatches: pendingMatches.length,
    pendingGallery: pendingGallery.length
  };
}

/**
 * Creates a new season and updates the global active season ID atomically.
 */
export async function createNewSeason(
  db: Firestore, 
  data: Omit<Season, 'id' | 'createdAt' | 'endDate'>
): Promise<string> {
  const settingsRef = doc(db, 'app_settings', 'global');
  const seasonsCol = collection(db, 'seasons');
  const newSeasonRef = doc(seasonsCol);
  const now = new Date().toISOString();

  await runTransaction(db, async (transaction) => {
    const settingsSnap = await transaction.get(settingsRef);
    const activeSeasonId = settingsSnap.exists() ? (settingsSnap.data() as AppSettings).activeSeasonId : null;

    if (activeSeasonId) {
      const currentSeasonRef = doc(db, 'seasons', activeSeasonId);
      transaction.update(currentSeasonRef, { endDate: now });
    }

    const newSeason: Season = {
      ...data,
      id: newSeasonRef.id,
      createdAt: now,
      endDate: null
    };
    transaction.set(newSeasonRef, newSeason);
    transaction.set(settingsRef, { activeSeasonId: newSeasonRef.id }, { merge: true });
  });

  return newSeasonRef.id;
}

/**
 * Standalone migration script.
 * Creates the initial season and assigns it to all existing data.
 */
export async function runInitialMigration(
  db: Firestore, 
  config: { name: string, year: number, type: 'Apertura' | 'Clausura' | 'Histórico', half: 1 | 2 }
) {
  const settingsRef = doc(db, 'app_settings', 'global');
  const settingsSnap = await getDoc(settingsRef);
  
  if (settingsSnap.exists() && (settingsSnap.data() as AppSettings).isMigrated) {
    throw new Error("La base de datos ya ha sido migrada.");
  }

  try {
    const seasonsCol = collection(db, 'seasons');
    const initialSeasonRef = doc(seasonsCol);
    const now = new Date().toISOString();
    
    const initialSeason: Season = {
      id: initialSeasonRef.id,
      name: config.name,
      year: config.year,
      type: config.type,
      half: config.half,
      startDate: "2024-01-01T00:00:00Z",
      createdAt: now,
      endDate: null
    };

    const batch = writeBatch(db);
    let matchesCount = 0;
    let galleryCount = 0;
    
    const matchesSnap = await getDocs(collection(db, 'matches'));
    matchesSnap.forEach((m) => {
      if (!m.data().seasonId) {
        batch.update(m.ref, { seasonId: initialSeasonRef.id });
        matchesCount++;
      }
    });

    const gallerySnap = await getDocs(collection(db, 'gallery'));
    gallerySnap.forEach((g) => {
      if (!g.data().seasonId) {
        batch.update(g.ref, { seasonId: initialSeasonRef.id });
        galleryCount++;
      }
    });

    await setDoc(initialSeasonRef, initialSeason);
    await batch.commit();
    await setDoc(settingsRef, { 
      activeSeasonId: initialSeasonRef.id,
      isMigrated: true 
    }, { merge: true });

    return {
      success: true,
      seasonCreated: initialSeason.name,
      matchesMigrated: matchesCount,
      galleryMigrated: galleryCount
    };
  } catch (error: any) {
    console.error("Migration Error:", error);
    throw error;
  }
}
