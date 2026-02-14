
import { addDoc, collection, deleteDoc, doc, Firestore, serverTimestamp, updateDoc } from "firebase/firestore";
import type { Floor } from "../types";

export const addFloor = (db: Firestore, floor: Omit<Floor, "id" | "createdAt">) => {
    return addDoc(collection(db, "floors"), {
        ...floor,
        createdAt: serverTimestamp(),
    });
};

export const updateFloor = (db: Firestore, id: string, floor: Partial<Omit<Floor, "id">>) => {
    return updateDoc(doc(db, "floors", id), floor);
}

export const deleteFloor = (db: Firestore, id: string) => {
    return deleteDoc(doc(db, "floors", id));
};
