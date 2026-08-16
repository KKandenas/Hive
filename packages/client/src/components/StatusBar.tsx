import type { Color, GameStatus } from '@hive/shared';

export interface StatusBarProps {
  code: string;
  myColor: Color;
  turn: Color;
  status: GameStatus;
  opponentConnected: boolean;
  canPass: boolean;
  onPass: () => void;
  onShowRules: () => void;
  onLeave: () => void;
}

function statusText(status: GameStatus, myColor: Color, turn: Color, opponentConnected: boolean): string {
  if (status === 'DRAW') return 'Oavgjort!';
  if (status === 'WHITE_WINS') return myColor === 'WHITE' ? 'Du vinner! \u{1F389}' : 'Vit vinner.';
  if (status === 'BLACK_WINS') return myColor === 'BLACK' ? 'Du vinner! \u{1F389}' : 'Svart vinner.';
  if (!opponentConnected) return 'Väntar på att motståndaren ska ansluta…';
  return turn === myColor ? 'Din tur' : 'Motståndarens tur';
}

export function StatusBar({
  code,
  myColor,
  turn,
  status,
  opponentConnected,
  canPass,
  onPass,
  onShowRules,
  onLeave,
}: StatusBarProps) {
  return (
    <div className="status-bar">
      <div className="status-left">
        <span className={`color-chip ${myColor.toLowerCase()}`}>{myColor === 'WHITE' ? 'Vit' : 'Svart'}</span>
        <span className="room-code">Rum {code}</span>
      </div>
      <div className="status-center">{statusText(status, myColor, turn, opponentConnected)}</div>
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
