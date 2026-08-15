import { useState } from 'react';

export interface HomeScreenProps {
  onCreate: () => void;
  onJoin: (code: string) => void;
  busy: boolean;
  error: string | null;
}

export function HomeScreen({ onCreate, onJoin, busy, error }: HomeScreenProps) {
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

      <details className="rules-summary">
        <summary>Quick rules</summary>
        <ul>
          <li>Surround the opponent's Queen Bee on all six sides to win.</li>
          <li>You must place your Queen by your 4th placement.</li>
          <li>You can't move any piece until your Queen is on the board.</li>
          <li>New pieces may only touch your own color (except the very first two placements).</li>
          <li>The hive can never be split into two groups.</li>
          <li>Queen &amp; Beetle move 1 step, Spider exactly 3, Ant any distance, Grasshopper jumps in a line, Beetle can climb on top of the hive.</li>
        </ul>
      </details>
    </div>
  );
}
