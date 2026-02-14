'use client';
import {
  doc,
  onSnapshot,
  DocumentData,
} from 'firebase/firestore';
import { useEffect, useState } from 'react';

import { useFirestore } from '../provider';

type DocHook = {
  data: any | null;
  loading: boolean;
  error: Error | null;
};

export function useDoc(
  path: string,
  docId: string
): DocHook {
  const db = useFirestore();
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!db) {
      return;
    }
    setLoading(true);

    const docRef = doc(db, path, docId);

    const unsubscribe = onSnapshot(
      docRef,
      (docSnap) => {
        if (docSnap.exists()) {
          setData({ id: docSnap.id, ...docSnap.data() });
        } else {
          setData(null);
        }
        setLoading(false);
      },
      (err) => {
        console.error(err);
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [db, path, docId]);

  return { data, loading, error };
}
