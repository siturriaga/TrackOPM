import React from 'react'
import Header from './components/Header'
import AuthGate from './components/AuthGate'
import Dashboard from './components/Dashboard'


export default function App() {
return (
<AuthGate>
<Header onBack={undefined} onExit={() => window.location.assign('/')} />
<Dashboard />
</AuthGate>
)
}
