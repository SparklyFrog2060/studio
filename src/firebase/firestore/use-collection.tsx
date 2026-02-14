'use client';
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  Query,
  DocumentData,
  where,
  WhereFilterOp,
  getDocs,
  limit,
  startAfter,
  endBefore,
  limitToLast,
  doc,
  getDoc,
  Timestamp,
} from 'firebase/firestore';
import { useEffect, useMemo, useReducer, useState } from 'react';

import { useFirestore } from '../provider';

type CollectionHook = {
  data: any[];
  loading: boolean;
  error: Error | null;
};

export function useCollection(
  collectionName: string,
  options?: {
    sort?: {
      field: string;
      direction: 'asc' | 'desc';
    };
    filter?: {
      field: string;
      operator: WhereFilterOp;
      value: any;
    };
  }
): CollectionHook {
  const db = useFirestore();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const queryString = options?.sort?.field + options?.sort?.direction + JSON.stringify(options?.filter);

  useEffect(() => {
    if (!db) {
      return;
    }
    setLoading(true);

    let q: Query<DocumentData> = collection(db, collectionName);

    if (options?.filter) {
      q = query(
        q,
        where(
          options.filter.field,
          options.filter.operator,
          options.filter.value
        )
      );
    }

    if (options?.sort) {
      q = query(q, orderBy(options.sort.field, options.sort.direction));
    }

    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const docs = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setData(docs);
        setLoading(false);
      },
      (err) => {
        console.error(err);
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [db, collectionName, queryString]);

  return { data, loading, error };
}
