import { addDoc, collection, deleteDoc, doc, Firestore, serverTimestamp, updateDoc } from "firebase/firestore";
import type { Switch } from "../types";

export const addSwitch = (db: Firestore, item: Omit<Switch, "id" | "createdAt">) => {
    return addDoc(collection(db, "switches"), {
        ...item,
        createdAt: serverTimestamp(),
    });
};

export const updateSwitch = (db: Firestore, id: string, item: Omit<Switch, "id" | "createdAt">) => {
    return updateDoc(doc(db, "switches", id), {
        ...item,
    });
}

export const deleteSwitch = (db: Firestore, id: string) => {
    return deleteDoc(doc(db, "switches", id));
};
