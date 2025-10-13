import React, { useEffect, useState } from 'react'
import { auth, provider } from '../lib/firebase'
import {
  signInWithPopup,
  onAuthStateChanged,
  signOut,
  User,
} from 'firebase/auth'
import { Button } from './Buttons'

const AuthContext = React.createContext<User | null>(null)
export const useAuth = () => React.useContext(AuthContext)

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [inProgress, setInProgress] = useState(false)

  // Single source of truth for auth state
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u)
      setLoading(false)
      setInProgress(false)
    })
    return () => unsub()
  }, [])

  async function handleSignIn() {
    if (inProgress) return
    setInProgress(true)
    setError(null)
    try {
      await signInWithPopup(auth, provider)
    } catch (e: any) {
      setError(e?.message ?? 'Sign-in failed.')
      setInProgress(false)
    }
  }

  if (loading)
    return <div className="py-24 text-center text-slate-500">Loading…</div>

  if (!user)
    return (
      <div className="max-w-xl mx-auto my-12 p-8 text-center">
        <h2 className="text-2xl font-semibold text-slate-800">Welcome to Synapse</h2>
        <p className="mt-2 text-slate-600">
          Sign in with Google to access your dashboard.
        </p>
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        <div className="mt-6">
          <Button disabled={inProgress} onClick={handleSignIn}>
            {inProgress ? 'Signing in…' : 'Sign in with Google'}
          </Button>
        </div>
      </div>
    )

  return (
    <AuthContext.Provider value={user}>
      {children}
      <div className="fixed bottom-4 right-4">
        <Button variant="ghost" onClick={() => signOut(auth)}>
          Sign out
        </Button>
      </div>
    </AuthContext.Provider>
  )
}
