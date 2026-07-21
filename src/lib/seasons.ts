
'use client';

import { 
  Firestore, 
  doc, 
  getDoc, 
  setDoc, 
  collection, 
  runTransaction, 
  getDocs, 
  query, 
  where,
  writeBatch
} from 'firebase/firestore';
import type { Season, AppSettings, Match, GalleryItem } from './definitions';

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

    // 1. Close current season if exists
    if (activeSeasonId) {
      const currentSeasonRef = doc(db, 'seasons', activeSeasonId);
      transaction.update(currentSeasonRef, { endDate: now });
    }

    // 2. Create new season
    const newSeason: Season = {
      ...data,
      id: newSeasonRef.id,
      createdAt: now,
      endDate: null
    };
    transaction.set(newSeasonRef, newSeason);

    // 3. Update global settings
    transaction.set(settingsRef, { 
      activeSeasonId: newSeasonRef.id 
    }, { merge: true });
  });

  return newSeasonRef.id;
}

/**
 * Standalone migration script.
 * Creates the initial season and assigns it to all existing data.
 * Idempotent: won't run if app is already marked as migrated.
 */
export async function runInitialMigration(db: Firestore): Promise<{ success: boolean, message: string }> {
  const settingsRef = doc(db, 'app_settings', 'global');
  const settingsSnap = await getDoc(settingsRef);
  
  if (settingsSnap.exists() && (settingsSnap.data() as AppSettings).isMigrated) {
    return { success: true, message: "La base de datos ya ha sido migrada." };
  }

  try {
    // 1. Create Initial Season
    const seasonsCol = collection(db, 'seasons');
    const initialSeasonRef = doc(seasonsCol);
    const now = new Date().toISOString();
    
    const initialSeason: Season = {
      id: initialSeasonRef.id,
      name: "Temporada Fundacional",
      year: 2024,
      type: "Apertura",
      half: 1,
      startDate: "2024-01-01T00:00:00Z",
      createdAt: now,
      endDate: null
    };

    // 2. Prepare batches for data updates
    const batch = writeBatch(db);
    
    // Process Matches
    const matchesSnap = await getDocs(collection(db, 'matches'));
    matchesSnap.forEach((m) => {
      const data = m.data();
      if (!data.seasonId) {
        batch.update(m.ref, { seasonId: initialSeasonRef.id });
      }
    });

    // Process Gallery
    const gallerySnap = await getDocs(collection(db, 'gallery'));
    gallerySnap.forEach((g) => {
      const data = g.data();
      if (!data.seasonId) {
        batch.update(g.ref, { seasonId: initialSeasonRef.id });
      }
    });

    // 3. Execute everything
    await setDoc(initialSeasonRef, initialSeason);
    await batch.commit();
    await setDoc(settingsRef, { 
      activeSeasonId: initialSeasonRef.id,
      isMigrated: true 
    }, { merge: true });

    return { success: true, message: "Migración inicial completada con éxito." };
  } catch (error: any) {
    console.error("Migration Error:", error);
    return { success: false, message: `Error en la migración: ${error.message}` };
  }
}
