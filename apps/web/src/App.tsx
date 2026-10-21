import React from 'react';
import { GameView } from './components/GameView';

export const App: React.FC = () => {
  return (
    <main
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '1.5rem',
      }}
    >
      <header style={{ marginBottom: '1rem', textAlign: 'center' }}>
        <h1 style={{ fontSize: '1.8rem', color: '#58a6ff', letterSpacing: '2px' }}>VANGUARDA</h1>
        <p style={{ color: '#8b949e', fontSize: '0.85rem' }}>
          Protótipo do Núcleo — Fase 2 (60 FPS Fixed Time-Step)
        </p>
      </header>

      <GameView />
    </main>
  );
};
