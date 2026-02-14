'use client';
import { FirebaseApp, initializeApp } from 'firebase/app';
import { Auth, getAuth } from 'firebase/auth';
import { Firestore, getFirestore } from 'firebase/firestore';
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
} from 'react';

import { firebaseConfig } from './config';
import { FirebaseProvider } from './provider';

interface FirebaseContextValue {
  app: FirebaseApp;
  auth: Auth;
  db: Firestore;
}

const FirebaseContext = createContext<FirebaseContextValue | null>(null);

export function FirebaseClientProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [firebase, setFirebase] = useState<FirebaseContextValue | null>(null);

  useEffect(() => {
    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    const db = getFirestore(app);

    setFirebase({ app, auth, db });
  }, []);

  if (!firebase) {
    // You can return a loader here
    return null;
  }

  return (
    <FirebaseContext.Provider value={firebase}>
      <FirebaseProvider app={firebase.app} auth={firebase.auth} db={firebase.db}>
        {children}
      </FirebaseProvider>
    </FirebaseContext.Provider>
  );
}

export const useFirebase = () => {
  const context = useContext(FirebaseContext);
  if (!context) {
    throw new Error(
      'useFirebase must be used within a FirebaseClientProvider'
    );
  }
  return context;
};
