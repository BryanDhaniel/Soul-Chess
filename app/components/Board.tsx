// ============================================================
// SOULCHESS — Board Component (with slide + capture animation)
// ============================================================
// Architecture:
//   Layer 1 — Tile grid (bg colours, highlights, dots, icons)
//   Layer 2 — Animated piece overlay (absolute positioned tokens)
//
// Animation:
//   Move   → piece slides from previous coord to new coord (250ms)
//   Attack → defending piece flashes red then fades out (250ms)
//            attacking piece slides into position (250ms)
// ============================================================
"use client";
import { useRef, useEffect, useState, useLayoutEffect } from "react";
import type { GameState, Piece } from "../types/game";
import { coordKey } from "../lib/boardUtils";
import { getPieceDefinitionById } from "../lib/pieceRegistry";

interface BoardProps {
  state: GameState;
  onTileClick: (row: number, col: number, piece: Piece | null) => void;
  flipped?: boolean;
}

const GRID     = 16;
const ANIM_MS  = 250;

// ─── Visual constants ─────────────────────────────────────────
const HL: Record<string, React.CSSProperties> = {
  selected: { background: "rgba(201,168,76,0.35)", boxShadow: "inset 0 0 0 2px #c9a84c" },
  move:     { background: "rgba(74,222,128,0.18)",  boxShadow: "inset 0 0 0 1.5px rgba(74,222,128,0.7)" },
  attack:   { background: "rgba(248,113,113,0.22)", boxShadow: "inset 0 0 0 1.5px rgba(248,113,113,0.8)" },
  ability:  { background: "rgba(155,109,224,0.22)", boxShadow: "inset 0 0 0 1.5px rgba(155,109,224,0.8)" },
  none:     {},
};

const EFFECT_STYLE: Record<string, { bg: string; icon: string }> = {
  amplify: { bg: "rgba(201,168,76,0.12)",  icon: "⚔" },
  shield:  { bg: "rgba(96,165,250,0.12)",  icon: "🛡" },
  cursed:  { bg: "rgba(139,92,246,0.12)",  icon: "☠" },
  sacred:  { bg: "rgba(52,211,153,0.10)",  icon: "✦" },
  portal:  { bg: "rgba(251,146,60,0.15)",  icon: "⊙" },
  trap:    { bg: "rgba(239,68,68,0.10)",   icon: "!" },
  none:    { bg: "transparent",            icon: "" },
};

const FACTION_COLOR: Record<string, string> = {
  Arcane: "#c9a84c", Void: "#9b6de0", Iron: "#7a8fa0", Fire: "#e05c2a",
};

const TIER_SHADOW: Record<number, string> = {
  1: "none",
  2: "0 0 6px 1px rgba(201,168,76,0.55)",
  3: "0 0 10px 3px rgba(201,168,76,0.85), 0 0 20px 5px rgba(201,168,76,0.25)",
};

// ─── Animated piece state ─────────────────────────────────────
interface AnimPiece {
  piece: Piece;
  // Current rendered pixel position (top-left of token)
  x: number;
  y: number;
  // Are we animating right now?
  animating: boolean;
  // Flash red (capture victim)
  capturing: boolean;
  // Fade out (captured piece disappearing)
  dying: boolean;
}

// ─── Pixel position helpers ───────────────────────────────────
// Returns position as a % of board size so it aligns perfectly with
// the CSS grid regardless of rounding errors in cellSize.
function cellOrigin(
  row: number, col: number,
  _cellSize: number, flipped: boolean,
  _boardPx: number,
): { x: number; y: number } {
  const r = flipped ? GRID - 1 - row : row;
  const c = flipped ? GRID - 1 - col : col;
  // Use percentage: each cell = 100/GRID % of the board
  return {
    x: (c / GRID) * 100,
    y: (r / GRID) * 100,
  };
}

// ─── Token renderer (pure visual, no state) ───────────────────
function PieceTokenVisual({
  piece, isSelected, cellSize, flash, dying,
}: {
  piece: Piece;
  isSelected: boolean;
  cellSize: number;
  flash: boolean;
  dying: boolean;
}) {
  const def     = getPieceDefinitionById(piece.definitionId);
  const fc      = FACTION_COLOR[def.faction] ?? "#c9a84c";
  const size    = Math.max(14, cellSize * 0.72);
  const fs      = Math.max(8, size * 0.48);
  const isWhite = piece.owner === "white";

  return (
    <div
      className="relative flex flex-col items-center justify-center select-none pointer-events-none w-full h-full"
      style={{
        opacity: dying ? 0 : 1,
        transition: dying ? `opacity ${ANIM_MS}ms ease-out` : "none",
      }}
    >
      {/* Capture flash overlay */}
      {flash && (
        <div
          className="absolute inset-0 rounded-full z-10 pointer-events-none"
          style={{
            background: "rgba(248,113,113,0.7)",
            animation: `captureFlash ${ANIM_MS}ms ease-out forwards`,
          }}
        />
      )}

      {/* Token body */}
      <div
        className="flex items-center justify-center rounded-full"
        style={{
          width: size, height: size, fontSize: fs, lineHeight: 1,
          background: isWhite
            ? "linear-gradient(135deg,#fdfbf7 0%,#e8e0d0 100%)"
            : "linear-gradient(135deg,#3a4258 0%,#1a1f30 100%)",
          border: `1.5px solid ${isSelected ? fc : isWhite ? "#c9a84c80" : "#9babcc"}`,
          boxShadow: isSelected
            ? `0 0 0 2px ${fc}, ${TIER_SHADOW[def.tier]}`
            : isWhite
              ? TIER_SHADOW[def.tier]
              : `0 0 0 1px rgba(255,255,255,0.15), 0 2px 6px rgba(0,0,0,0.5), ${TIER_SHADOW[def.tier]}`,
          // Slight lift when selected
          transform: isSelected ? "scale(1.08)" : "scale(1)",
          transition: `transform 150ms ease`,
        }}
      >
        <span style={{
          display: "block", marginTop: 1,
          color: isWhite ? "#1e2535" : "#f0f3fa",
        }}>
          {def.symbol}
        </span>
      </div>

      {/* Owner dot */}
      <div
        className="absolute top-0.5 right-0.5 rounded-full"
        style={{
          width: Math.max(3, cellSize * 0.1),
          height: Math.max(3, cellSize * 0.1),
          background: isWhite ? fc : "#9b6de0",
          boxShadow: `0 0 3px ${isWhite ? fc : "#9b6de0"}`,
        }}
      />
    </div>
  );
}

// ─── Board ────────────────────────────────────────────────────
export function Board({ state, onTileClick, flipped = false }: BoardProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [cellSize, setCellSize] = useState(32);

  // Track pixel positions of every piece (keyed by piece.id)
  const [animMap, setAnimMap] = useState<Map<string, AnimPiece>>(new Map());

  // Previous pieces snapshot to detect moves/captures
  const prevPiecesRef = useRef<Record<string, Piece>>({});

  // ── Measure cell size ──────────────────────────────────────
  useEffect(() => {
    const update = () => {
      if (!containerRef.current) return;
      const size = Math.min(
        containerRef.current.offsetWidth,
        containerRef.current.offsetHeight,
      );
      setCellSize(Math.floor(size / GRID));
    };
    update();
    const ro = new ResizeObserver(update);
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  // ── Rebuild animMap when pieces or cellSize change ─────────
  useLayoutEffect(() => {
    const prev = prevPiecesRef.current;
    const curr = state.pieces;

    setAnimMap(oldMap => {
      const next = new Map<string, AnimPiece>();

      // ── Pieces that exist now ───────────────────────────
      for (const [id, piece] of Object.entries(curr)) {
        const prevPiece = prev[id];
        const target    = cellOrigin(piece.position.row, piece.position.col, cellSize, flipped, cellSize * GRID);

        if (!prevPiece) {
          // New piece — just appear at target (initial deploy)
          next.set(id, { piece, x: target.x, y: target.y, animating: false, capturing: false, dying: false });
          continue;
        }

        const prevPos = cellOrigin(prevPiece.position.row, prevPiece.position.col, cellSize, flipped, cellSize * GRID);
        const moved   = prevPiece.position.row !== piece.position.row || prevPiece.position.col !== piece.position.col;

        if (moved) {
          // Start at previous position, will animate to target via CSS transition
          next.set(id, { piece, x: prevPos.x, y: prevPos.y, animating: true, capturing: false, dying: false });

          // Capture values now — avoids stale closures if multiple moves fire in quick succession (e.g. Flanking Strike chains)
          const targetX = target.x;
          const targetY = target.y;
          const pieceId = id;

          // After one frame, update to target so CSS transition fires
          requestAnimationFrame(() => {
            setAnimMap(m => {
              const ap = m.get(pieceId);
              if (!ap) return m;
              const n = new Map(m);
              n.set(pieceId, { ...ap, x: targetX, y: targetY });
              return n;
            });
            // Clear animating flag after transition completes
            setTimeout(() => {
              setAnimMap(m => {
                const ap = m.get(pieceId);
                if (!ap) return m;
                const n = new Map(m);
                n.set(pieceId, { ...ap, animating: false });
                return n;
              });
            }, ANIM_MS + 20);
          });
        } else {
          // No move — keep current pixel position (may have updated stats)
          const existing = oldMap.get(id);
          next.set(id, {
            piece,
            x: existing?.x ?? target.x,
            y: existing?.y ?? target.y,
            animating: existing?.animating ?? false,
            capturing: false,
            dying: false,
          });
        }
      }

      // ── Pieces that disappeared (captured) ─────────────
      for (const [id, piece] of Object.entries(prev)) {
        if (curr[id]) continue; // still alive

        const pos = cellOrigin(piece.position.row, piece.position.col, cellSize, flipped, cellSize * GRID);
        const existing = oldMap.get(id);

        // Start capture flash + dying fade
        next.set(id, {
          piece,
          x: existing?.x ?? pos.x,
          y: existing?.y ?? pos.y,
          animating: false,
          capturing: true,
          dying: true,
        });

        // Remove ghost after animation
        setTimeout(() => {
          setAnimMap(m => {
            const n = new Map(m);
            n.delete(id);
            return n;
          });
        }, ANIM_MS + 50);
      }

      return next;
    });

    prevPiecesRef.current = curr;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.pieces, cellSize, flipped]);

  // ── Build piece lookup for tile click handling ─────────────
  const pieceByCoord = new Map<string, Piece>();
  for (const p of Object.values(state.pieces)) {
    pieceByCoord.set(coordKey(p.position), p);
  }

  // Tile render order
  const tiles = flipped
    ? [...state.board.flat()].reverse()
    : state.board.flat();

  return (
    <>
      {/* Keyframe for capture flash — injected once */}
      <style>{`
        @keyframes captureFlash {
          0%   { opacity: 0.9; transform: scale(1.15); }
          60%  { opacity: 0.6; transform: scale(1.05); }
          100% { opacity: 0;   transform: scale(1);    }
        }
      `}</style>

      <div
        ref={containerRef}
        className="relative overflow-hidden"
        style={{
          width: "100%", height: "100%", aspectRatio: "1/1",
          background: "linear-gradient(135deg,#e4dcce 0%,#c3b9a5 100%)",
          border: "2px solid #2c2c2c",
          borderRadius: 8,
          boxShadow: "0 12px 40px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.15)",
        }}
      >
        {/* ── Layer 1: Tile grid ───────────────────────── */}
        <div
          className="absolute inset-0 grid"
          style={{
            gridTemplateColumns: `repeat(${GRID},1fr)`,
            gridTemplateRows:    `repeat(${GRID},1fr)`,
          }}
        >
          {tiles.map(tile => {
            if (!tile.isInside) {
              return <div key={`${tile.coord.row}-${tile.coord.col}`} style={{ background: "transparent" }} />;
            }

            const piece   = pieceByCoord.get(coordKey(tile.coord)) ?? null;
            const isTeleportTarget = tile.highlight === "ability" && state.activeAbilityId === "royal_teleport";
            const hlStyle = isTeleportTarget ? HL.move : (HL[tile.highlight] ?? {});
            const efStyle = EFFECT_STYLE[tile.effect] ?? EFFECT_STYLE.none;
            const baseBg  = tile.isLight ? "#f8f4ec" : "#2c2c2c";

            return (
              <div
                key={`${tile.coord.row}-${tile.coord.col}`}
                className="relative w-full h-full flex items-center justify-center cursor-pointer transition-colors duration-100"
                style={{ background: baseBg, ...hlStyle }}
                onClick={() => onTileClick(tile.coord.row, tile.coord.col, piece)}
              >
                {/* Special tile tint */}
                {tile.effect !== "none" && (
                  <div className="absolute inset-0 pointer-events-none" style={{ background: efStyle.bg }} />
                )}

                {/* Move dot */}
                {tile.highlight === "move" && !piece && (
                  <div
                    className="absolute rounded-full pointer-events-none"
                    style={{
                      width:  Math.max(6, cellSize * 0.22),
                      height: Math.max(6, cellSize * 0.22),
                      background: "rgba(74,222,128,0.7)",
                      boxShadow: "0 0 6px rgba(74,222,128,0.5)",
                    }}
                  />
                )}

                {/* Attack ring */}
                {tile.highlight === "attack" && piece && (
                  <div
                    className="absolute inset-0.5 pointer-events-none animate-pulse"
                    style={{ border: "2px solid rgba(248,113,113,0.85)", boxShadow: "0 0 8px rgba(248,113,113,0.4)" }}
                  />
                )}

                {/* Ability target indicator */}
                {tile.highlight === "ability" && (
                  state.activeAbilityId === "royal_teleport" ? (
                    // Royal Teleport (Queen) — same plain dot style as a normal move
                    <div
                      className="absolute rounded-full pointer-events-none"
                      style={{
                        width:  Math.max(6, cellSize * 0.22),
                        height: Math.max(6, cellSize * 0.22),
                        background: "rgba(74,222,128,0.7)",
                        boxShadow: "0 0 6px rgba(74,222,128,0.5)",
                      }}
                    />
                  ) : (
                    // Royal Swap (King) and any other targeted ability — diamond pulse
                    <div
                      className="absolute pointer-events-none animate-pulse"
                      style={{
                        width:  Math.max(8, cellSize * 0.3),
                        height: Math.max(8, cellSize * 0.3),
                        background: "rgba(155,109,224,0.75)",
                        boxShadow: "0 0 8px rgba(155,109,224,0.55)",
                        transform: "rotate(45deg)",
                        borderRadius: 2,
                      }}
                    />
                  )
                )}

                {/* Tile effect icon */}
                {tile.effect !== "none" && cellSize > 18 && (
                  <span
                    className="absolute bottom-px right-px pointer-events-none leading-none"
                    style={{ fontSize: Math.max(6, cellSize * 0.18), opacity: 0.55 }}
                  >
                    {efStyle.icon}
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* ── Layer 2: Animated pieces ─────────────────── */}
        <div className="absolute inset-0 pointer-events-none">
          {Array.from(animMap.values()).map(ap => (
            <div
              key={ap.piece.id}
              style={{
                position: "absolute",
                left:   `${ap.x}%`,
                top:    `${ap.y}%`,
                width:  `${100 / GRID}%`,
                height: `${100 / GRID}%`,
                // Slide transition only when animating
                transition: ap.animating
                  ? `left ${ANIM_MS}ms cubic-bezier(0.25,0.46,0.45,0.94),
                     top  ${ANIM_MS}ms cubic-bezier(0.25,0.46,0.45,0.94)`
                  : "none",
                zIndex: ap.animating ? 10 : 1,
                willChange: ap.animating ? "left, top" : "auto",
              }}
            >
              <PieceTokenVisual
                piece={ap.piece}
                isSelected={ap.piece.id === state.selectedPieceId}
                cellSize={cellSize}
                flash={ap.capturing}
                dying={ap.dying}
              />
            </div>
          ))}
        </div>

        {/* Corner decorations */}
        {(["top-1 left-1 border-t-2 border-l-2 rounded-tl",
           "top-1 right-1 border-t-2 border-r-2 rounded-tr",
           "bottom-1 left-1 border-b-2 border-l-2 rounded-bl",
           "bottom-1 right-1 border-b-2 border-r-2 rounded-br"] as const).map((cls, i) => (
          <div key={i} className={`absolute w-5 h-5 border-[#c9a84c] pointer-events-none ${cls}`} />
        ))}
      </div>
    </>
  );
}