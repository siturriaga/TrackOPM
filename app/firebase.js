import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, collection, doc, setDoc, getDoc, getDocs, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

let firebaseApp, auth, db;

async function getFirebaseConfig() {
  const res = await fetch('/.netlify/functions/firebaseClientConfig');
  if (!res.ok) throw new Error(`Failed to fetch Firebase config: ${res.statusText}`);
  return await res.json();
}

export async function initializeFirebase() {
  if (firebaseApp) return { app: firebaseApp, auth, db };
  const firebaseConfig = await getFirebaseConfig();
  firebaseApp = initializeApp(firebaseConfig);
  auth = getAuth(firebaseApp);
  db = getFirestore(firebaseApp);
  return { app: firebaseApp, auth, db };
}

export {
  auth, db, getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut,
  collection, doc, setDoc, getDoc, getDocs, serverTimestamp
};
