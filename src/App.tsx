// /src/App.tsx
import React, { useEffect, useCallback } from "react";
import { initializeApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  User,
} from "firebase/auth";

// Firebase init (Vite envs)
const app = initializeApp({
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY as string,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID as string,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET as string,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID as string,
  appId: import.meta.env.VITE_FIREBASE_APP_ID as string,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID as string,
});

const auth = getAuth(app);
const provider = new GoogleAuthProvider();

export default function App(): JSX.Element {
  useEffect(() => {
    getRedirectResult(auth)
      .then((res) => {
        const user: User | undefined = res?.user ?? undefined;
        if (user) {
          localStorage.setItem("user", JSON.stringify(user));
          // window.location.href = "/app"; // optional redirect
        }
      })
      .catch((e) => console.error("Redirect error:", e));
  }, []);

  const handleGoogleSignIn = useCallback(async () => {
    try {
      const isMobile = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);
      if (isMobile) await signInWithRedirect(auth, provider);
      else await signInWithPopup(auth, provider);
    } catch (e) {
      console.error("Auth error:", e);
    }
  }, []);

  return (
    <>
      {/* Your existing landing JSX stays here. Do not remove it. */}
      {/* Add the button below anywhere in your layout (kept minimal, no placeholders): */}
      <button
        onClick={handleGoogleSignIn}
        className="fixed top-4 right-4 z-50 px-4 py-2 rounded bg-blue-600 text-white"
        aria-label="Sign in with Google"
      >
        Sign in
      </button>
    </>
  );
}
