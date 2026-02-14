
import { addDoc, collection, deleteDoc, doc, Firestore, serverTimestamp } from "firebase/firestore";
import type { Sensor } from "../types";

export const addSensor = (db: Firestore, sensor: Omit<Sensor, "id" | "createdAt">) => {
    return addDoc(collection(db, "sensors"), {
        ...sensor,
        createdAt: serverTimestamp(),
    });
};

export const deleteSensor = (db: Firestore, id: string) => {
    return deleteDoc(doc(db, "sensors", id));
};
