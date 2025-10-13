// src/components/AuthGate.tsx
import React, { useEffect, useState } from 'react'
import { auth, provider } from '../lib/firebase'
import {
  signInWithPopup,
  signInWithRedirect,
  signOut,
  onAuthStateChanged,
  User
} from 'firebase/auth'
import { Button } from './Buttons'

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u)
      setLoading(false)
    })
    return () => unsub()
  }, [])

  async function handleSignIn() {
    setError(null)
    try {
      await signInWithPopup(auth, provider)
    } catch (e: any) {
      // Common: auth/popup-blocked or CSP/frame issues → use redirect fallback
      if (e?.code === 'auth/popup-blocked' || e?.message?.includes('popup')) {
        try {
          await signInWithRedirect(auth, provider)
        } catch (e2: any) {
          setError(e2?.message ?? 'Sign-in failed.')
        }
      } else {
        setError(e?.message ?? 'Sign-in failed.')
      }
    }
  }

  if (loading) {
    return <div className="py-24 text-center text-gray-600">Loading…</div>
  }

  if (!user) {
    return (
      <div className="max-w-lg mx-auto my-10 rounded-2xl bg-white/70 backdrop-blur p-8 shadow text-center">
        <h2 className="font-display text-2xl">Welcome to Synapse</h2>
        <p className="mt-2 text-gray-600">Sign in with Google to access your dashboard.</p>
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        <div className="mt-6">
          <Button onClick={handleSignIn} variant="primary">
            Sign in with Google
          </Button>
        </div>
        <p className="mt-4 text-xs text-gray-500">
          By signing in, you agree to our teacher-friendly privacy policy.
        </p>
      </div>
    )
  }

  return (
    <AuthContext.Provider value={user}>
      {children}
      <div className="fixed bottom-4 right-4">
        <Button onClick={() => signOut(auth)} variant="ghost">Sign out</Button>
      </div>
    </AuthContext.Provider>
  )
}

export const AuthContext = React.createContext<User | null>(null)
export const useAuth = () => React.useContext(AuthContext)
