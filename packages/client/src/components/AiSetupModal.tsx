import { useState } from 'react';
import type { Color, Difficulty } from '@hive/shared';
import { DIFFICULTY_LABEL, DIFFICULTY_ORDER } from '../difficulty.js';
import { pieceImageSrc } from '../insects.js';

export interface AiSetupModalProps {
  busy: boolean;
  onClose: () => void;
  onStart: (color: Color, difficulty: Difficulty) => void;
}

export function AiSetupModal({ busy, onClose, onStart }: AiSetupModalProps) {
  const [color, setColor] = useState<Color>('WHITE');
  const [difficulty, setDifficulty] = useState<Difficulty>('MEDIUM');

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-panel ai-setup-panel" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Spela mot AI</h2>
          <button className="modal-close" onClick={onClose} aria-label="Stäng">
            ✕
          </button>
        </div>
        <div className="modal-body">
          <p className="ai-setup-label">Svårighetsgrad</p>
          <div className="ai-setup-row">
            {DIFFICULTY_ORDER.map((d) => (
              <button
                key={d}
                className={`ai-choice-button ${difficulty === d ? 'selected' : ''}`}
                onClick={() => setDifficulty(d)}
              >
                {DIFFICULTY_LABEL[d]}
              </button>
            ))}
          </div>

          <p className="ai-setup-label">Din färg</p>
          <div className="ai-setup-row">
            {(['WHITE', 'BLACK'] as Color[]).map((c) => (
              <button
                key={c}
                className={`ai-choice-button ai-color-button ${color === c ? 'selected' : ''}`}
                onClick={() => setColor(c)}
              >
                <img src={pieceImageSrc('QUEEN', c)} alt="" className="ai-color-icon" />
                {c === 'WHITE' ? 'Vit' : 'Svart'}
              </button>
            ))}
          </div>

          <button className="primary-button ai-start-button" onClick={() => onStart(color, difficulty)} disabled={busy}>
            Starta spel
          </button>
        </div>
      </div>
    </div>
  );
}
