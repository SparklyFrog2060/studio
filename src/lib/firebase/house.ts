import { doc, Firestore, setDoc } from "firebase/firestore";

export const updateHouseConfig = (db: Firestore, gatewayIds: string[]) => {
    const houseConfigRef = doc(db, "house_config", "main");
    return setDoc(houseConfigRef, { gatewayIds });
};

    