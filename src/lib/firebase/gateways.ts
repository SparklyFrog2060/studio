
import { addDoc, collection, deleteDoc, doc, Firestore, serverTimestamp, updateDoc } from "firebase/firestore";
import type { Gateway } from "../types";

export const addGateway = (db: Firestore, item: Omit<Gateway, "id" | "createdAt">) => {
    return addDoc(collection(db, "gateways"), {
        ...item,
        createdAt: serverTimestamp(),
    });
};

export const updateGateway = (db: Firestore, id: string, item: Omit<Gateway, "id" | "createdAt">) => {
    return updateDoc(doc(db, "gateways", id), {
        ...item,
    });
}

export const deleteGateway = (db: Firestore, id: string) => {
    return deleteDoc(doc(db, "gateways", id));
};
