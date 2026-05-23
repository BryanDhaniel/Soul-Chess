// ============================================================
// SOULCHESS — Placement Panel
// ============================================================
"use client";
import { useState } from "react";
import type { GameState, Player } from "../types/game";
import { getAllDefinitions } from "../lib/pieceRegistry";

interface PlacementPanelProps {
  state: GameState;
  onSelectDefinition: (id: string) => void;
  selectedDefinitionId: string | null;
}

const PLAYER_COLORS: Record<Player, string> = {
  white: "#c9a84c",
  black: "#9b6de0",
};

const TIER_LABELS: Record<number, string> = { 1: "Common", 2: "Rare", 3: "Legendary" };

export function PlacementPanel({ state, onSelectDefinition, selectedDefinitionId }: PlacementPanelProps) {
  const defs = getAllDefinitions();
  const { currentPlayer, placedCount, maxPieces } = state;
  const placed = placedCount[currentPlayer];
  const remaining = maxPieces - placed;
  const color = PLAYER_COLORS[currentPlayer];

  return (
    <div className="flex flex-col gap-3 w-full">
      {/* Header */}
      <div
        className="rounded-lg border px-4 py-3"
        style={{ background: `${color}10`, borderColor: `${color}50` }}
      >
        <p
          className="font-serif font-bold uppercase tracking-[0.15em] text-sm"
          style={{ color }}
        >
          {currentPlayer === "white" ? "White Mage" : "Shadow Lord"} — Deployment
        </p>
        <p className="text-[10px] text-[#8b7d6b] uppercase tracking-widest mt-0.5">
          Place pieces in your zone · {remaining} remaining
        </p>
        {/* Progress bar */}
        <div className="mt-2 h-1.5 rounded-full bg-black/10 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{ width: `${(placed / maxPieces) * 100}%`, background: color }}
          />
        </div>
      </div>

      {/* Piece list */}
      <div className="flex flex-col gap-1.5 overflow-y-auto max-h-[50vh] pr-1">
        <span className="text-[9px] uppercase tracking-widest text-[#8b7d6b]">
          Select piece → click your zone on the board
        </span>
        {defs.map(def => {
          const isSelected = def.typeId === selectedDefinitionId;
          return (
            <button
              key={def.typeId}
              onClick={() => onSelectDefinition(def.typeId)}
              className="flex items-center gap-3 rounded-lg px-3 py-2 border text-left transition-all hover:scale-[1.01] cursor-pointer"
              style={{
                background: isSelected ? `${color}15` : "rgba(253,251,247,0.5)",
                borderColor: isSelected ? color : "#c9a84c30",
                boxShadow: isSelected ? `0 0 0 1.5px ${color}` : "none",
              }}
            >
              <span className="text-xl leading-none shrink-0">{def.symbol}</span>
              <div className="flex flex-col flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-serif font-semibold text-sm text-[#1e3a6e] truncate">
                    {def.name}
                  </span>
                  <span
                    className="text-[9px] uppercase tracking-wider shrink-0 px-1.5 py-0.5 rounded"
                    style={{
                      background: def.tier === 3 ? "rgba(201,168,76,0.2)" : def.tier === 2 ? "rgba(96,165,250,0.15)" : "rgba(0,0,0,0.06)",
                      color: def.tier === 3 ? "#b8860b" : def.tier === 2 ? "#3b82f6" : "#8b7d6b",
                    }}
                  >
                    {TIER_LABELS[def.tier]}
                  </span>
                </div>
                <div className="flex items-center gap-3 mt-0.5">
                  <span className="text-[10px] text-[#8b7d6b]">
                    HP: {def.maxHp > 0 ? def.maxHp : "∞"} · ATK: {def.attack} · DEF: {def.defense}
                  </span>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}