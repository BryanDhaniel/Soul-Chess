// ============================================================
// SOULCHESS — Game HUD
// ============================================================
"use client";
import { Swords, Crown, RotateCcw, ChevronRight, Zap, Shield, Heart } from "lucide-react";
import type { GameState, Piece, Player } from "../types/game";
import { getPieceDefinitionById } from "../lib/pieceRegistry";

interface GameHUDProps {
  state: GameState;
  selectedPiece: Piece | null;
  activeCount: number;
  onEndTurn: () => void;
  onDeselect: () => void;
  onAttack: (targetId: string) => void;
}

// Player display config
const PLAYER_CONFIG: Record<Player, { label: string; color: string; bg: string }> = {
  white: { label: "White Mage", color: "#c9a84c", bg: "rgba(201,168,76,0.1)" },
  black: { label: "Shadow Lord", color: "#9b6de0", bg: "rgba(155,109,224,0.1)" },
};

function StatBadge({ icon, value, label, color }: {
  icon: React.ReactNode; value: number | string; label: string; color: string;
}) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      <div className="flex items-center gap-1" style={{ color }}>
        {icon}
        <span className="font-bold text-sm leading-none">{value}</span>
      </div>
      <span className="text-[9px] uppercase tracking-widest text-[#8b7d6b]">{label}</span>
    </div>
  );
}

export function GameHUD({
  state, selectedPiece, activeCount, onEndTurn, onDeselect, onAttack,
}: GameHUDProps) {
  const { currentPlayer, turnNumber, phase, winner } = state;
  const cfg = PLAYER_CONFIG[currentPlayer];

  const def = selectedPiece ? getPieceDefinitionById(selectedPiece.definitionId) : null;
  const canMove = selectedPiece && !selectedPiece.hasMoved;
  const canAct  = selectedPiece && !selectedPiece.hasActed;

  return (
    <div className="flex flex-col gap-3 w-full">

      {/* ── Phase / Win Banner ──────────────────────────── */}
      {phase === "ended" && winner && (
        <div
          className="flex items-center justify-center gap-2 rounded-lg px-4 py-3 border"
          style={{
            background: PLAYER_CONFIG[winner].bg,
            borderColor: PLAYER_CONFIG[winner].color,
          }}
        >
          <Crown className="size-5" style={{ color: PLAYER_CONFIG[winner].color }} />
          <span
            className="font-serif font-bold tracking-widest text-base uppercase"
            style={{ color: PLAYER_CONFIG[winner].color }}
          >
            {PLAYER_CONFIG[winner].label} Victorious!
          </span>
        </div>
      )}

      {/* ── Turn Indicator ──────────────────────────────── */}
      <div
        className="flex items-center justify-between rounded-lg px-4 py-2.5 border"
        style={{
          background: cfg.bg,
          borderColor: `${cfg.color}50`,
        }}
      >
        <div className="flex flex-col">
          <span
            className="font-serif font-bold uppercase tracking-[0.15em] text-sm"
            style={{ color: cfg.color }}
          >
            {cfg.label}
          </span>
          <span className="text-[10px] text-[#8b7d6b] uppercase tracking-widest">
            Turn {turnNumber} · {activeCount} piece{activeCount !== 1 ? "s" : ""} active
          </span>
        </div>

        <button
          onClick={onEndTurn}
          disabled={phase === "ended"}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold uppercase tracking-wider border transition-all hover:scale-105 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          style={{
            background: `linear-gradient(135deg, ${cfg.color} 0%, ${cfg.color}99 100%)`,
            borderColor: cfg.color,
            color: "#fdfbf7",
            boxShadow: `0 4px 12px ${cfg.color}40`,
          }}
        >
          End Turn
          <ChevronRight className="size-3" />
        </button>
      </div>

      {/* ── Selected Piece Panel ─────────────────────────── */}
      {selectedPiece && def ? (
        <div
          className="rounded-lg border px-4 py-3 flex flex-col gap-3"
          style={{
            background: "rgba(253,251,247,0.6)",
            borderColor: "#c9a84c40",
          }}
        >
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="text-xl leading-none">{def.symbol}</span>
                <div>
                  <p className="font-serif font-bold text-sm text-[#1e3a6e]">{def.name}</p>
                  <p className="text-[10px] text-[#8b7d6b] uppercase tracking-widest">{def.faction} · Tier {def.tier}</p>
                </div>
              </div>
            </div>
            <button
              onClick={onDeselect}
              className="text-[#8b7d6b] hover:text-[#2c2c2c] transition-colors p-1 cursor-pointer"
            >
              <RotateCcw className="size-3.5" />
            </button>
          </div>

          {/* Stats */}
          <div className="flex items-center justify-around py-2 border-t border-b border-[#c9a84c20]">
            {selectedPiece.maxHp > 0 ? (
              <StatBadge
                icon={<Heart className="size-3" />}
                value={`${selectedPiece.hp}/${selectedPiece.maxHp}`}
                label="HP"
                color="#4ade80"
              />
            ) : (
              <StatBadge
                icon={<Swords className="size-3" />}
                value="∞"
                label="One-Shot"
                color="#f87171"
              />
            )}
            <StatBadge
              icon={<Swords className="size-3" />}
              value={selectedPiece.attack}
              label="ATK"
              color="#f97316"
            />
            <StatBadge
              icon={<Shield className="size-3" />}
              value={selectedPiece.defense}
              label="DEF"
              color="#60a5fa"
            />
          </div>

          {/* Action status */}
          <div className="flex gap-2">
            <div
              className="flex-1 flex items-center justify-center gap-1 rounded py-1 text-[10px] font-medium uppercase tracking-wider"
              style={{
                background: canMove ? "rgba(74,222,128,0.1)" : "rgba(0,0,0,0.05)",
                color: canMove ? "#4ade80" : "#8b7d6b",
                border: `1px solid ${canMove ? "rgba(74,222,128,0.3)" : "transparent"}`,
              }}
            >
              <span>{canMove ? "● Can Move" : "✓ Moved"}</span>
            </div>
            <div
              className="flex-1 flex items-center justify-center gap-1 rounded py-1 text-[10px] font-medium uppercase tracking-wider"
              style={{
                background: canAct ? "rgba(248,113,113,0.1)" : "rgba(0,0,0,0.05)",
                color: canAct ? "#f87171" : "#8b7d6b",
                border: `1px solid ${canAct ? "rgba(248,113,113,0.3)" : "transparent"}`,
              }}
            >
              <span>{canAct ? "● Can Attack" : "✓ Acted"}</span>
            </div>
          </div>

          {/* Abilities */}
          {selectedPiece.abilities.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] uppercase tracking-widest text-[#8b7d6b]">Abilities</span>
              {selectedPiece.abilities.map(ab => (
                <div
                  key={ab.id}
                  className="flex items-center justify-between rounded px-2.5 py-1.5 border"
                  style={{
                    background: ab.currentCooldown > 0 ? "rgba(0,0,0,0.03)" : "rgba(155,109,224,0.08)",
                    borderColor: ab.currentCooldown > 0 ? "#2c2c2c10" : "rgba(155,109,224,0.3)",
                  }}
                >
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold text-[#1e3a6e]">{ab.name}</span>
                    <span className="text-[9px] text-[#8b7d6b]">{ab.description}</span>
                  </div>
                  <div className="shrink-0 ml-2">
                    {ab.currentCooldown > 0 ? (
                      <span className="text-[9px] text-[#8b7d6b] whitespace-nowrap">
                        CD {ab.currentCooldown}t
                      </span>
                    ) : (
                      <div className="flex items-center gap-0.5" style={{ color: "#9b6de0" }}>
                        <Zap className="size-3" />
                        <span className="text-[9px] font-bold">Ready</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* No selection — hint */
        <div
          className="rounded-lg border border-dashed px-4 py-4 flex items-center justify-center"
          style={{ borderColor: "#c9a84c40" }}
        >
          <p className="text-xs text-[#8b7d6b] text-center italic font-serif">
            Select a piece to see its actions
          </p>
        </div>
      )}

      {/* ── Turn Legend ──────────────────────────────────── */}
      <div className="flex items-center gap-3 flex-wrap">
        {[
          { color: "rgba(201,168,76,0.5)", label: "Selected" },
          { color: "rgba(74,222,128,0.5)", label: "Move" },
          { color: "rgba(248,113,113,0.5)", label: "Attack" },
          { color: "rgba(155,109,224,0.5)", label: "Ability" },
        ].map(({ color, label }) => (
          <div key={label} className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-sm border border-white/20" style={{ background: color }} />
            <span className="text-[9px] uppercase tracking-widest text-[#8b7d6b]">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}