import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth, setPersistence, browserLocalPersistence,
  GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  getFirestore, collection, doc, setDoc, getDoc, getDocs, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

let firebaseApp, auth, db;

const sleep = (ms) => new Promise(r => setTimeout(r, ms));
async function fetchWithTimeout(url, ms = 8000) {
  const ctrl = new AbortController(); const t = setTimeout(() => ctrl.abort(), ms);
  try { return await fetch(url, { signal: ctrl.signal }); } finally { clearTimeout(t); }
}
async function getFirebaseConfig(retries = 2) {
  let attempt = 0, lastErr;
  while (attempt <= retries) {
    try {
      const res = await fetchWithTimeout("/.netlify/functions/firebaseClientConfig", 8000);
      if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
      return await res.json();
    } catch (e) { lastErr = e; await sleep(500 * (attempt + 1)); attempt++; }
  }
  throw new Error(`Failed to fetch Firebase config: ${lastErr?.message || lastErr}`);
}

export async function initializeFirebase() {
  if (firebaseApp && auth && db) return { app: firebaseApp, auth, db };

  const firebaseConfig = await getFirebaseConfig();
  firebaseApp = initializeApp(firebaseConfig);
  auth = getAuth(firebaseApp);
  await setPersistence(auth, browserLocalPersistence); // keep user signed in
  db = getFirestore(firebaseApp);

  return { app: firebaseApp, auth, db };
}

export {
  auth, db, getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut,
  collection, doc, setDoc, getDoc, getDocs, serverTimestamp
};
