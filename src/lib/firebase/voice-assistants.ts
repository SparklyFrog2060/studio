
import { addDoc, collection, deleteDoc, doc, Firestore, serverTimestamp, updateDoc } from "firebase/firestore";
import type { VoiceAssistant } from "../types";

export const addVoiceAssistant = (db: Firestore, assistant: Omit<VoiceAssistant, "id" | "createdAt">) => {
    return addDoc(collection(db, "voice_assistants"), {
        ...assistant,
        createdAt: serverTimestamp(),
    });
};

export const updateVoiceAssistant = (db: Firestore, id: string, assistant: Omit<VoiceAssistant, "id" | "createdAt">) => {
    return updateDoc(doc(db, "voice_assistants", id), {
        ...assistant,
    });
}

export const deleteVoiceAssistant = (db: Firestore, id: string) => {
    return deleteDoc(doc(db, "voice_assistants", id));
};
