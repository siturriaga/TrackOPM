import React from 'react'
import Header from './components/Header'
import Dashboard from './components/Dashboard'
import AuthGate from './components/AuthGate'

export default function App() {
  return (
    <div className="min-h-screen bg-slate-50 font-body text-slate-800">
      <Header />
      <main className="max-w-6xl mx-auto px-4 py-8">
        <AuthGate>
          <Dashboard />
        </AuthGate>
      </main>
    </div>
  )
}
