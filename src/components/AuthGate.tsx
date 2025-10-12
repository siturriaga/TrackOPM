import React from 'react'
import { auth, provider } from '../lib/firebase'
import { signInWithPopup, signOut, onAuthStateChanged, User } from 'firebase/auth'
import { Button } from './Buttons'


export default function AuthGate({ children }: { children: React.ReactNode }) {
const [user, setUser] = React.useState<User | null>(null)
const [loading, setLoading] = React.useState(true)


React.useEffect(() => {
const unsub = onAuthStateChanged(auth, u => { setUser(u); setLoading(false) })
return () => unsub()
}, [])


async function googleLogin() {
await signInWithPopup(auth, provider)
}


async function logout() {
await signOut(auth)
}


if (loading) return <div className="p-8 text-center">Loading…</div>


if (!user) {
return (
<div className="min-h-screen grid place-items-center">
<div className="max-w-md w-full p-8 rounded-2xl border border-gray-200 shadow-soft text-center">
<img src="/logo.svg" alt="logo" className="mx-auto w-16 h-16 mb-3" />
<h2 className="text-xl font-semibold">Welcome to Synapse</h2>
<p className="text-gray-600 text-sm mb-6">Bridging the gap in education.</p>
<Button onClick={googleLogin}>Sign in with Google</Button>
</div>
</div>
)
}


return (
<div>
<div className="max-w-6xl mx-auto px-4 py-2 flex justify-end">
<Button variant="outline" onClick={logout}>Sign out</Button>
</div>
{children}
</div>
)
}
