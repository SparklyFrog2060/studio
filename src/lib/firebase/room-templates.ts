import { addDoc, collection, deleteDoc, doc, Firestore, serverTimestamp } from "firebase/firestore";
import type { RoomTemplate } from "../types";

export const addRoomTemplate = (db: Firestore, template: Omit<RoomTemplate, "id" | "createdAt">) => {
    return addDoc(collection(db, "room_templates"), {
        ...template,
        createdAt: serverTimestamp(),
    });
};

export const deleteRoomTemplate = (db: Firestore, id: string) => {
    return deleteDoc(doc(db, "room_templates", id));
};
