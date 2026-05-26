// ============================================================
// SOULCHESS — Board Component
// ============================================================
"use client";
import { useRef, useEffect, useState } from "react";
import type { GameState, Piece } from "../types/game";
import { coordKey } from "../lib/boardUtils";
import { getPieceDefinitionById } from "../lib/pieceRegistry";

interface BoardProps {
  state: GameState;
  onTileClick: (row: number, col: number, piece: Piece | null) => void;
  /** When true, board is rendered from Black's POV (row 15 at bottom) */
  flipped?: boolean;
}

const GRID = 16;

// ─── Tile highlight styles ────────────────────────────────────
const HL: Record<string, React.CSSProperties> = {
  selected: { background: "rgba(201,168,76,0.35)", boxShadow: "inset 0 0 0 2px #c9a84c" },
  move:     { background: "rgba(74,222,128,0.18)",  boxShadow: "inset 0 0 0 1.5px rgba(74,222,128,0.7)" },
  attack:   { background: "rgba(248,113,113,0.22)", boxShadow: "inset 0 0 0 1.5px rgba(248,113,113,0.8)" },
  ability:  { background: "rgba(155,109,224,0.22)", boxShadow: "inset 0 0 0 1.5px rgba(155,109,224,0.8)" },
  none:     {},
};

// ─── Special tile indicators ──────────────────────────────────
const EFFECT_STYLE: Record<string, { bg: string; icon: string }> = {
  amplify: { bg: "rgba(201,168,76,0.12)",  icon: "⚔" },
  shield:  { bg: "rgba(96,165,250,0.12)",  icon: "🛡" },
  cursed:  { bg: "rgba(139,92,246,0.12)",  icon: "☠" },
  sacred:  { bg: "rgba(52,211,153,0.10)",  icon: "✦" },
  portal:  { bg: "rgba(251,146,60,0.15)",  icon: "⊙" },
  trap:    { bg: "rgba(239,68,68,0.10)",   icon: "!" },
  none:    { bg: "transparent",            icon: "" },
};

// ─── Faction colours for piece tokens ────────────────────────
const FACTION_COLOR: Record<string, string> = {
  Arcane: "#c9a84c",
  Void:   "#9b6de0",
  Iron:   "#7a8fa0",
  Fire:   "#e05c2a",
};

const TIER_SHADOW: Record<number, string> = {
  1: "none",
  2: "0 0 6px 1px rgba(201,168,76,0.55)",
  3: "0 0 10px 3px rgba(201,168,76,0.85), 0 0 20px 5px rgba(201,168,76,0.25)",
};

// ─── Piece token ─────────────────────────────────────────────
function PieceToken({
  piece, isSelected, cellSize,
}: { piece: Piece; isSelected: boolean; cellSize: number }) {
  const def  = getPieceDefinitionById(piece.definitionId);
  const fc   = FACTION_COLOR[def.faction] ?? "#c9a84c";
  const size = Math.max(14, cellSize * 0.72);
  const fs   = Math.max(8,  size * 0.48);
  const hpPct = def.maxHp > 0 ? (piece.hp / piece.maxHp) * 100 : 100;
  const isWhite = piece.owner === "white";

  return (
    <div className="relative flex flex-col items-center justify-center w-full h-full select-none">
      {/* Token body */}
      <div
        className="flex items-center justify-center rounded-full transition-all duration-150"
        style={{
          width: size, height: size, fontSize: fs, lineHeight: 1,
          background: isWhite
            ? "linear-gradient(135deg,#fdfbf7 0%,#e8e0d0 100%)"
            : "linear-gradient(135deg,#1e2535 0%,#0d111a 100%)",
          border: `1.5px solid ${isSelected ? fc : isWhite ? "#c9a84c80" : "#5a6a8060"}`,
          boxShadow: isSelected
            ? `0 0 0 2px ${fc}, ${TIER_SHADOW[def.tier]}`
            : TIER_SHADOW[def.tier],
        }}
      >
        <span style={{ filter: isWhite ? "none" : "invert(1) brightness(1.8)", display: "block", marginTop: 1 }}>
          {def.symbol}
        </span>
      </div>

      {/* HP bar */}
      {def.maxHp > 0 && (
        <div
          className="absolute bottom-0.5 left-1/2 -translate-x-1/2 rounded-full overflow-hidden"
          style={{ width: size * 0.85, height: Math.max(2, cellSize * 0.06), background: "#00000040" }}
        >
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{
              width: `${hpPct}%`,
              background: hpPct > 60 ? "#4ade80" : hpPct > 30 ? "#facc15" : "#f87171",
            }}
          />
        </div>
      )}

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

  useEffect(() => {
    const update = () => {
      if (containerRef.current) {
        // Use the smaller dimension so board never overflows in either axis
        const size = Math.min(
          containerRef.current.offsetWidth,
          containerRef.current.offsetHeight,
        );
        setCellSize(Math.floor(size / GRID));
      }
    };
    update();
    const ro = new ResizeObserver(update);
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  // Build coord → piece lookup
  const pieceByCoord = new Map<string, Piece>();
  for (const p of Object.values(state.pieces)) {
    pieceByCoord.set(coordKey(p.position), p);
  }

  // Tiles in render order — reversed when viewing from Black's side
  const tiles = flipped
    ? [...state.board.flat()].reverse()
    : state.board.flat();

  return (
    <div
      ref={containerRef}
      className="relative overflow-hidden"
      style={{
        width: "100%",
        height: "100%",
        aspectRatio: "1/1",
        background: "linear-gradient(135deg,#e4dcce 0%,#c3b9a5 100%)",
        border: "2px solid #2c2c2c",
        borderRadius: 8,
        boxShadow: "0 12px 40px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.15)",
      }}
    >
      <div
        className="absolute inset-0 grid"
        style={{
          gridTemplateColumns: `repeat(${GRID},1fr)`,
          gridTemplateRows:    `repeat(${GRID},1fr)`,
        }}
      >
        {tiles.map(tile => {
          if (!tile.isInside) {
            return (
              <div
                key={`${tile.coord.row}-${tile.coord.col}`}
                style={{ background: "transparent" }}
              />
            );
          }

          const piece  = pieceByCoord.get(coordKey(tile.coord)) ?? null;
          const hlStyle = HL[tile.highlight] ?? {};
          const efStyle = EFFECT_STYLE[tile.effect] ?? EFFECT_STYLE.none;
          const baseBg  = tile.isLight ? "#f8f4ec" : "#2c2c2c";

          return (
            <div
              key={`${tile.coord.row}-${tile.coord.col}`}
              className="relative w-full h-full flex items-center justify-center cursor-pointer transition-all duration-100"
              style={{ background: baseBg, ...hlStyle }}
              onClick={() => onTileClick(tile.coord.row, tile.coord.col, piece)}
            >
              {/* Special tile tint */}
              {tile.effect !== "none" && (
                <div className="absolute inset-0 pointer-events-none" style={{ background: efStyle.bg }} />
              )}

              {/* Move dot (empty target) */}
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

              {/* Tile effect icon */}
              {tile.effect !== "none" && cellSize > 18 && (
                <span
                  className="absolute bottom-px right-px pointer-events-none leading-none"
                  style={{ fontSize: Math.max(6, cellSize * 0.18), opacity: 0.55 }}
                >
                  {efStyle.icon}
                </span>
              )}

              {/* Piece token */}
              {piece && (
                <PieceToken
                  piece={piece}
                  isSelected={piece.id === state.selectedPieceId}
                  cellSize={cellSize}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Corner decorations */}
      {(["top-1 left-1 border-t-2 border-l-2 rounded-tl",
         "top-1 right-1 border-t-2 border-r-2 rounded-tr",
         "bottom-1 left-1 border-b-2 border-l-2 rounded-bl",
         "bottom-1 right-1 border-b-2 border-r-2 rounded-br"] as const).map((cls, i) => (
        <div key={i} className={`absolute w-5 h-5 border-[#c9a84c] pointer-events-none ${cls}`} />
      ))}
    </div>
  );
}