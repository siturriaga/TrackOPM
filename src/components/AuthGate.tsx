// src/components/AuthGate.tsx
import React, { useEffect, useState } from 'react';
import { auth, provider } from '../lib/firebase';
import { signInWithPopup, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { Button } from './Buttons';

const AuthGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleSignIn = async () => {
    try {
      await signInWithPopup(auth, provider);
    } catch (e) {
      console.error('Sign-in error:', e);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (e) {
      console.error('Sign-out error:', e);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center text-gray-500">
        Loading...
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-gray-50 text-center">
        <h1 className="mb-4 text-3xl font-bold text-gray-800">Welcome to Synapse Co-Pilot</h1>
        <p className="mb-6 text-gray-600">Please sign in with your Google account to continue.</p>
        <Button onClick={handleSignIn}>Sign in with Google</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="flex items-center justify-between bg-blue-600 p-4 text-white">
        <h1 className="text-lg font-semibold">Synapse Co-Pilot</h1>
        <div className="flex items-center gap-3">
          {user.photoURL && (
            <img
              src={user.photoURL}
              alt="User Avatar"
              className="h-8 w-8 rounded-full border border-white"
            />
          )}
          <span className="text-sm">{user.displayName || user.email}</span>
          <Button onClick={handleSignOut}>Sign Out</Button>
        </div>
      </header>
      <main className="flex-1 bg-white">{children}</main>
    </div>
  );
};

export default AuthGate;
