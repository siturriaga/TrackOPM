// Firebase client initializer (modular SDK via CDN).
// Fetches config from Netlify function and exposes Auth + Firestore.

import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getAuth, onAuthStateChanged, GoogleAuthProvider, signInWithPopup, signOut
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import {
  getFirestore, collection, doc, setDoc, getDoc, getDocs, addDoc, query, where, orderBy, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

let app, auth, db;

async function fetchConfig() {
  const res = await fetch('/.netlify/functions/firebaseClientConfig');
  if (!res.ok) throw new Error('Failed to load Firebase config');
  return res.json();
}

export async function initFirebase() {
  if (getApps().length) return { app, auth, db };
  const cfg = await fetchConfig();
  app = initializeApp(cfg);
  auth = getAuth(app);
  db   = getFirestore(app);
  return { app, auth, db };
}

export {
  auth, db, onAuthStateChanged, GoogleAuthProvider, signInWithPopup, signOut,
  collection, doc, setDoc, getDoc, getDocs, addDoc, query, where, orderBy, serverTimestamp
};
