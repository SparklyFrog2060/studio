
import { addDoc, collection, deleteDoc, doc, Firestore, serverTimestamp, updateDoc } from "firebase/firestore";
import type { Lighting } from "../types";

export const addLighting = (db: Firestore, item: Omit<Lighting, "id" | "createdAt">) => {
    return addDoc(collection(db, "lighting"), {
        ...item,
        createdAt: serverTimestamp(),
    });
};

export const updateLighting = (db: Firestore, id: string, item: Omit<Lighting, "id" | "createdAt">) => {
    return updateDoc(doc(db, "lighting", id), {
        ...item,
    });
}

export const deleteLighting = (db: Firestore, id: string) => {
    return deleteDoc(doc(db, "lighting", id));
};
