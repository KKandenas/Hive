import { useEffect, useMemo, useRef, useState } from 'react';
import type { Axial, Board as BoardMap, Color, PieceInstance } from '@hive/shared';
import { hexCorners, hexToPixel, HEX_SIZE } from '../hexLayout.js';
import { INSECT_META, pieceImageSrc } from '../insects.js';

// Slightly larger than the flat-to-flat hex width (HEX_SIZE * sqrt(3)) so tiles
// snugly touch their neighbors, like physical Hive pieces, without heavy overlap.
const PIECE_SIZE = HEX_SIZE * 1.8;

export interface BoardProps {
  board: BoardMap;
  myColor: Color;
  selectedFrom: Axial | null;
  highlightCells: Axial[];
  onPieceTap: (pieceId: string, at: Axial) => void;
  onTargetTap: (at: Axial) => void;
}

interface ViewState {
  scale: number;
  x: number;
  y: number;
}

function key(a: Axial): string {
  return `${a.q},${a.r}`;
}

export function Board({ board, myColor, selectedFrom, highlightCells, onPieceTap, onTargetTap }: BoardProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [view, setView] = useState<ViewState>({ scale: 1, x: 0, y: 0 });
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const gesture = useRef<{ moved: boolean; lastMidpoint?: { x: number; y: number }; lastDist?: number }>({
    moved: false,
  });
  const userInteracted = useRef(false);
  const lastAutoCenterCount = useRef(-1);

  const cells = useMemo(() => Array.from(board.entries()).map(([k, stack]) => ({ key: k, stack })), [board]);
  const highlightSet = useMemo(() => new Set(highlightCells.map(key)), [highlightCells]);

  function centerView() {
    const container = containerRef.current;
    if (!container) return;
    if (cells.length === 0) {
      setView({ scale: 1, x: 0, y: 0 });
      return;
    }
    const points = cells.map((c) => {
      const [q, r] = c.key.split(',').map(Number);
      return hexToPixel({ q, r });
    });
    const minX = Math.min(...points.map((p) => p.x));
    const maxX = Math.max(...points.map((p) => p.x));
    const minY = Math.min(...points.map((p) => p.y));
    const maxY = Math.max(...points.map((p) => p.y));
    const cx = (minX + maxX) / 2;
    const cy = (minY + maxY) / 2;
    const rect = container.getBoundingClientRect();
    setView((v) => ({ scale: v.scale, x: rect.width / 2 - cx, y: rect.height / 2 - cy }));
  }

  // Auto-center the view on the hive whenever it grows, unless the player has manually panned.
  useEffect(() => {
    if (userInteracted.current) return;
    if (cells.length === lastAutoCenterCount.current) return;
    lastAutoCenterCount.current = cells.length;
    centerView();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cells]);

  function recenter() {
    userInteracted.current = false;
    lastAutoCenterCount.current = cells.length;
    centerView();
  }

  function onPointerDown(e: React.PointerEvent) {
    (e.target as Element).setPointerCapture(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    gesture.current.moved = false;
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!pointers.current.has(e.pointerId)) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (pointers.current.size === 1) {
      const dx = e.movementX;
      const dy = e.movementY;
      if (Math.abs(dx) > 1 || Math.abs(dy) > 1) {
        gesture.current.moved = true;
        userInteracted.current = true;
        setView((v) => ({ ...v, x: v.x + dx, y: v.y + dy }));
      }
    } else if (pointers.current.size === 2) {
      const pts = Array.from(pointers.current.values());
      const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      const midpoint = { x: (pts[0].x + pts[1].x) / 2, y: (pts[0].y + pts[1].y) / 2 };
      if (gesture.current.lastDist != null) {
        const scaleDelta = dist / gesture.current.lastDist;
        userInteracted.current = true;
        gesture.current.moved = true;
        setView((v) => {
          const newScale = Math.min(2.5, Math.max(0.4, v.scale * scaleDelta));
          return { ...v, scale: newScale };
        });
      }
      gesture.current.lastDist = dist;
      gesture.current.lastMidpoint = midpoint;
    }
  }

  function onPointerUp(e: React.PointerEvent) {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size < 2) {
      gesture.current.lastDist = undefined;
    }
  }

  function zoomBy(factor: number) {
    userInteracted.current = true;
    setView((v) => ({ ...v, scale: Math.min(2.5, Math.max(0.4, v.scale * factor)) }));
  }

  const cellKeys = new Set(cells.map((c) => c.key));
  const ghostCells = highlightCells.filter((c) => !cellKeys.has(key(c)));

  return (
    <div className="board-container" ref={containerRef}>
      <svg
        className="board-svg"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <g transform={`translate(${view.x} ${view.y}) scale(${view.scale})`}>
          {cells.map(({ key: k, stack }) => {
            const [q, r] = k.split(',').map(Number);
            const center = hexToPixel({ q, r });
            const top = stack[stack.length - 1] as PieceInstance;
            const isHighlighted = highlightSet.has(k);
            const isSelected = selectedFrom && selectedFrom.q === q && selectedFrom.r === r;
            const meta = INSECT_META[top.insect];
            return (
              <g
                key={k}
                transform={`translate(${center.x} ${center.y})`}
                className={`hex-piece ${top.color.toLowerCase()} ${isSelected ? 'selected' : ''} ${
                  top.color === myColor ? 'mine' : 'theirs'
                }`}
                onClick={(e) => {
                  e.stopPropagation();
                  if (gesture.current.moved) return;
                  if (isHighlighted) onTargetTap({ q, r });
                  else onPieceTap(top.id, { q, r });
                }}
              >
                {stack.length > 1 && (
                  <polygon points={hexCorners({ x: 4, y: 4 }, HEX_SIZE)} className="hex-shadow" />
                )}
                <polygon points={hexCorners({ x: 0, y: 0 }, HEX_SIZE)} className={`hex-base ${isHighlighted ? 'highlight' : ''}`} />
                <image
                  href={pieceImageSrc(top.insect, top.color)}
                  x={-PIECE_SIZE / 2}
                  y={-PIECE_SIZE / 2}
                  width={PIECE_SIZE}
                  height={PIECE_SIZE}
                  className="piece-image"
                  aria-label={meta.label}
                />
                {stack.length > 1 && (
                  <g className="stack-badge" transform={`translate(${HEX_SIZE * 0.55} ${-HEX_SIZE * 0.55})`}>
                    <circle r={11} />
                    <text textAnchor="middle" dominantBaseline="central" fontSize={12}>
                      {stack.length}
                    </text>
                  </g>
                )}
              </g>
            );
          })}
          {ghostCells.map((c) => {
            const center = hexToPixel(c);
            return (
              <g
                key={`ghost-${key(c)}`}
                transform={`translate(${center.x} ${center.y})`}
                className="hex-ghost"
                onClick={(e) => {
                  e.stopPropagation();
                  if (gesture.current.moved) return;
                  onTargetTap(c);
                }}
              >
                <polygon points={hexCorners({ x: 0, y: 0 }, HEX_SIZE)} className="hex-base highlight empty" />
              </g>
            );
          })}
        </g>
      </svg>
      <div className="board-controls">
        <button onClick={() => zoomBy(1.2)} aria-label="Zooma in">
          +
        </button>
        <button onClick={() => zoomBy(1 / 1.2)} aria-label="Zooma ut">
          −
        </button>
        <button onClick={recenter} aria-label="Centrera brädet">
          ⦿
        </button>
      </div>
    </div>
  );
}
