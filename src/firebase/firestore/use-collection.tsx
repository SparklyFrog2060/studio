
'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Query,
  onSnapshot,
  DocumentData,
  FirestoreError,
  QuerySnapshot,
  CollectionReference,
  collection,
  orderBy,
  query,
} from 'firebase/firestore';
import { useFirestore } from '../provider';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

/** Utility type to add an 'id' field to a given type T. */
export type WithId<T> = T & { id: string };

/**
 * Interface for the return value of the useCollection hook.
 * @template T Type of the document data.
 */
export interface UseCollectionResult<T> {
  data: WithId<T>[] | null;
  isLoading: boolean;
  error: FirestoreError | Error | null;
}

export interface InternalQuery extends Query<DocumentData> {
  _query: {
    path: {
      canonicalString(): string;
      toString(): string;
    };
  };
}

interface CollectionOptions {
  sort?: {
    field: string;
    direction: 'asc' | 'desc';
  };
}

/**
 * React hook to subscribe to a Firestore collection in real-time.
 *
 * @template T Optional type for document data. Defaults to any.
 * @param {string | null} collectionPath - The path to the Firestore collection. If null, the hook will not fetch data.
 * @param {CollectionOptions} [options] - Options for sorting the collection data.
 * @returns {UseCollectionResult<T>} Object with data, isLoading, error.
 */
export function useCollection<T = any>(
  collectionPath: string | null,
  options?: CollectionOptions
): UseCollectionResult<T> {
  type ResultItemType = WithId<T>;
  type StateDataType = ResultItemType[] | null;

  const [data, setData] = useState<StateDataType>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<FirestoreError | Error | null>(null);

  const firestore = useFirestore();

  const memoizedQuery = useMemo(() => {
    if (!firestore || !collectionPath) {
      return null;
    }
    const collRef = collection(firestore, collectionPath);
    if (options?.sort) {
      return query(
        collRef,
        orderBy(options.sort.field, options.sort.direction)
      );
    }
    return collRef;
  }, [firestore, collectionPath, options?.sort?.field, options?.sort?.direction]);

  useEffect(() => {
    if (!memoizedQuery) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    const unsubscribe = onSnapshot(
      memoizedQuery,
      (snapshot: QuerySnapshot<DocumentData>) => {
        const results: ResultItemType[] = snapshot.docs.map(
          (doc) => ({ ...(doc.data() as T), id: doc.id })
        );
        setData(results);
        setError(null);
        setIsLoading(false);
      },
      (err: FirestoreError) => {
        const path = (memoizedQuery as unknown as InternalQuery)._query.path.canonicalString();
        const contextualError = new FirestorePermissionError({
          operation: 'list',
          path,
        });

        setError(contextualError);
        setData(null);
        setIsLoading(false);
        errorEmitter.emit('permission-error', contextualError);
      }
    );

    return () => unsubscribe();
  }, [memoizedQuery]);

  return { data, isLoading, error };
}
