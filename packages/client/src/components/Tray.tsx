import type { Color, Insect } from '@hive/shared';
import { INSECT_META, INSECT_ORDER } from '../insects.js';

export interface TrayProps {
  color: Color;
  reserves: Record<Insect, number>;
  selectedInsect: Insect | null;
  disabled: boolean;
  onSelect: (insect: Insect) => void;
}

export function Tray({ color, reserves, selectedInsect, disabled, onSelect }: TrayProps) {
  return (
    <div className={`tray tray-${color.toLowerCase()}`}>
      {INSECT_ORDER.map((insect) => {
        const count = reserves[insect];
        const meta = INSECT_META[insect];
        const isSelected = selectedInsect === insect;
        return (
          <button
            key={insect}
            className={`tray-piece ${isSelected ? 'selected' : ''}`}
            disabled={disabled || count === 0}
            onClick={() => onSelect(insect)}
            aria-label={`${meta.label} (${count} kvar)`}
          >
            <span className="tray-emoji">{meta.emoji}</span>
            <span className="tray-count">{count}</span>
          </button>
        );
      })}
    </div>
  );
}
