'use client';
import { FirebaseApp } from 'firebase/app';
import { Auth } from 'firebase/auth';
import { Firestore } from 'firebase/firestore';
import React, { createContext, useContext } from 'react';

interface FirebaseProviderProps {
  children: React.ReactNode;
  app: FirebaseApp;
  auth: Auth;
  db: Firestore;
}

const FirebaseAppContext = createContext<FirebaseApp | null>(null);
const AuthContext = createContext<Auth | null>(null);
const FirestoreContext = createContext<Firestore | null>(null);

export function FirebaseProvider({
  children,
  app,
  auth,
  db,
}: FirebaseProviderProps) {
  return (
    <FirebaseAppContext.Provider value={app}>
      <AuthContext.Provider value={auth}>
        <FirestoreContext.Provider value={db}>
            {children}
        </FirestoreContext.Provider>
      </AuthContext.Provider>
    </FirebaseAppContext.Provider>
  );
}

export const useFirebaseApp = () => useContext(FirebaseAppContext);
export const useAuth = () => useContext(AuthContext);
export const useFirestore = () => useContext(FirestoreContext);
