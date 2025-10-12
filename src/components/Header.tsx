import React from 'react';
import { Button } from './Buttons';

export default function Header({
  onBack,
  onExit,
}: {
  onBack?: () => void;
  onExit?: () => void;
}) {
  return (
    <header className="w-full sticky top-0 z-10 bg-white/80 backdrop-blur border-b border-gray-100">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src="/logo.svg" alt="Synapse" className="w-9 h-9" />
          <div>
            <h1 className="text-lg font-semibold tracking-tight">Synapse</h1>
            <p className="text-xs text-gray-500 -mt-0.5">Bridging the gap in education.</p>
          </div>
        </div>
        <div className="flex gap-2">
          {onBack && <Button variant="outline" onClick={onBack}>Back</Button>}
          {onExit && <Button variant="outline" onClick={onExit}>Exit</Button>}
        </div>
      </div>
    </header>
  );
}
