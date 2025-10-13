import React, { useEffect, useState } from 'react'
import { auth, provider } from '../lib/firebase'
import {
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
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

  useEffect(() => {
    let mounted = true

    getRedirectResult(auth).catch((e: any) => {
      if (mounted) setError(e?.message ?? 'Sign-in failed.')
    })

    const unsub = onAuthStateChanged(auth, (u) => {
      if (!mounted) return
      setUser(u)
      setLoading(false)
    })

    const timeout = setTimeout(() => {
      if (mounted) setLoading(false)
    }, 6000)

    return () => {
      mounted = false
      unsub()
      clearTimeout(timeout)
    }
  }, [])

  async function handleSignIn() {
    setError(null)
    try {
      await signInWithPopup(auth, provider)
    } catch (e: any) {
      if (
        e?.code?.includes('popup') ||
        String(e?.message || '').toLowerCase().includes('popup')
      ) {
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
          <Button onClick={handleSignIn}>Sign in with Google</Button>
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
