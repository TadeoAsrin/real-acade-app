'use client';

/**
 * Punto de entrada del SDK de Firebase.
 * Se re-exportan las utilidades y hooks, evitando exportar el proveedor 
 * directamente aquí para prevenir dependencias circulares.
 */

export { initializeFirebase, getSdks } from './init';
export { 
  useFirebase, 
  useAuth, 
  useFirestore, 
  useFirebaseApp, 
  useUser, 
  useMemoFirebase 
} from './provider';

export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './non-blocking-updates';
export * from './non-blocking-login';
export * from './errors';
export * from './error-emitter';
