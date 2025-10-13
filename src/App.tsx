// /src/App.tsx
import React from "react";

export default function App(): JSX.Element {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <button
        id="googleSignInBtn"
        className="px-6 py-3 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
      >
        Sign in with Google
      </button>
    </div>
  );
}
