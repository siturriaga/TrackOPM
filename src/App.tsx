// /src/App.tsx
import React, { useEffect, useCallback } from "react";
import { auth } from "./firebaseConfig";
import {
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  User,
} from "firebase/auth";

const provider = new GoogleAuthProvider();

export default function App(): JSX.Element {
  useEffect(() => {
    getRedirectResult(auth)
      .then((res) => {
        const user: User | undefined = res?.user ?? undefined;
        if (user) {
          localStorage.setItem("user", JSON.stringify(user));
          // Redirect after successful mobile sign-in (adjust path if needed)
          // window.location.href = "/app";
        }
      })
      .catch((e) => console.error("Redirect error:", e));
  }, []);

  const handleGoogleSignIn = useCallback(async () => {
    try {
      const isMobile = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);
      if (isMobile) {
        await signInWithRedirect(auth, provider); // mobile-safe
      } else {
        await signInWithPopup(auth, provider); // desktop
      }
    } catch (e) {
      console.error("Auth error:", e);
    }
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <button
        onClick={handleGoogleSignIn}
        className="px-6 py-3 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
      >
        Sign in with Google
      </button>
    </div>
  );
}
