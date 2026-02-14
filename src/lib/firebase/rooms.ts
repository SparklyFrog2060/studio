
import { addDoc, collection, deleteDoc, doc, Firestore, serverTimestamp, updateDoc } from "firebase/firestore";
import type { Room } from "../types";

export const addRoom = (db: Firestore, room: Omit<Room, "id" | "createdAt">) => {
    return addDoc(collection(db, "rooms"), {
        ...room,
        createdAt: serverTimestamp(),
    });
};

export const updateRoom = (db: Firestore, id: string, room: Partial<Omit<Room, "id" | "createdAt" | "floorId">>) => {
    return updateDoc(doc(db, "rooms", id), {
        ...room,
    });
}

export const deleteRoom = (db: Firestore, id: string) => {
    return deleteDoc(doc(db, "rooms", id));
};

    