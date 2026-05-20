import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, doc, getDocFromServer } from "firebase/firestore";
import firebaseConfig from "../firebase-applet-config.json";

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId); /* CRITICAL: The app will break without this line */
export const auth = getAuth(app);

// Validate Connection to Firestore on boot
export async function testConnection() {
  try {
    const testDocRef = doc(db, "test", "connection");
    await getDocFromServer(testDocRef);
    console.log("Firebase Firestore connection verified successfully!");
  } catch (error) {
    if (error instanceof Error && error.message.includes("the client is offline")) {
      console.warn("Please check your Firebase configuration or network status.", error);
    } else {
      console.log("Firestore connection test completed (document may not exist, but network is alive).");
    }
  }
}
