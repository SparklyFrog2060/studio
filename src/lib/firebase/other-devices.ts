
import { addDoc, collection, deleteDoc, doc, Firestore, serverTimestamp, updateDoc } from "firebase/firestore";
import type { OtherDevice } from "../types";

export const addOtherDevice = (db: Firestore, item: Omit<OtherDevice, "id" | "createdAt">) => {
    return addDoc(collection(db, "other_devices"), {
        ...item,
        createdAt: serverTimestamp(),
    });
};

export const updateOtherDevice = (db: Firestore, id: string, item: Omit<OtherDevice, "id" | "createdAt">) => {
    return updateDoc(doc(db, "other_devices", id), {
        ...item,
    });
}

export const deleteOtherDevice = (db: Firestore, id: string) => {
    return deleteDoc(doc(db, "other_devices", id));
};

    