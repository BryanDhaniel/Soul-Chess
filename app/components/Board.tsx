// ============================================================
// SOULCHESS — Board Component
// ============================================================
"use client";
import { useRef, useEffect, useState } from "react";
import type { GameState, Piece, Coord } from "../types/game";
import { coordKey, coordsEqual } from "../lib/boardUtils";
import { PieceComponent } from "./Piece";

interface BoardProps {
  state: GameState;
  onTileClick: (row: number, col: number, piece: Piece | null) => void;
}

// Highlight colours
const HIGHLIGHT_STYLES: Record<string, React.CSSProperties> = {
  selected: {
    background: "rgba(201,168,76,0.35)",
    boxShadow: "inset 0 0 0 2px #c9a84c",
  },
  move: {
    background: "rgba(74,222,128,0.18)",
    boxShadow: "inset 0 0 0 1.5px rgba(74,222,128,0.7)",
  },
  attack: {
    background: "rgba(248,113,113,0.22)",
    boxShadow: "inset 0 0 0 1.5px rgba(248,113,113,0.8)",
  },
  ability: {
    background: "rgba(155,109,224,0.22)",
    boxShadow: "inset 0 0 0 1.5px rgba(155,109,224,0.8)",
  },
  danger: {
    background: "rgba(239,68,68,0.1)",
  },
  none: {},
};

// Special tile effect visual indicators
const TILE_EFFECT_STYLE: Record<string, { bg: string; label: string }> = {
  amplify: { bg: "rgba(201,168,76,0.12)", label: "⚔" },
  shield:  { bg: "rgba(96,165,250,0.12)", label: "🛡" },
  cursed:  { bg: "rgba(139,92,246,0.12)", label: "☠" },
  sacred:  { bg: "rgba(52,211,153,0.10)", label: "✦" },
  portal:  { bg: "rgba(251,146,60,0.15)", label: "⊙" },
  trap:    { bg: "rgba(239,68,68,0.10)",  label: "!" },
  none:    { bg: "transparent",           label: "" },
};

const GRID = 16;

export function Board({ state, onTileClick }: BoardProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [cellSize, setCellSize] = useState(32);

  useEffect(() => {
    const update = () => {
      if (containerRef.current) {
        const size = containerRef.current.offsetWidth;
        setCellSize(Math.floor(size / GRID));
      }
    };
    update();
    const ro = new ResizeObserver(update);
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  // Build a coord-key → piece lookup for fast access
  const pieceByCoord = new Map<string, Piece>();
  for (const piece of Object.values(state.pieces)) {
    pieceByCoord.set(coordKey(piece.position), piece);
  }

  const selectedPiece = state.selectedPieceId
    ? state.pieces[state.selectedPieceId] ?? null
    : null;

  return (
    <div
      ref={containerRef}
      className="relative w-full"
      style={{
        aspectRatio: "1 / 1",
        background: "linear-gradient(135deg, #e4dcce 0%, #c3b9a5 100%)",
        border: "2px solid #2c2c2c",
        borderRadius: 8,
        boxShadow: "0 12px 40px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.15)",
        padding: 0,
        overflow: "hidden",
      }}
    >
      {/* Inner grid */}
      <div
        className="absolute inset-0 grid"
        style={{
          gridTemplateColumns: `repeat(${GRID}, 1fr)`,
          gridTemplateRows: `repeat(${GRID}, 1fr)`,
        }}
      >
        {state.board.flat().map((tile) => {
          if (!tile.isInside) {
            // Render transparent (cut corner)
            return (
              <div
                key={`${tile.coord.row}-${tile.coord.col}`}
                className="w-full h-full"
                style={{ background: "transparent" }}
              />
            );
          }

          const piece = pieceByCoord.get(coordKey(tile.coord)) ?? null;
          const hl = tile.highlight;
          const hlStyle = HIGHLIGHT_STYLES[hl] ?? {};
          const effectStyle = TILE_EFFECT_STYLE[tile.effect] ?? TILE_EFFECT_STYLE.none;

          // Base tile colour (light/dark chess pattern)
          const baseBg = tile.isLight ? "#f8f4ec" : "#2c2c2c";
          // Combine with special tile tint
          const bg = effectStyle.bg !== "transparent"
            ? undefined // will layer via boxShadow / overlay
            : undefined;

          return (
            <div
              key={`${tile.coord.row}-${tile.coord.col}`}
              className="relative w-full h-full flex items-center justify-center cursor-pointer transition-all duration-100"
              style={{
                background: baseBg,
                ...hlStyle,
              }}
              onClick={() => onTileClick(tile.coord.row, tile.coord.col, piece)}
            >
              {/* Special tile tint overlay */}
              {tile.effect !== "none" && (
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{ background: effectStyle.bg }}
                />
              )}

              {/* Move dot indicator (empty valid move) */}
              {hl === "move" && !piece && (
                <div
                  className="absolute rounded-full pointer-events-none"
                  style={{
                    width: Math.max(6, cellSize * 0.22),
                    height: Math.max(6, cellSize * 0.22),
                    background: "rgba(74,222,128,0.7)",
                    boxShadow: "0 0 6px rgba(74,222,128,0.5)",
                  }}
                />
              )}

              {/* Attack pulse ring */}
              {hl === "attack" && piece && (
                <div
                  className="absolute inset-0.5 rounded-sm pointer-events-none animate-pulse"
                  style={{
                    border: "2px solid rgba(248,113,113,0.8)",
                    boxShadow: "0 0 8px rgba(248,113,113,0.4)",
                  }}
                />
              )}

              {/* Tile effect icon (tiny, bottom-right) */}
              {tile.effect !== "none" && cellSize > 18 && (
                <span
                  className="absolute bottom-px right-px pointer-events-none leading-none"
                  style={{ fontSize: Math.max(6, cellSize * 0.18), opacity: 0.55 }}
                >
                  {effectStyle.label}
                </span>
              )}

              {/* Piece */}
              {piece && (
                <PieceComponent
                  piece={piece}
                  isSelected={piece.id === state.selectedPieceId}
                  cellSize={cellSize}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Outer corner decorations */}
      {[
        "top-1 left-1 border-t-2 border-l-2 rounded-tl-md",
        "top-1 right-1 border-t-2 border-r-2 rounded-tr-md",
        "bottom-1 left-1 border-b-2 border-l-2 rounded-bl-md",
        "bottom-1 right-1 border-b-2 border-r-2 rounded-br-md",
      ].map((cls, i) => (
        <div
          key={i}
          className={`absolute w-5 h-5 border-[#c9a84c] pointer-events-none ${cls}`}
        />
      ))}
    </div>
  );
}