import React, { useEffect, useState } from 'react'
import { auth, provider } from '../lib/firebase'
import {
  signInWithPopup,
  signInWithRedirect,
  signOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth'
import { Button } from './Buttons'

const AuthContext = React.createContext<User | null>(null)
export const useAuth = () => React.useContext(AuthContext)

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
      // Fallback if popup blocked or CSP/frame restrictions
      if (e?.code?.includes('popup') || String(e?.message).toLowerCase().includes('popup')) {
        try {
          await signInWithRedirect(auth, provider)
          return
        } catch (e2: any) {
          setError(e2?.message ?? 'Sign-in failed.')
          return
        }
      }
      setError(e?.message ?? 'Sign-in failed.')
    }
  }

  if (loading) return <div className="py-24 text-center text-slate-500">Loading…</div>

  if (!user) {
    return (
      <div className="glass max-w-xl mx-auto my-12 p-8 text-center">
        <h2 className="font-display text-2xl">Welcome to Synapse</h2>
        <p className="mt-2 text-slate-600">Sign in with Google to access your dashboard.</p>
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        <div className="mt-6">
          <Button onClick={handleSignIn}>Sign in with Google</Button>
        </div>
        <p className="mt-4 text-xs text-slate-500">
          By signing in, you agree to our teacher-friendly privacy policy.
        </p>
      </div>
    )
  }

  return (
    <AuthContext.Provider value={user}>
      {children}
      <div className="fixed bottom-4 right-4">
        <Button variant="ghost" onClick={() => signOut(auth)}>Sign out</Button>
      </div>
    </AuthContext.Provider>
  )
}
