// src/components/AuthGate.tsx
import React, { useEffect, useState } from 'react';
import { auth, provider } from '../lib/firebase';
import { signInWithPopup, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { Button } from './Buttons';

export const AuthGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // ✅ Watch for authentication state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // ✅ Sign in with Google
  const handleSignIn = async () => {
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error('Error signing in:', error);
    }
  };

  // ✅ Sign out
  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen text-gray-500">
        Loading...
      </div>
    );
  }

  // ✅ If user not signed in
  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-50 text-center">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">Welcome to Synapse Co-Pilot</h1>
        <p className="text-gray-600 mb-6">Please sign in with your Google account to continue.</p>
        <Button onClick={handleSignIn}>Sign in with Google</Button>
      </div>
    );
  }

  // ✅ If user is signed in
  return (
    <div className="min-h-screen flex flex-col">
      <header className="flex items-center justify-between p-4 bg-blue-600 text-white">
        <h1 className="text-lg font-semibold">Synapse Co-Pilot</h1>
        <div className="flex items-center space-x-4">
          {user.photoURL && (
            <img
              src={user.photoURL}
              alt="User Avatar"
              className="w-8 h-8 rounded-full border border-white"
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
