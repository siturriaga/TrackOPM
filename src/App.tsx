import React from 'react';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import AuthGate from './components/AuthGate';

const App: React.FC = () => {
  return (
    <AuthGate>
      <Header />
      <Dashboard />
    </AuthGate>
  );
};

export default App; // <-- REQUIRED
