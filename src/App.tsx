import React from 'react'
import { Toaster } from 'react-hot-toast'
import AuthGate from './components/AuthGate'
import Header from './components/Header'
import Dashboard from './components/Dashboard'

export default function App(): JSX.Element {
  return (
    <>
      <Toaster position="bottom-center" />
      <AuthGate>
        <Header />
        <main className="mx-auto max-w-6xl p-4">
          <Dashboard />
        </main>
      </AuthGate>
    </>
  )
}
