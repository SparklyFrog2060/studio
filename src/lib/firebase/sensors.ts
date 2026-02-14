
import { addDoc, collection, deleteDoc, doc, Firestore, serverTimestamp, updateDoc } from "firebase/firestore";
import type { Sensor } from "../types";

export const addSensor = (db: Firestore, sensor: Omit<Sensor, "id" | "createdAt">) => {
    return addDoc(collection(db, "sensors"), {
        ...sensor,
        createdAt: serverTimestamp(),
    });
};

export const updateSensor = (db: Firestore, id: string, sensor: Omit<Sensor, "id" | "createdAt">) => {
    return updateDoc(doc(db, "sensors", id), {
        ...sensor,
    });
}

export const deleteSensor = (db: Firestore, id: string) => {
    return deleteDoc(doc(db, "sensors", id));
};
