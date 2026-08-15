import { RulesContent } from './RulesContent.js';

export interface RulesModalProps {
  onClose: () => void;
}

export function RulesModal({ onClose }: RulesModalProps) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>How to play Hive</h2>
          <button className="modal-close" onClick={onClose} aria-label="Close rules">
            ✕
          </button>
        </div>
        <div className="modal-body">
          <RulesContent />
        </div>
      </div>
    </div>
  );
}
