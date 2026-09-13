import type { Color, Difficulty, GameStatus } from '@hive/shared';
import { DIFFICULTY_LABEL } from '../difficulty.js';

export interface StatusBarProps {
  code: string;
  myColor: Color;
  turn: Color;
  status: GameStatus;
  opponentConnected: boolean;
  vsBot: boolean;
  botDifficulty?: Difficulty;
  canPass: boolean;
  onPass: () => void;
  onShowRules: () => void;
  onLeave: () => void;
}

function statusText(status: GameStatus, myColor: Color, turn: Color, opponentConnected: boolean, vsBot: boolean): string {
  if (status === 'DRAW') return 'Oavgjort!';
  if (status === 'WHITE_WINS') return myColor === 'WHITE' ? 'Du vinner! \u{1F389}' : vsBot ? 'AI vinner.' : 'Vit vinner.';
  if (status === 'BLACK_WINS') return myColor === 'BLACK' ? 'Du vinner! \u{1F389}' : vsBot ? 'AI vinner.' : 'Svart vinner.';
  if (!opponentConnected) return 'Väntar på att motståndaren ska ansluta…';
  if (turn === myColor) return 'Din tur';
  return vsBot ? 'AI tänker…' : 'Motståndarens tur';
}

export function StatusBar({
  code,
  myColor,
  turn,
  status,
  opponentConnected,
  vsBot,
  botDifficulty,
  canPass,
  onPass,
  onShowRules,
  onLeave,
}: StatusBarProps) {
  return (
    <div className="status-bar">
      <div className="status-left">
        <span className={`color-chip ${myColor.toLowerCase()}`}>{myColor === 'WHITE' ? 'Vit' : 'Svart'}</span>
        {vsBot ? (
          <span className="room-code">🤖 AI ({DIFFICULTY_LABEL[botDifficulty ?? 'MEDIUM']})</span>
        ) : (
          <span className="room-code">Rum {code}</span>
        )}
      </div>
      <div className="status-center">{statusText(status, myColor, turn, opponentConnected, vsBot)}</div>
      <div className="status-right">
        {canPass && status === 'IN_PROGRESS' && turn === myColor && (
          <button className="pass-button" onClick={onPass}>
            Passa
          </button>
        )}
        <button className="icon-button" onClick={onShowRules} aria-label="Spelregler">
          ?
        </button>
        <button className="icon-button leave-button" onClick={onLeave} aria-label="Lämna spelet">
          ⎋
        </button>
      </div>
    </div>
  );
}
