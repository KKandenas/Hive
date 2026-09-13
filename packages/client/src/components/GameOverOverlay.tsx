import type { Color, GameStatus } from '@hive/shared';
import { Confetti } from './Confetti.js';

export interface GameOverOverlayProps {
  status: GameStatus;
  myColor: Color;
  onPlayAgain: () => void;
  onGoHome: () => void;
  onDismiss: () => void;
}

const COLOR_LABEL: Record<Color, string> = { WHITE: 'Vits', BLACK: 'Svarts' };

export function GameOverOverlay({ status, myColor, onPlayAgain, onGoHome, onDismiss }: GameOverOverlayProps) {
  if (status === 'IN_PROGRESS') return null;

  const iWon = (status === 'WHITE_WINS' && myColor === 'WHITE') || (status === 'BLACK_WINS' && myColor === 'BLACK');
  const isDraw = status === 'DRAW';

  const title = isDraw ? 'Oavgjort!' : iWon ? 'Du vann! \u{1F389}' : 'Du förlorade';

  const subtitle = isDraw
    ? 'Båda bidrottningarna blev omringade samtidigt.'
    : `${COLOR_LABEL[status === 'WHITE_WINS' ? 'BLACK' : 'WHITE']} Bidrottning blev omringad.`;

  return (
    <div className="game-over-layer">
      {iWon && <Confetti />}
      <div className={`game-over-card ${isDraw ? 'draw' : iWon ? 'win' : 'lose'}`}>
        <button className="modal-close game-over-close" onClick={onDismiss} aria-label="Visa brädet">
          ✕
        </button>
        <h2>{title}</h2>
        <p>{subtitle}</p>
        <div className="game-over-actions">
          <button className="primary-button" onClick={onPlayAgain}>
            Spela igen
          </button>
          <button className="secondary-button" onClick={onGoHome}>
            Till startsidan
          </button>
        </div>
      </div>
    </div>
  );
}
