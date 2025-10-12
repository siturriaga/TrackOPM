import React, { useEffect, useState } from 'react'
import { auth, provider } from '../lib/firebase'
import { signInWithPopup, signOut, onAuthStateChanged, User } from 'firebase/auth'
import { Button } from './Buttons'

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u)
      setLoading(false)
    })
    return () => unsub()
  }, [])

  if (loading) {
    return (
      <div className="py-24 text-center text-gray-600">Loading…</div>
    )
  }

  if (!user) {
    return (
      <div className="max-w-lg mx-auto my-10 rounded-2xl bg-white/70 backdrop-blur p-8 shadow text-center">
        <h2 className="font-display text-2xl">Welcome to Synapse</h2>
        <p className="mt-2 text-gray-600">Sign in with Google to access your dashboard.</p>
        <div className="mt-6">
          <Button
            onClick={async () => {
              await signInWithPopup(auth, provider)
            }}
            variant="primary"
          >
            Sign in with Google
          </Button>
        </div>
        <p className="mt-4 text-xs text-gray-500">By signing in, you agree to our teacher-friendly privacy policy.</p>
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

export const AuthContext = React.createContext<import('firebase/auth').User | null>(null)
export const useAuth = () => React.useContext(AuthContext)
