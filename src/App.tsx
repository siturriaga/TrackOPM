import React from 'react'
import AuthGate from './components/AuthGate'
import Header from './components/Header'
import Dashboard from './components/Dashboard'

export default function App() {
  return (
    <AuthGate>
      <div className="min-h-screen">
        <Header />
        <main className="mx-auto max-w-6xl px-4 py-6">
          <Dashboard />
        </main>
      </div>
    </AuthGate>
  )
}
