'use client';

import { useState, useEffect } from 'react';
import {
  Query,
  onSnapshot,
  DocumentData,
  FirestoreError,
  QuerySnapshot,
  CollectionReference,
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError, type SecurityRuleContext } from '@/firebase/errors';

/** Utility type to add an 'id' field to a given type T. */
export type WithId<T> = T & { id: string };

/**
 * Interface for the return value of the useCollection hook.
 * @template T Type of the document data.
 */
export interface UseCollectionResult<T> {
  data: WithId<T>[] | null; // Document data with ID, or null.
  isLoading: boolean;       // True if loading.
  error: FirestoreError | Error | null; // Error object, or null.
}

export interface InternalQuery extends Query<DocumentData> {
  _query: {
    path: {
      canonicalString(): string;
      toString(): string;
    },
    filters?: any[];
    explicitOrderBy?: any[];
    limit?: number;
  }
}

/**
 * React hook to subscribe to a Firestore collection or query in real-time.
 */
export function useCollection<T = any>(
    memoizedTargetRefOrQuery: ((CollectionReference<DocumentData> | Query<DocumentData>) & {__memo?: boolean})  | null | undefined,
): UseCollectionResult<T> {
  type ResultItemType = WithId<T>;
  type StateDataType = ResultItemType[] | null;

  const [data, setData] = useState<StateDataType>(null);
  const [isLoading, setIsLoading] = useState<boolean>(!!memoizedTargetRefOrQuery);
  const [error, setError] = useState<FirestoreError | Error | null>(null);

  useEffect(() => {
    const auth = getAuth();
    const currentUid = auth.currentUser?.uid || 'ANONYMOUS';
    
    if (!memoizedTargetRefOrQuery) {
      console.log(`[FIRESTORE DIAGNOSTIC] useCollection: Query is NULL. Auth: ${currentUid}`);
      setData(null);
      setIsLoading(false);
      setError(null);
      return;
    }

    const internal = memoizedTargetRefOrQuery as unknown as InternalQuery;
    const path: string =
      memoizedTargetRefOrQuery.type === 'collection'
        ? (memoizedTargetRefOrQuery as CollectionReference).path
        : internal._query.path.canonicalString();

    // DETALLE DE LA CONSULTA (AUDITORÍA SOLICITADA)
    console.log(`[FIRESTORE DIAGNOSTIC] EXECUTION START:`, {
      path,
      auth: currentUid,
      type: memoizedTargetRefOrQuery.type,
      filters: internal._query.filters || [],
      orderBy: internal._query.explicitOrderBy || [],
      limit: internal._query.limit || 'none'
    });

    setIsLoading(true);
    setError(null);

    const unsubscribe = onSnapshot(
      memoizedTargetRefOrQuery,
      (snapshot: QuerySnapshot<DocumentData>) => {
        const results: ResultItemType[] = [];
        for (const doc of snapshot.docs) {
          results.push({ ...(doc.data() as T), id: doc.id });
        }
        
        console.log(`[FIRESTORE DIAGNOSTIC] SUCCESS for [${path}]. Results: ${results.length} docs.`);
        
        setData(results);
        setError(null);
        setIsLoading(false);
      },
      async (serverError: FirestoreError) => {
        console.log(`[FIRESTORE DIAGNOSTIC] ERROR for [${path}]:`, {
          code: serverError.code,
          message: serverError.message,
          auth: currentUid
        });
        
        if (serverError.code === 'permission-denied') {
          const contextualError = new FirestorePermissionError({
            operation: 'list',
            path,
          } satisfies SecurityRuleContext);
          setError(contextualError);
          setData([]); 
        } else {
          setError(serverError);
          setData(null);
        }
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [memoizedTargetRefOrQuery]);
  
  if(memoizedTargetRefOrQuery && !memoizedTargetRefOrQuery.__memo) {
    throw new Error(memoizedTargetRefOrQuery + ' was not properly memoized using useMemoFirebase');
  }
  return { data, isLoading, error };
}
