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
  if (status === 'DRAW') return "It's a draw!";
  if (status === 'WHITE_WINS') return myColor === 'WHITE' ? 'You win! \u{1F389}' : 'White wins.';
  if (status === 'BLACK_WINS') return myColor === 'BLACK' ? 'You win! \u{1F389}' : 'Black wins.';
  if (!opponentConnected) return 'Waiting for opponent to connect…';
  return turn === myColor ? 'Your turn' : "Opponent's turn";
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
        <span className={`color-chip ${myColor.toLowerCase()}`}>{myColor === 'WHITE' ? 'White' : 'Black'}</span>
        <span className="room-code">Room {code}</span>
      </div>
      <div className="status-center">{statusText(status, myColor, turn, opponentConnected)}</div>
      <div className="status-right">
        {canPass && status === 'IN_PROGRESS' && turn === myColor && (
          <button className="pass-button" onClick={onPass}>
            Pass
          </button>
        )}
        <button className="icon-button" onClick={onShowRules} aria-label="How to play">
          ?
        </button>
        <button className="icon-button leave-button" onClick={onLeave} aria-label="Leave game">
          ⎋
        </button>
      </div>
    </div>
  );
}
