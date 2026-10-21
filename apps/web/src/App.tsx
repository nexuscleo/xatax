import React from 'react';
import { CORE_VERSION, STEP } from '@vanguarda/core';

export const App: React.FC = () => {
  return (
    <main style={{ textAlign: 'center', padding: '2rem' }}>
      <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem', color: '#58a6ff' }}>
        Olá, Vanguarda!
      </h1>
      <p style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>
        Shoot 'em up horizontal em React (Web) e React Native (Mobile).
      </p>
      <div
        style={{
          marginTop: '1.5rem',
          padding: '1rem',
          backgroundColor: '#161b22',
          borderRadius: '8px',
          display: 'inline-block',
          border: '1px solid #30363d',
        }}
      >
        <p>
          <strong>Núcleo (@vanguarda/core):</strong> v{CORE_VERSION}
        </p>
        <p>
          <strong>Passo Fixo de Simulação:</strong> {STEP.toFixed(4)}s (60 FPS)
        </p>
      </div>
    </main>
  );
};
