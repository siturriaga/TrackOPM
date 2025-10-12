import React from 'react'
import { useAuth } from './AuthGate'

export default function Header() {
  const user = useAuth()
  return (
    <header className="w-full border-b border-white/30 backdrop-blur bg-white/60">
      <div className="mx-auto max-w-6xl px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src="/logo.svg" className="h-8 w-8" alt="Synapse logo" />
          <div>
            <h1 className="font-display text-xl tracking-tight">Synapse</h1>
            <p className="text-xs text-gray-500 -mt-1">Bridging the Gap in Education</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {user && (
            <div className="flex items-center gap-2">
              {user.photoURL && <img src={user.photoURL} alt={user.displayName ?? 'Teacher'} className="h-8 w-8 rounded-full" />}
              <span className="text-sm text-gray-700">{user.displayName ?? 'Teacher'}</span>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
