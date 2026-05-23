// ============================================================
// SOULCHESS — Piece Component
// ============================================================
"use client";
import type { Piece } from "../types/game";
import { getPieceDefinitionById } from "../lib/pieceRegistry";

interface PieceProps {
  piece: Piece;
  isSelected: boolean;
  cellSize: number; // px, for scaling
}

// Faction colour accents
const FACTION_COLORS: Record<string, string> = {
  Arcane: "#c9a84c",
  Void:   "#9b6de0",
  Iron:   "#7a8fa0",
  Fire:   "#e05c2a",
};

const TIER_GLOW: Record<number, string> = {
  1: "none",
  2: "0 0 6px 1px rgba(201,168,76,0.6)",
  3: "0 0 10px 3px rgba(201,168,76,0.9), 0 0 20px 6px rgba(201,168,76,0.3)",
};

export function PieceComponent({ piece, isSelected, cellSize }: PieceProps) {
  const def = getPieceDefinitionById(piece.definitionId);
  const isWhite = piece.owner === "white";
  const hasHp = piece.maxHp > 0;
  const hpPct = hasHp ? (piece.hp / piece.maxHp) * 100 : 100;
  const factionColor = FACTION_COLORS[def.faction] ?? "#c9a84c";
  const isExhausted = piece.hasMoved && piece.hasActed;

  const size = Math.max(cellSize * 0.72, 14);
  const fontSize = Math.max(size * 0.48, 8);

  return (
    <div
      className="relative flex flex-col items-center justify-center w-full h-full select-none"
      style={{ opacity: isExhausted ? 0.45 : 1 }}
    >
      {/* ── Piece Token ─────────────────────────────────── */}
      <div
        className="flex items-center justify-center rounded-full transition-all duration-150"
        style={{
          width: size,
          height: size,
          background: isWhite
            ? "linear-gradient(135deg, #fdfbf7 0%, #e8e0d0 100%)"
            : "linear-gradient(135deg, #1e2535 0%, #0d111a 100%)",
          border: `1.5px solid ${isSelected ? factionColor : isWhite ? "#c9a84c80" : "#5a6a8060"}`,
          boxShadow: isSelected
            ? `0 0 0 2px ${factionColor}, ${TIER_GLOW[def.tier]}`
            : TIER_GLOW[def.tier],
          fontSize,
          lineHeight: 1,
        }}
      >
        <span
          style={{
            filter: isWhite
              ? "none"
              : "invert(1) brightness(1.8)",
            display: "block",
            marginTop: 1,
          }}
        >
          {def.symbol}
        </span>
      </div>

      {/* ── HP Bar (only for HP pieces) ───────────────── */}
      {hasHp && (
        <div
          className="absolute bottom-0.5 left-1/2 -translate-x-1/2 rounded-full overflow-hidden"
          style={{
            width: size * 0.85,
            height: Math.max(2, cellSize * 0.06),
            background: "#00000040",
          }}
        >
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{
              width: `${hpPct}%`,
              background:
                hpPct > 60
                  ? "#4ade80"
                  : hpPct > 30
                  ? "#facc15"
                  : "#f87171",
            }}
          />
        </div>
      )}

      {/* ── Owner dot ─────────────────────────────────── */}
      <div
        className="absolute top-0.5 right-0.5 rounded-full"
        style={{
          width: Math.max(3, cellSize * 0.1),
          height: Math.max(3, cellSize * 0.1),
          background: isWhite ? factionColor : "#9b6de0",
          boxShadow: `0 0 3px ${isWhite ? factionColor : "#9b6de0"}`,
        }}
      />
    </div>
  );
}