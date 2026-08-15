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
      <p className="tagline">Ett spel för två spelare, var och en på sin egen telefon eller platta.</p>

      <button className="primary-button" onClick={onCreate} disabled={busy}>
        Starta nytt spel
      </button>

      <div className="join-row">
        <input
          type="text"
          inputMode="text"
          autoCapitalize="characters"
          placeholder="RUMSKOD"
          maxLength={4}
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
        />
        <button
          className="secondary-button"
          onClick={() => onJoin(code)}
          disabled={busy || code.trim().length === 0}
        >
          Gå med i spel
        </button>
      </div>

      {error && <p className="error-banner">{error}</p>}

      <button className="secondary-button rules-button" onClick={onShowRules}>
        📖 Spelregler
      </button>
    </div>
  );
}
