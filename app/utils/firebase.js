import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, collection, doc, setDoc, getDoc, getDocs, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

let firebaseApp;
let auth;
let db;

async function getFirebaseConfig() {
    try {
        const response = await fetch('/.netlify/functions/firebaseClientConfig');
        if (!response.ok) {
            throw new Error(`Failed to fetch Firebase config: ${response.statusText}`);
        }
        return await response.json();
    } catch (error) {
        console.error("Could not fetch Firebase config:", error);
        throw error;
    }
}

export async function initializeFirebase() {
    if (firebaseApp) {
        return { app: firebaseApp, auth, db };
    }
    
    const firebaseConfig = await getFirebaseConfig();
    firebaseApp = initializeApp(firebaseConfig);
    auth = getAuth(firebaseApp);
    db = getFirestore(firebaseApp);
    
    return { app: firebaseApp, auth, db };
}

export { auth, db, getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut, collection, doc, setDoc, getDoc, getDocs, serverTimestamp };
