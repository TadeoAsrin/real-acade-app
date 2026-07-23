'use client';
    
import { useState, useEffect } from 'react';
import {
  DocumentReference,
  onSnapshot,
  DocumentData,
  FirestoreError,
  DocumentSnapshot,
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

/** Utility type to add an 'id' field to a given type T. */
type WithId<T> = T & { id: string };

/**
 * Interface for the return value of the useDoc hook.
 * @template T Type of the document data.
 */
export interface UseDocResult<T> {
  data: WithId<T> | null; // Document data with ID, or null.
  isLoading: boolean;       // True if loading.
  error: FirestoreError | Error | null; // Error object, or null.
}

/**
 * React hook to subscribe to a single Firestore document in real-time.
 */
export function useDoc<T = any>(
  memoizedDocRef: DocumentReference<DocumentData> | null | undefined,
): UseDocResult<T> {
  type StateDataType = WithId<T> | null;

  const [data, setData] = useState<StateDataType>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<FirestoreError | Error | null>(null);

  useEffect(() => {
    const auth = getAuth();
    const currentUid = auth.currentUser?.uid || 'ANONYMOUS';

    if (!memoizedDocRef) {
      console.log(`[FIRESTORE DIAGNOSTIC] useDoc: Reference is NULL. Auth: ${currentUid}`);
      setData(null);
      setIsLoading(false);
      setError(null);
      return;
    }

    console.log(`[FIRESTORE DIAGNOSTIC] useDoc: STARTING fetch for [${memoizedDocRef.path}]. Auth: ${currentUid}`);

    setIsLoading(true);
    setError(null);

    const unsubscribe = onSnapshot(
      memoizedDocRef,
      (snapshot: DocumentSnapshot<DocumentData>) => {
        if (snapshot.exists()) {
          console.log(`[FIRESTORE DIAGNOSTIC] useDoc: SUCCESS for [${memoizedDocRef.path}]. Auth: ${currentUid}. Document EXISTS.`);
          setData({ ...(snapshot.data() as T), id: snapshot.id });
        } else {
          console.log(`[FIRESTORE DIAGNOSTIC] useDoc: SUCCESS (MISSING) for [${memoizedDocRef.path}]. Auth: ${currentUid}. Document NOT FOUND.`);
          setData(null);
        }
        setError(null);
        setIsLoading(false);
      },
      (serverError: FirestoreError) => {
        console.error(`[FIRESTORE DIAGNOSTIC] useDoc: ERROR for [${memoizedDocRef.path}]. Auth: ${currentUid}. Code: ${serverError.code}. Message: ${serverError.message}`);
        
        if (serverError.code === 'permission-denied') {
          const contextualError = new FirestorePermissionError({
            operation: 'get',
            path: memoizedDocRef.path,
          });
          setError(contextualError);
        } else {
          setError(serverError);
        }
        setData(null);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [memoizedDocRef]);

  return { data, isLoading, error };
}
