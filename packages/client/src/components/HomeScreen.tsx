import { useState } from 'react';

export interface HomeScreenProps {
  onCreate: () => void;
  onJoin: (code: string) => void;
  onShowRules: () => void;
  busy: boolean;
  error: string | null;
}

export function HomeScreen({ onCreate, onJoin, onShowRules, busy, error }: HomeScreenProps) {
  const [code, setCode] = useState('');

  return (
    <div className="home-screen">
      <h1>
        <span className="hive-emoji">🐝</span> Hive
      </h1>
      <p className="tagline">A game for two players, each on their own phone or tablet.</p>

      <button className="primary-button" onClick={onCreate} disabled={busy}>
        Create New Game
      </button>

      <div className="join-row">
        <input
          type="text"
          inputMode="text"
          autoCapitalize="characters"
          placeholder="ROOM CODE"
          maxLength={4}
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
        />
        <button
          className="secondary-button"
          onClick={() => onJoin(code)}
          disabled={busy || code.trim().length === 0}
        >
          Join Game
        </button>
      </div>

      {error && <p className="error-banner">{error}</p>}

      <button className="secondary-button rules-button" onClick={onShowRules}>
        📖 How to play
      </button>
    </div>
  );
}
