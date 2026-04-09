'use client';

import { initializeFirebase as init } from '@/firebase';

/**
 * Redundancia corregida: Este archivo ahora delega directamente a la implementación estándar
 * en src/firebase/index.ts.
 */
export function initializeFirebase() {
  return init();
}
