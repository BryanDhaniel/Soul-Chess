// ============================================================
// SOULCHESS — /play/local
// ============================================================
"use client";
import { useState, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Crown, ChevronLeft, Swords, Shield, Heart, Zap,
  X, Bot, User, Info, Layers, Play, AlertTriangle,
  Cpu, ChevronRight,
} from "lucide-react";
import type { Piece, DeckConfig, Player } from "../../types/game";
import { useGameState } from "../../hooks/useGameState";
import { Board } from "../../components/Board";
import { coordKey } from "../../lib/boardUtils";
import { getPieceDefinitionById } from "../../lib/pieceRegistry";
import {
  loadDecks, loadActiveDeckId, makeDefaultDeck, makeRandomDeck,
  isDeckValid, getDeckErrors,
} from "../../lib/deckStorage";
import type { AIDifficulty } from "../../lib/ai";
import { sfx, getMuted, setMuted } from "../../lib/sounds";

// ─── Keyframes ────────────────────────────────────────────────
const STYLES = `
  @keyframes slideDown { from{opacity:0;transform:translateY(-14px)} to{opacity:1;transform:translateY(0)} }
  @keyframes slideUp   { from{opacity:0;transform:translateY(14px)}  to{opacity:1;transform:translateY(0)} }
  @keyframes scaleIn   { from{opacity:0;transform:scale(0.93)}       to{opacity:1;transform:scale(1)} }
  @keyframes panelIn   { from{opacity:0;transform:translateX(20px) scale(0.97)} to{opacity:1;transform:translateX(0) scale(1)} }
  @keyframes fadeIn    { from{opacity:0} to{opacity:1} }
  @keyframes turnPop   { 0%{transform:scale(1)} 45%{transform:scale(1.06)} 100%{transform:scale(1)} }
  @keyframes shimmer   { 0%,100%{opacity:0.45} 50%{opacity:1} }
  @keyframes winDrop   { from{opacity:0;transform:scale(0.85) translateY(-20px)} to{opacity:1;transform:scale(1) translateY(0)} }
  @keyframes modeIn    { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
  @keyframes fabPop    { from{opacity:0;transform:scale(0.8) translateY(8px)} to{opacity:1;transform:scale(1) translateY(0)} }
  @keyframes spin      { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
  @keyframes pulseDot  { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.55;transform:scale(0.8)} }
  @keyframes avatarIn  { from{opacity:0;transform:translateX(-12px)} to{opacity:1;transform:translateX(0)} }
  @keyframes warnIn    { from{opacity:0;transform:scale(0.92) translateY(-10px)} to{opacity:1;transform:scale(1) translateY(0)} }
`;

// ─── Player config ────────────────────────────────────────────
const PLAYER_CFG: Record<Player, { label: string; color: string }> = {
  white: { label: "White Mage",  color: "#c9a84c" },
  black: { label: "Shadow Lord", color: "#9b6de0" },
};

const FACTION_COLOR: Record<string, string> = {
  Arcane: "#c9a84c", Void: "#9b6de0", Iron: "#7a8fa0",
};

// ─── App flow steps ───────────────────────────────────────────
type GameMode = "ai-black" | "ai-white" | "pvp";
type AppStep  = "mode" | "difficulty" | "deck-p1" | "deck-p2" | "battle";

// ─── Ornate divider ───────────────────────────────────────────
function OrnDivider() {
  return (
    <div className="flex items-center gap-2 w-full" style={{ opacity: 0.45 }}>
      <div className="h-px flex-1" style={{ background: "linear-gradient(90deg,transparent,#c9a84c)" }} />
      <div style={{ width: 5, height: 5, transform: "rotate(45deg)", background: "#c9a84c" }} />
      <div className="h-px flex-1" style={{ background: "linear-gradient(90deg,#c9a84c,transparent)" }} />
    </div>
  );
}

// ─── Captured Pieces ─────────────────────────────────────────
// Shows symbols of pieces captured BY this player (killed from opponent)
function CapturedPieces({
  capturedByPlayer, history, player,
}: {
  capturedByPlayer: Player;
  history: import("../../types/game").TurnRecord[];
  player: Player;
}) {
  const captured = history.filter(
    r => r.player === capturedByPlayer && r.capturedDefinitionId
  );
  if (captured.length === 0) return null;

  return (
    <div className="flex flex-col items-center gap-1 w-full">
      <div className="flex flex-wrap justify-center gap-0.5 max-w-[52px]">
        {captured.map((r, i) => {
          const def = getPieceDefinitionById(r.capturedDefinitionId!);
          return (
            <span
              key={i}
              title={def.name}
              style={{
                fontSize: 10,
                lineHeight: 1,
                opacity: 0.75,
                color: capturedByPlayer === "white" ? "#1e2535" : "#fdfbf7",
                background: capturedByPlayer === "white" ? "transparent" : "rgba(30,37,53,0.85)",
                borderRadius: 3,
                padding: capturedByPlayer === "white" ? 0 : "0 2px",
              }}
            >
              {def.symbol}
            </span>
          );
        })}
      </div>
      {captured.length > 0 && (
        <span style={{ fontSize: 7, color: "#8b7d6b", letterSpacing: "0.05em" }}>
          +{captured.length}
        </span>
      )}
    </div>
  );
}

// ─── Move History Mini ────────────────────────────────────────
function MoveHistoryMini({
  history,
}: {
  history: import("../../types/game").TurnRecord[];
}) {
  // Show last 6 records max
  const recent = [...history].reverse().slice(0, 6);
  if (recent.length === 0) return null;

  return (
    <div
      className="flex flex-col gap-0.5 w-full"
      style={{ animation: "fadeIn 0.3s ease both" }}
    >
      {/* Label */}
      <div className="flex items-center gap-1 justify-center mb-0.5">
        <div style={{ width: 12, height: 1, background: "rgba(201,168,76,0.4)" }} />
        <span style={{ fontSize: 7, color: "#8b7d6b", letterSpacing: "0.06em", textTransform: "uppercase" }}>Log</span>
        <div style={{ width: 12, height: 1, background: "rgba(201,168,76,0.4)" }} />
      </div>

      {recent.map((r, i) => {
        const isWhite = r.player === "white";
        const color   = isWhite ? "#c9a84c" : "#9b6de0";
        const def     = r.pieceDefinitionId
          ? getPieceDefinitionById(r.pieceDefinitionId)
          : null;
        const capDef  = r.capturedDefinitionId
          ? getPieceDefinitionById(r.capturedDefinitionId)
          : null;

        return (
          <div
            key={i}
            className="flex items-center gap-1 px-1.5 py-0.5 rounded"
            style={{
              background: i === 0 ? `${color}10` : "transparent",
              border: i === 0 ? `1px solid ${color}25` : "1px solid transparent",
              opacity: 1 - i * 0.14,
              transition: "all 0.2s ease",
            }}
          >
            {/* Player dot */}
            <div style={{ width: 5, height: 5, borderRadius: "50%", background: color, flexShrink: 0 }} />
            {/* Piece symbol */}
            <span style={{
              fontSize: 9, lineHeight: 1,
              color: isWhite ? "#1e2535" : "#fdfbf7",
              background: isWhite ? "transparent" : "rgba(30,37,53,0.85)",
              borderRadius: 3,
              padding: isWhite ? 0 : "0 2px",
            }}>
              {def?.symbol ?? "?"}
            </span>
            {/* Action */}
            <span style={{ fontSize: 7, color: "#8b7d6b", letterSpacing: "0.03em", flexShrink: 0 }}>
              {r.action === "attack" ? "×" : "→"}
            </span>
            {/* Captured symbol or destination */}
            {capDef ? (
              <span style={{ fontSize: 9, lineHeight: 1, color: "#f87171" }}>
                {capDef.symbol}
              </span>
            ) : (
              r.to && (
                <span style={{ fontSize: 7, color: "#8b7d6b", fontFamily: "monospace" }}>
                  {String.fromCharCode(65 + r.to.col)}{16 - r.to.row}
                </span>
              )
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Player Avatar Card ───────────────────────────────────────
function PlayerCard({
  player, isAI, isActive, piecesLeft,
}: {
  player: Player;
  isAI: boolean;
  isActive: boolean;
  piecesLeft: number;
}) {
  const cfg      = PLAYER_CFG[player];
  const initials = isAI ? "AI" : player === "white" ? "WM" : "SL";
  const name     = isAI ? "Shadow AI" : cfg.label;
  const rank     = isAI ? "Arcane Bot" : "Grandmaster";

  return (
    <div
      className="flex flex-col items-center gap-1.5 w-14"
      style={{ opacity: isActive ? 1 : 0.5, transition: "opacity 0.4s ease" }}
    >
      {/* Avatar with active ring */}
      <div className="relative">
        {/* Spinning conic ring when active */}
        {isActive && (
          <div
            className="absolute rounded-full"
            style={{
              inset: -3,
              background: `conic-gradient(${cfg.color} 0deg, ${cfg.color}60 120deg, transparent 120deg)`,
              borderRadius: "50%",
              animation: "spin 2.5s linear infinite",
            }}
          />
        )}
        {/* Avatar circle */}
        <div
          className="relative w-11 h-11 rounded-full flex items-center justify-center z-10"
          style={{
            background: player === "white"
              ? "linear-gradient(135deg,#fdfbf7 0%,#e8dcc6 100%)"
              : "linear-gradient(135deg,#1a1f2e 0%,#0d111a 100%)",
            border: `2px solid ${isActive ? cfg.color : cfg.color + "45"}`,
            boxShadow: isActive ? `0 0 0 2px ${cfg.color}25, 0 4px 14px ${cfg.color}25` : "none",
            transition: "box-shadow 0.4s ease, border-color 0.4s ease",
          }}
        >
          {isAI ? (
            <Bot
              className="size-4"
              style={{ color: cfg.color, animation: isActive ? "shimmer 1.2s ease infinite" : "none" }}
            />
          ) : (
            <span
              className="font-serif font-bold text-[10px]"
              style={{ color: player === "white" ? "#1e3a6e" : cfg.color }}
            >
              {initials}
            </span>
          )}
        </div>
        {/* Active dot */}
        {isActive && (
          <div
            className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full z-20"
            style={{
              background: cfg.color,
              border: "2px solid #f5f0e8",
              boxShadow: `0 0 5px ${cfg.color}`,
              animation: "pulseDot 1.4s ease infinite",
            }}
          />
        )}
      </div>

      {/* Name */}
      <div className="flex flex-col items-center text-center">
        <span
          className="font-serif font-bold leading-tight text-center"
          style={{ fontSize: 9, color: isActive ? cfg.color : "#8b7d6b" }}
        >
          {player === "white" ? "White" : "Black"}
        </span>
        <span style={{ fontSize: 7, color: "#8b7d6b", letterSpacing: "0.05em" }}>
          {rank}
        </span>
      </div>

      {/* Piece count pill */}
      <div
        className="flex items-center gap-1 px-1.5 py-0.5 rounded-full"
        style={{
          background: isActive ? `${cfg.color}18` : "rgba(0,0,0,0.05)",
          border: `1px solid ${isActive ? cfg.color + "40" : "rgba(0,0,0,0.08)"}`,
          transition: "background 0.4s ease, border-color 0.4s ease",
        }}
      >
        <span style={{ fontSize: 8, fontWeight: 700, color: isActive ? cfg.color : "#8b7d6b" }}>
          {piecesLeft}
        </span>
        <span style={{ fontSize: 7, color: "#8b7d6b", letterSpacing: "0.05em" }}>pcs</span>
      </div>
    </div>
  );
}

// ─── Floating Piece Info Panel ────────────────────────────────
// Abilities that require the player to manually pick a target tile
const TARGETED_ABILITIES = new Set(["royal_swap", "royal_teleport"]);

function PiecePanel({
  piece, isEnemy = false, activeAbilityId, onActivateAbility, onClose,
}: {
  piece: Piece;
  isEnemy?: boolean;
  activeAbilityId?: string | null;
  onActivateAbility?: (abilityId: string) => void;
  onClose: () => void;
}) {
  const def   = getPieceDefinitionById(piece.definitionId);
  const fc    = FACTION_COLOR[def.faction] ?? "#c9a84c";
  // Enemy pieces shown with a subtle red tint on the border
  const borderColor = isEnemy ? "rgba(248,113,113,0.4)" : "rgba(201,168,76,0.35)";
  const ownerColor  = isEnemy ? "#f87171" : "#4ade80";
  const ownerLabel  = isEnemy ? "Enemy" : "Yours";

  return (
    <div
      className="absolute z-40 flex flex-col overflow-hidden"
      style={{
        top: 16, right: 16, width: 220,
        background: "rgba(253,251,247,0.97)",
        border: `1px solid ${borderColor}`,
        borderRadius: 14,
        boxShadow: "0 12px 40px rgba(30,58,110,0.12), 0 2px 8px rgba(0,0,0,0.06)",
        animation: "panelIn 0.28s cubic-bezier(0.22,1,0.36,1) both",
        backdropFilter: "blur(12px)",
      }}
    >
      {/* Header */}
      <div
        className="flex items-center gap-2.5 px-4 py-3 shrink-0"
        style={{ borderBottom: `1px solid ${borderColor}` }}
      >
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center text-lg shrink-0"
          style={{ background: `${fc}15`, border: `1.5px solid ${fc}40`, color: "#1e2535" }}
        >
          {def.symbol}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="font-serif font-bold text-sm text-[#1e3a6e] leading-tight truncate">{def.name}</p>
            <span
              className="shrink-0 text-[7px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full"
              style={{ background: `${ownerColor}18`, color: ownerColor, border: `1px solid ${ownerColor}40` }}
            >
              {ownerLabel}
            </span>
          </div>
          <div className="flex items-center gap-1.5 mt-0.5">
            <p className="text-[9px] uppercase tracking-wider truncate" style={{ color: fc }}>
              {def.faction} · T{def.tier}
            </p>
            {isEnemy && (
              <span
                className="text-[7px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider shrink-0"
                style={{ background: "rgba(155,109,224,0.15)", color: "#9b6de0" }}
              >
                Enemy
              </span>
            )}
          </div>
        </div>
        <button
          onClick={onClose}
          className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 cursor-pointer"
          style={{ color: "#8b7d6b" }}
        >
          <X className="size-3" />
        </button>
      </div>

      <div className="flex flex-col gap-3 p-4">
        <OrnDivider />

        {/* Abilities */}
        {piece.abilities.length > 0 && (
          <div className="flex flex-col gap-1.5">
            <span className="text-[9px] uppercase tracking-wider text-[#8b7d6b]">Abilities</span>
            {piece.abilities.map(ab => {
              const isTargeted = TARGETED_ABILITIES.has(ab.id);
              const isActive   = activeAbilityId === ab.id;

              return (
                <div
                  key={ab.id}
                  className="flex flex-col gap-1 px-2.5 py-2 rounded-lg"
                  style={{
                    background: isActive
                      ? "rgba(155,109,224,0.18)"
                      : ab.currentCooldown > 0 ? "rgba(0,0,0,0.03)" : "rgba(155,109,224,0.08)",
                    border: `1px solid ${isActive ? "rgba(155,109,224,0.55)" : ab.currentCooldown > 0 ? "rgba(0,0,0,0.06)" : "rgba(155,109,224,0.28)"}`,
                  }}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-semibold text-[#1e3a6e]">{ab.name}</span>
                    <div className="shrink-0">
                      {ab.currentCooldown > 0 ? (
                        <span className="text-[8px] text-[#8b7d6b]">CD {ab.currentCooldown}</span>
                      ) : (
                        <span className="flex items-center gap-0.5 text-[#9b6de0] text-[8px] font-bold">
                          <Zap className="size-2.5" />Ready
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="text-[8px] text-[#8b7d6b] leading-snug">{ab.description}</span>

                  {/* Hint — purple targets are already shown on the board, no click needed */}
                  {!isEnemy && isTargeted && isActive && (
                    <span className="text-[8px] text-[#9b6de0] font-semibold mt-0.5">
                      ✦ Purple tiles on the board — click one
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Win Overlay ──────────────────────────────────────────────
function WinOverlay({ winner, isDraw = false, reason = "captured", onRematch, onExit }: {
  winner?: Player | null;
  isDraw?: boolean;
  reason?: "captured" | "no-king";
  onRematch: () => void;
  onExit: () => void;
}) {
  const cfg      = winner ? PLAYER_CFG[winner] : { label: "Draw", color: "#8b7d6b" };
  const subtitle = isDraw
    ? "No moves available — stalemate"
    : reason === "no-king"
      ? "Opponent's King was not deployed"
      : "The enemy King has fallen";
  return (
    <div
      className="absolute inset-0 z-50 flex items-center justify-center"
      style={{ background: "rgba(15,12,8,0.6)", backdropFilter: "blur(6px)", animation: "fadeIn 0.3s ease both" }}
    >
      <div
        className="flex flex-col items-center gap-5 mx-4"
        style={{
          background: "linear-gradient(160deg,#fdfbf7 0%,#f0e8d8 100%)",
          border: `1.5px solid ${cfg.color}`,
          borderRadius: 20,
          padding: "36px 40px",
          boxShadow: `0 0 0 4px ${cfg.color}20, 0 24px 64px rgba(0,0,0,0.35)`,
          animation: "winDrop 0.45s cubic-bezier(0.34,1.56,0.64,1) both",
          minWidth: 260,
        }}
      >
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center"
          style={{ background: `${cfg.color}15`, border: `2px solid ${cfg.color}50` }}
        >
          {isDraw
            ? <span style={{ fontSize: 32 }}>⚖</span>
            : <Crown className="size-8" style={{ color: cfg.color }} />
          }
        </div>
        <div className="text-center flex flex-col gap-1.5 w-full">
          <p className="text-[10px] uppercase tracking-[0.4em] text-[#8b7d6b]">
            {isDraw ? "Stalemate" : "Victory"}
          </p>
          <h2 className="font-serif font-bold text-2xl uppercase tracking-widest" style={{ color: cfg.color }}>
            {isDraw ? "Draw" : cfg.label}
          </h2>
          <OrnDivider />
          <p className="text-[10px] text-[#8b7d6b] italic font-serif mt-1">
            &quot;The board is a battlefield of souls.&quot;
          </p>
        </div>
        <div className="flex gap-2.5 w-full">
          <button
            onClick={onRematch}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold uppercase tracking-wider text-[#fdfbf7] cursor-pointer hover:opacity-90 transition-opacity"
            style={{ background: `linear-gradient(135deg,${cfg.color},${cfg.color}cc)` }}
          >
            <Play className="size-3 fill-current" /> Rematch
          </button>
          <button
            onClick={onExit}
            className="flex-1 py-2.5 rounded-xl text-xs font-semibold uppercase tracking-wider cursor-pointer"
            style={{ border: "1px solid rgba(201,168,76,0.35)", color: "#8b7d6b", background: "transparent" }}
          >
            Exit
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Shared page chrome ───────────────────────────────────────
function PageChrome({ children }: { children: React.ReactNode }) {
  return (
    <>
      <style>{STYLES}</style>
      <div
        className="min-h-screen w-full flex flex-col items-center justify-center gap-8 p-8 overflow-x-hidden"
        style={{ background: "radial-gradient(ellipse at top,#fff4c2 0%,#f5f0e8 50%,#ece4d3 100%)" }}
      >
        <div
          className="pointer-events-none fixed inset-0 opacity-[0.04]"
          style={{
            backgroundImage: "repeating-conic-gradient(#2c2c2c 0deg 90deg,transparent 90deg 180deg)",
            backgroundSize: "56px 56px",
          }}
        />
        {children}
      </div>
    </>
  );
}

// ─── Mode Select ──────────────────────────────────────────────
function ModeSelect({ onSelect }: { onSelect: (m: GameMode) => void }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { const t = setTimeout(() => setMounted(true), 30); return () => clearTimeout(t); }, []);

  const modes: { mode: GameMode; title: string; sub: string; color: string; delay: string }[] = [
    { mode: "ai-black", title: "Play as White", sub: "You (White) vs AI (Black)", color: "#c9a84c", delay: "0.15s" },
    { mode: "ai-white", title: "Play as Black", sub: "AI (White) vs You (Black)", color: "#9b6de0", delay: "0.22s" },
    { mode: "pvp",      title: "Local PvP",     sub: "Two players, one screen",   color: "#8b7d6b", delay: "0.29s" },
  ];

  return (
    <PageChrome>
      <div
        className="flex flex-col items-center gap-3 relative z-10"
        style={{ animation: mounted ? "slideDown 0.45s ease both 0.05s" : "none" }}
      >
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center border"
          style={{ background: "linear-gradient(135deg,#fdfbf7,#ece4d3)", borderColor: "#c9a84c60", boxShadow: "0 4px 20px rgba(201,168,76,0.15)" }}
        >
          <Crown className="size-7 text-[#b8860b]" />
        </div>
        <div className="text-center">
          <h1 className="font-serif font-bold text-3xl text-[#1e3a6e] tracking-widest uppercase">SoulChess</h1>
          <p className="text-[10px] uppercase tracking-[0.45em] text-[#8b7d6b] mt-1">Choose your battle</p>
        </div>
      </div>
      <div
        className="flex flex-col gap-3 w-full max-w-xs relative z-10"
        style={{ animation: mounted ? "slideUp 0.45s ease both 0.1s" : "none" }}
      >
        {modes.map(({ mode, title, sub, color, delay }) => (
          <button
            key={mode}
            onClick={() => onSelect(mode)}
            className="flex items-center gap-4 px-5 py-4 cursor-pointer transition-all hover:scale-[1.02] text-left"
            style={{
              background: "rgba(253,251,247,0.8)",
              border: `1px solid ${color}40`,
              borderRadius: 14,
              boxShadow: `0 2px 16px ${color}10`,
              animation: mounted ? `modeIn 0.4s ease both ${delay}` : "none",
            }}
          >
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: `${color}20`, border: `1px solid ${color}40` }}
            >
              <User className="size-5" style={{ color }} />
            </div>
            <div className="flex flex-col">
              <span className="font-serif font-bold text-sm text-[#1e3a6e]">{title}</span>
              <span className="text-[10px] text-[#8b7d6b] mt-0.5 uppercase tracking-wider">{sub}</span>
            </div>
          </button>
        ))}
      </div>
    </PageChrome>
  );
}

// ─── Difficulty Select ────────────────────────────────────────
const DIFFICULTY_CFG: {
  id: AIDifficulty;
  label: string;
  tag: string;
  desc: string;
  color: string;
  icon: string;
  delay: string;
}[] = [
  {
    id: "random", label: "Easy", tag: "Carefree",
    desc: "The AI makes random moves. Good for learning.",
    color: "#4ade80", icon: "🌿", delay: "0.12s",
  },
  {
    id: "greedy", label: "Normal", tag: "Cunning",
    desc: "The AI prioritises captures and advances aggressively.",
    color: "#c9a84c", icon: "⚔️", delay: "0.20s",
  },
  {
    id: "minimax", label: "Hard", tag: "Relentless",
    desc: "The AI looks two moves ahead to find the best play.",
    color: "#f87171", icon: "🔮", delay: "0.28s",
  },
];

function DifficultySelect({
  mode,
  onSelect,
  onBack,
}: {
  mode: GameMode;
  onSelect: (d: AIDifficulty) => void;
  onBack: () => void;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { const t = setTimeout(() => setMounted(true), 30); return () => clearTimeout(t); }, []);

  const sideLabel = mode === "ai-black" ? "You play White" : "You play Black";
  const sideColor = mode === "ai-black" ? "#c9a84c" : "#9b6de0";

  return (
    <PageChrome>
      <div
        className="flex flex-col items-center gap-2 relative z-10"
        style={{ animation: mounted ? "slideDown 0.4s ease both 0.05s" : "none" }}
      >
        <div
          className="w-14 h-14 rounded-full flex items-center justify-center border"
          style={{ background: "linear-gradient(135deg,#fdfbf7,#ece4d3)", borderColor: `${sideColor}60`, boxShadow: `0 4px 20px ${sideColor}20` }}
        >
          <Cpu className="size-6" style={{ color: sideColor }} />
        </div>
        <div className="text-center">
          <h1 className="font-serif font-bold text-2xl text-[#1e3a6e] tracking-widest uppercase">Choose Difficulty</h1>
          <p className="text-[10px] uppercase tracking-[0.35em] mt-1" style={{ color: sideColor }}>{sideLabel}</p>
        </div>
      </div>

      <div className="flex flex-col gap-3 w-full max-w-xs relative z-10">
        {DIFFICULTY_CFG.map(({ id, label, tag, desc, color, icon, delay }) => (
          <button
            key={id}
            onClick={() => onSelect(id)}
            className="flex items-center gap-4 px-5 py-4 cursor-pointer transition-all hover:scale-[1.02] text-left group"
            style={{
              background: "rgba(253,251,247,0.88)",
              border: `1px solid ${color}40`,
              borderRadius: 14,
              boxShadow: `0 2px 16px ${color}08`,
              animation: mounted ? `modeIn 0.4s ease both ${delay}` : "none",
            }}
          >
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 text-xl"
              style={{ background: `${color}18`, border: `1px solid ${color}40` }}
            >
              {icon}
            </div>
            <div className="flex flex-col flex-1">
              <div className="flex items-center gap-2">
                <span className="font-serif font-bold text-sm text-[#1e3a6e]">{label}</span>
                <span
                  className="text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full"
                  style={{ background: `${color}18`, color, border: `1px solid ${color}40` }}
                >
                  {tag}
                </span>
              </div>
              <span className="text-[10px] text-[#8b7d6b] mt-0.5 leading-snug">{desc}</span>
            </div>
            <ChevronRight className="size-4 shrink-0 transition-transform group-hover:translate-x-0.5" style={{ color: color }} />
          </button>
        ))}

        <button
          onClick={onBack}
          className="text-[10px] uppercase tracking-wider text-[#8b7d6b] cursor-pointer hover:text-[#1e3a6e] transition-colors mt-1"
        >
          ← Back
        </button>
      </div>
    </PageChrome>
  );
}

// ─── Deck Picker (PvP) ────────────────────────────────────────
function DeckPickerPvP({
  allDecks,
  step,          // "deck-p1" | "deck-p2"
  onConfirm,
  onBack,
}: {
  allDecks: DeckConfig[];
  step: "deck-p1" | "deck-p2";
  onConfirm: (deck: DeckConfig) => void;
  onBack: () => void;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { const t = setTimeout(() => setMounted(true), 30); return () => clearTimeout(t); }, []);

  const isP1       = step === "deck-p1";
  const playerNum  = isP1 ? 1 : 2;
  const playerColor = isP1 ? "#c9a84c" : "#9b6de0";
  const playerLabel = isP1 ? "Player 1 — White" : "Player 2 — Black";

  const [selectedId, setSelectedId] = useState<string | null>(
    allDecks.find(d => isDeckValid(d.slots))?.id ?? null
  );

  const selectedDeck = allDecks.find(d => d.id === selectedId) ?? null;
  const isValid      = selectedDeck !== null && isDeckValid(selectedDeck.slots);
  const errors       = selectedDeck ? getDeckErrors(selectedDeck.slots) : [];

  return (
    <PageChrome>
      {/* Header */}
      <div
        className="flex flex-col items-center gap-2 relative z-10"
        style={{ animation: mounted ? "slideDown 0.4s ease both 0.05s" : "none" }}
      >
        <div
          className="w-14 h-14 rounded-full flex items-center justify-center border"
          style={{
            background: "linear-gradient(135deg,#fdfbf7,#ece4d3)",
            borderColor: `${playerColor}60`,
            boxShadow: `0 4px 20px ${playerColor}20`,
          }}
        >
          <Layers className="size-6" style={{ color: playerColor }} />
        </div>
        <div className="text-center">
          <h1 className="font-serif font-bold text-2xl text-[#1e3a6e] tracking-widest uppercase">Choose Deck</h1>
          <p className="text-[10px] uppercase tracking-[0.35em] mt-1" style={{ color: playerColor }}>
            {playerLabel}
          </p>
        </div>
      </div>

      {/* Deck list */}
      <div
        className="flex flex-col gap-2 w-full max-w-xs relative z-10 overflow-y-auto overflow-x-hidden"
        style={{
          maxHeight: "40vh",
          animation: mounted ? "slideUp 0.4s ease both 0.1s" : "none",
        }}
      >
        {allDecks.length === 0 ? (
          <div
            className="flex flex-col items-center gap-2 p-6 rounded-xl text-center"
            style={{ background: "rgba(253,251,247,0.8)", border: "1px solid rgba(201,168,76,0.25)" }}
          >
            <span style={{ fontSize: 28 }}>📭</span>
            <p className="font-serif text-sm text-[#1e3a6e]">No decks found</p>
            <p className="text-[10px] text-[#8b7d6b]">Build a deck first in the Decks page.</p>
          </div>
        ) : (
          allDecks.map((deck, i) => {
            const valid   = isDeckValid(deck.slots);
            const isSelected = deck.id === selectedId;
            const borderCol  = isSelected ? playerColor : valid ? "rgba(201,168,76,0.3)" : "rgba(248,113,113,0.3)";

            return (
              <button
                key={deck.id}
                onClick={() => setSelectedId(deck.id)}
                className="flex items-center gap-3 px-4 py-3 cursor-pointer text-left transition-all hover:scale-[1.01]"
                style={{
                  background: isSelected ? `${playerColor}12` : "rgba(253,251,247,0.85)",
                  border: `1.5px solid ${borderCol}`,
                  borderRadius: 12,
                  boxShadow: isSelected ? `0 0 0 2px ${playerColor}20` : "none",
                  animation: mounted ? `modeIn 0.35s ease both ${i * 0.07}s` : "none",
                }}
              >
                {/* Selection indicator */}
                <div
                  className="w-4 h-4 rounded-full flex items-center justify-center shrink-0"
                  style={{
                    border: `2px solid ${isSelected ? playerColor : "rgba(201,168,76,0.4)"}`,
                    background: isSelected ? playerColor : "transparent",
                    transition: "all 0.2s ease",
                  }}
                >
                  {isSelected && <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#fdfbf7" }} />}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-serif font-bold text-sm text-[#1e3a6e] truncate">{deck.name}</p>
                  <p className="text-[9px] text-[#8b7d6b] mt-0.5">
                    {deck.slots.length} pieces
                  </p>
                </div>

                {/* Valid badge */}
                {valid ? (
                  <span
                    className="text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full shrink-0"
                    style={{ background: "rgba(74,222,128,0.15)", color: "#4ade80", border: "1px solid rgba(74,222,128,0.35)" }}
                  >
                    Ready
                  </span>
                ) : (
                  <span
                    className="text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full shrink-0"
                    style={{ background: "rgba(248,113,113,0.12)", color: "#f87171", border: "1px solid rgba(248,113,113,0.3)" }}
                  >
                    Invalid
                  </span>
                )}
              </button>
            );
          })
        )}
      </div>

      {/* Errors for selected invalid deck */}
      {!isValid && selectedDeck && errors.length > 0 && (
        <div className="flex flex-col gap-1.5 w-full max-w-xs relative z-10">
          {errors.map(err => (
            <div
              key={err}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-[10px]"
              style={{ background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.22)", color: "#f87171" }}
            >
              <AlertTriangle className="size-3 shrink-0" />
              {err}
            </div>
          ))}
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-2.5 w-full max-w-xs relative z-10">
        <button
          onClick={() => { if (isValid && selectedDeck) onConfirm(selectedDeck); }}
          disabled={!isValid}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold uppercase tracking-wider text-[#fdfbf7] transition-opacity cursor-pointer"
          style={{
            background: isValid
              ? `linear-gradient(135deg,${playerColor},${playerColor}cc)`
              : "rgba(0,0,0,0.1)",
            color: isValid ? "#fdfbf7" : "#8b7d6b",
            cursor: isValid ? "pointer" : "not-allowed",
            opacity: isValid ? 1 : 0.6,
          }}
        >
          {isP1 ? "Next: Player 2" : "Start Battle"}
          {isP1 ? <ChevronRight className="size-3" /> : <Swords className="size-3" />}
        </button>
        <button
          onClick={onBack}
          className="px-4 py-2.5 rounded-xl text-xs font-semibold uppercase tracking-wider cursor-pointer"
          style={{ border: "1px solid rgba(201,168,76,0.35)", color: "#8b7d6b", background: "transparent" }}
        >
          Back
        </button>
      </div>
    </PageChrome>
  );
}

// ─── Deck Invalid Warning ──────────────────────────────────────
// Shown instead of ModeSelect when the player's active deck doesn't
// satisfy deck rules (must be exactly 20 pieces, with exactly 1 Soul
// King + 1 Soulbound Queen). Blocks entry into a match entirely.
function DeckInvalidWarning({
  errors, onGoToDecks, onBack,
}: {
  errors: string[];
  onGoToDecks: () => void;
  onBack: () => void;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { const t = setTimeout(() => setMounted(true), 30); return () => clearTimeout(t); }, []);

  return (
    <PageChrome>
      <div
        className="flex flex-col items-center gap-5 relative z-10 max-w-sm w-full"
        style={{
          background: "rgba(253,251,247,0.92)",
          border: "1.5px solid rgba(248,113,113,0.45)",
          borderRadius: 18,
          padding: "32px 28px",
          boxShadow: "0 24px 64px rgba(0,0,0,0.18)",
          animation: mounted ? "warnIn 0.4s cubic-bezier(0.22,1,0.36,1) both" : "none",
        }}
      >
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center"
          style={{ background: "rgba(248,113,113,0.12)", border: "2px solid rgba(248,113,113,0.4)" }}
        >
          <AlertTriangle className="size-7" style={{ color: "#f87171" }} />
        </div>

        <div className="text-center flex flex-col gap-1.5 w-full">
          <p className="text-[10px] uppercase tracking-[0.4em] text-[#8b7d6b]">Invalid Deck</p>
          <h2 className="font-serif font-bold text-xl text-[#1e3a6e]">Not Yet Ready to Compete</h2>
          <OrnDivider />
          <p className="text-[11px] text-[#8b7d6b] mt-1">
            Your main deck does not meet the requirements for play:
          </p>
        </div>

        {/* Error list */}
        <div className="flex flex-col gap-1.5 w-full">
          {errors.map(err => (
            <div
              key={err}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-[11px]"
              style={{
                background: "rgba(248,113,113,0.08)",
                border: "1px solid rgba(248,113,113,0.22)",
                color: "#f87171",
              }}
            >
              <AlertTriangle className="size-3 shrink-0" />
              {err}
            </div>
          ))}
        </div>

        <div className="flex gap-2.5 w-full">
          <button
            onClick={onGoToDecks}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold uppercase tracking-wider text-[#fdfbf7] cursor-pointer hover:opacity-90 transition-opacity"
            style={{ background: "linear-gradient(135deg,#c9a84c,#b8860b)" }}
          >
            <Layers className="size-3.5" /> Edit Deck
          </button>
          <button
            onClick={onBack}
            className="flex-1 py-2.5 rounded-xl text-xs font-semibold uppercase tracking-wider cursor-pointer"
            style={{ border: "1px solid rgba(201,168,76,0.35)", color: "#8b7d6b", background: "transparent" }}
          >
            Back
          </button>
        </div>
      </div>
    </PageChrome>
  );
}

// ─── Battle View ──────────────────────────────────────────────
function BattleView({
  whiteDeck, blackDeck, mode, aiDifficulty, onRematch,
}: {
  whiteDeck: DeckConfig; blackDeck: DeckConfig;
  mode: GameMode; aiDifficulty: AIDifficulty; onRematch: () => void;
}) {
  const router = useRouter();
  const [mounted, setMounted]         = useState(false);
  const [panelOpen, setPanelOpen]     = useState(false);
  const [viewingPiece, setViewingPiece] = useState<Piece | null>(null);
  const [muted, setMutedState]        = useState(false);

  const toggleMute = useCallback(() => {
    const next = !getMuted();
    setMuted(next);
    setMutedState(next);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 30);
    return () => clearTimeout(t);
  }, []);

  const humanPlayer: Player = mode === "ai-white" ? "black" : "white";
  const aiPlayers: Partial<Record<Player, AIDifficulty>> =
    mode === "ai-black" ? { black: aiDifficulty } :
    mode === "ai-white" ? { white: aiDifficulty } : {};

  const {
    state, selectPiece, deselect, movePiece, attackPiece,
    activateAbility, useAbility,
    selectedPiece, validMoveKeys, validAttackKeys, validAbilityKeys, isAITurn,
  } = useGameState({ whiteDeck, blackDeck, aiPlayers, aiDelay: 600 });

  const { currentPlayer, turnNumber, phase, winner } = state;
  const cfg         = PLAYER_CFG[currentPlayer];
  const isCurrentAI = mode !== "pvp" && currentPlayer !== humanPlayer;
  const opponentPlayer: Player = humanPlayer === "white" ? "black" : "white";

  // Play victory / defeat once when game ends
  const prevWinnerRef = useRef<typeof winner>(null);
  useEffect(() => {
    const ended = phase === "ended" || phase === "draw";
    if (ended && !prevWinnerRef.current) {
      setTimeout(() => {
        if (state.isDraw) sfx.turnSwitch(); // neutral sound for draw
        else if (winner === humanPlayer) sfx.victory();
        else sfx.defeat();
      }, 250);
    }
    prevWinnerRef.current = winner;
  }, [winner, phase, humanPlayer, state.isDraw]);

  // Auto-open panel when piece selected or viewed
  useEffect(() => {
    if (selectedPiece) {
      setViewingPiece(null); // clear enemy view when we select our own
      setPanelOpen(true);
    }
  }, [selectedPiece?.id]);

  const handleTileClick = useCallback((row: number, col: number, piece: Piece | null) => {
    // ── Ability target mode (Royal Swap / Royal Teleport) ─────
    if (state.activeAbilityId && state.selectedPieceId) {
      const key = coordKey({ row, col });
      if (validAbilityKeys.has(key)) {
        useAbility({ row, col });
        return;
      }
      // Clicked outside valid targets — cancel ability mode, fall through to normal handling
    }

    // Always allow viewing any piece info regardless of whose turn it is
    if (piece && piece.owner !== currentPlayer) {
      // Enemy piece clicked
      if (!isAITurn && phase === "battle" && validAttackKeys.has(coordKey({ row, col }))) {
        // Valid attack target — attack it
        if (mode === "pvp" || currentPlayer === humanPlayer) {
          attackPiece(piece.id);
          return;
        }
      }
      // Not a valid attack (or AI turn) — show enemy piece info
      setViewingPiece(piece);
      setPanelOpen(true);
      return;
    }

    // Below: clicking own piece or empty tile
    if (isAITurn || phase !== "battle") return;
    if (mode !== "pvp" && currentPlayer !== humanPlayer) return;

    const coord = { row, col };
    const key   = coordKey(coord);

    if (validMoveKeys.has(key) && !piece) {
      setViewingPiece(null);
      movePiece(coord); return;
    }
    if (piece && piece.owner === currentPlayer) {
      setViewingPiece(null);
      piece.id === state.selectedPieceId ? deselect() : selectPiece(piece.id); return;
    }
    // Empty non-move tile — clear everything
    setViewingPiece(null);
    sfx.invalid();
    deselect();
  }, [
    isAITurn, phase, mode, currentPlayer, humanPlayer, state.selectedPieceId, state.activeAbilityId,
    validMoveKeys, validAttackKeys, validAbilityKeys, movePiece, attackPiece, useAbility, selectPiece, deselect,
  ]);

  // Piece counts
  const opponentPieces = Object.values(state.pieces).filter(p => p.owner === opponentPlayer).length;
  const humanPieces    = Object.values(state.pieces).filter(p => p.owner === humanPlayer).length;

  // Check if either king is missing from decks
  const whiteMissingKing = !state.kingIds.white;
  const blackMissingKing = !state.kingIds.black;

  // Difficulty badge (AI modes only)
  const difficultyLabel = DIFFICULTY_CFG.find(d => d.id === aiDifficulty);

  return (
    <>
      <style>{STYLES}</style>
      <div
        className="h-screen w-full flex flex-col overflow-hidden"
        style={{ background: "radial-gradient(ellipse at 60% 0%,#fff4c2 0%,#f5f0e8 40%,#ece4d3 100%)" }}
      >
        {/* Win overlay — victory or draw */}
        {(phase === "ended" || phase === "draw") && (
          <WinOverlay
            winner={winner}
            isDraw={state.isDraw}
            reason={whiteMissingKing || blackMissingKing ? "no-king" : "captured"}
            onRematch={onRematch}
            onExit={() => router.push("/")}
          />
        )}

        {/* Missing king warning banner */}
        {(whiteMissingKing || blackMissingKing) && phase === "battle" && (
          <div
            className="flex items-center justify-center gap-2 px-4 py-2 text-xs shrink-0"
            style={{ background: "rgba(248,113,113,0.12)", borderBottom: "1px solid rgba(248,113,113,0.3)", color: "#f87171" }}
          >
            <span>⚠</span>
            <span className="font-serif">
              {whiteMissingKing && blackMissingKing
                ? "Both decks are missing a Soul King — game cannot end"
                : whiteMissingKing
                  ? "White deck has no Soul King"
                  : "Black deck has no Soul King"}
            </span>
          </div>
        )}

        {/* ── Header ─────────────────────────────────── */}
        <header
          className="flex items-center justify-between px-5 py-2 shrink-0"
          style={{
            background: "rgba(253,251,247,0.85)",
            borderBottom: "1px solid rgba(201,168,76,0.2)",
            backdropFilter: "blur(10px)",
            animation: mounted ? "slideDown 0.35s ease both" : "none",
          }}
        >
          <button
            onClick={() => router.push("/")}
            className="flex items-center gap-1.5 cursor-pointer"
            style={{ color: "#8b7d6b" }}
          >
            <ChevronLeft className="size-4" />
            <span className="text-[10px] uppercase tracking-[0.3em] font-medium hidden sm:block">Exit</span>
          </button>

          <div
            className="flex flex-col items-center gap-0.5"
            key={`${currentPlayer}-${turnNumber}`}
            style={{ animation: "turnPop 0.35s ease both" }}
          >
            <div className="flex items-center gap-2">
              {isCurrentAI
                ? <Bot className="size-3.5" style={{ color: cfg.color, animation: "shimmer 1.2s ease infinite" }} />
                : <User className="size-3.5" style={{ color: cfg.color }} />
              }
              <span className="font-serif font-bold text-sm uppercase tracking-widest" style={{ color: cfg.color }}>
                {isCurrentAI ? `${cfg.label} (AI)` : cfg.label}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[9px] uppercase tracking-[0.3em] text-[#8b7d6b]">
                Turn {turnNumber} · {isCurrentAI ? "thinking…" : "move or attack"}
              </span>
              {/* Difficulty pill in AI mode */}
              {mode !== "pvp" && difficultyLabel && (
                <span
                  className="text-[7px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full"
                  style={{ background: `${difficultyLabel.color}18`, color: difficultyLabel.color, border: `1px solid ${difficultyLabel.color}40` }}
                >
                  {difficultyLabel.label}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Mute toggle */}
            <button
              onClick={toggleMute}
              className="flex items-center justify-center w-7 h-7 rounded-full cursor-pointer transition-all hover:scale-110"
              style={{
                background: muted ? "rgba(248,113,113,0.1)" : "rgba(201,168,76,0.1)",
                border: `1px solid ${muted ? "rgba(248,113,113,0.35)" : "rgba(201,168,76,0.3)"}`,
                color: muted ? "#f87171" : "#b8860b",
              }}
              title={muted ? "Unmute" : "Mute"}
            >
              <span style={{ fontSize: 12 }}>{muted ? "🔇" : "🔊"}</span>
            </button>
            <Crown className="size-4 text-[#b8860b]" />
            <span className="font-serif font-bold text-sm text-[#1e3a6e] tracking-wider hidden sm:block">
              SoulChess
            </span>
          </div>
        </header>

        {/* ── Main area: avatar col + board ──────────── */}
        <div className="flex-1 flex items-center justify-center p-2 min-h-0 relative">

          {/* Inner row: avatar sidebar + board */}
          <div className="flex items-center gap-3 h-full w-full max-w-fit">

            {/* ── Left column — hidden on mobile ── */}
            <div
              className="hidden sm:flex flex-col items-center self-stretch py-2 shrink-0 gap-2"
              style={{
                width: 60,
                animation: mounted ? "avatarIn 0.45s ease both 0.15s" : "none",
              }}
            >
              {/* Opponent avatar */}
              <PlayerCard
                player={opponentPlayer}
                isAI={mode !== "pvp"}
                isActive={currentPlayer === opponentPlayer}
                piecesLeft={opponentPieces}
              />

              {/* Pieces captured BY opponent */}
              <CapturedPieces
                capturedByPlayer={opponentPlayer}
                history={state.history}
                player={opponentPlayer}
              />

              {/* Separator line */}
              <div className="w-px flex-1 min-h-0" style={{ background: "linear-gradient(180deg,rgba(201,168,76,0.0),rgba(201,168,76,0.25),rgba(201,168,76,0.0))" }} />

              {/* Turn number badge */}
              <div
                className="flex flex-col items-center gap-1 shrink-0"
                key={`turn-${turnNumber}`}
              >
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center"
                  style={{
                    background: "rgba(201,168,76,0.08)",
                    border: "1px solid rgba(201,168,76,0.3)",
                    boxShadow: "0 0 8px rgba(201,168,76,0.1)",
                  }}
                >
                  <span className="font-serif font-bold text-[#b8860b]" style={{ fontSize: 9 }}>
                    {turnNumber}
                  </span>
                </div>
                {/* Move history */}
                <MoveHistoryMini history={state.history} />
              </div>

              {/* Separator line */}
              <div className="w-px flex-1 min-h-0" style={{ background: "linear-gradient(180deg,rgba(201,168,76,0.0),rgba(201,168,76,0.25),rgba(201,168,76,0.0))" }} />

              {/* Pieces captured BY human */}
              <CapturedPieces
                capturedByPlayer={humanPlayer}
                history={state.history}
                player={humanPlayer}
              />

              {/* Human avatar */}
              <PlayerCard
                player={humanPlayer}
                isAI={false}
                isActive={currentPlayer === humanPlayer}
                piecesLeft={humanPieces}
              />
            </div>

            {/* Board */}
            <div
              style={{
                width:  "min(100%, calc(100vh - 60px))",
                height: "min(100%, calc(100vh - 60px))",
                maxWidth: 680, maxHeight: 680,
                aspectRatio: "1/1",
                animation: mounted ? "scaleIn 0.45s ease both 0.05s" : "none",
              }}
            >
              <Board
                state={state}
                onTileClick={handleTileClick}
                flipped={humanPlayer === "black"}
              />
            </div>
          </div>

          {/* Floating piece info panel (absolute over board) */}
          {panelOpen && (selectedPiece || viewingPiece) && (
            <PiecePanel
              piece={(selectedPiece ?? viewingPiece)!}
              isEnemy={!selectedPiece && viewingPiece !== null}
              activeAbilityId={state.activeAbilityId}
              onActivateAbility={selectedPiece ? activateAbility : undefined}
              onClose={() => {
                setPanelOpen(false);
                setViewingPiece(null);
                if (selectedPiece) deselect();
              }}
            />
          )}

          {/* Legend — bottom left */}
          <div
            className="absolute bottom-3 left-3 flex flex-col gap-1 pointer-events-none"
            style={{ animation: mounted ? "fadeIn 0.5s ease both 0.3s" : "none" }}
          >
            {[
              { color: "rgba(201,168,76,0.55)",  label: "Selected" },
              { color: "rgba(74,222,128,0.55)",  label: "Move" },
              { color: "rgba(248,113,113,0.55)", label: "Attack" },
            ].map(({ color, label }) => (
              <div key={label} className="flex items-center gap-1.5">
                <div style={{ width: 8, height: 8, borderRadius: 2, background: color }} />
                <span className="text-[8px] uppercase tracking-wider text-[#8b7d6b]">{label}</span>
              </div>
            ))}
          </div>

          {/* FAB buttons — bottom right */}
          <div
            className="absolute bottom-3 right-3 flex flex-col gap-1.5 items-end"
            style={{ animation: mounted ? "fabPop 0.4s ease both 0.2s" : "none" }}
          >
            <button
              onClick={() => (selectedPiece || viewingPiece) && setPanelOpen(p => !p)}
              className="flex items-center gap-2 px-3.5 py-2 cursor-pointer transition-all hover:scale-[1.03]"
              style={{
                background: (selectedPiece || viewingPiece) && panelOpen ? "rgba(201,168,76,0.15)" : "rgba(253,251,247,0.95)",
                border: `1px solid ${(selectedPiece || viewingPiece) && panelOpen ? "rgba(201,168,76,0.7)" : "rgba(201,168,76,0.3)"}`,
                borderRadius: 20,
                boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
                color: (selectedPiece || viewingPiece) ? "#b8860b" : "#8b7d6b",
                opacity: (selectedPiece || viewingPiece) ? 1 : 0.5,
                backdropFilter: "blur(8px)",
              }}
            >
              <Info className="size-3.5" />
              <span className="font-serif text-[10px] font-semibold uppercase tracking-wider">
                {(selectedPiece || viewingPiece) ? (panelOpen ? "Hide Info" : "Show Info") : "Piece Info"}
              </span>
            </button>
            <button
              onClick={() => router.push("/decks")}
              className="flex items-center gap-2 px-3.5 py-2 cursor-pointer transition-all hover:scale-[1.03]"
              style={{
                background: "rgba(253,251,247,0.95)",
                border: "1px solid rgba(201,168,76,0.25)",
                borderRadius: 20,
                boxShadow: "0 2px 12px rgba(0,0,0,0.07)",
                color: "#8b7d6b",
                backdropFilter: "blur(8px)",
              }}
            >
              <Layers className="size-3.5" />
              <span className="font-serif text-[10px] font-semibold uppercase tracking-wider">Edit Decks</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Page entry ───────────────────────────────────────────────
export default function PlayLocalPage() {
  const router = useRouter();

  // All decks from localStorage
  const [allDecks, setAllDecks] = useState<DeckConfig[] | null>(null);

  useEffect(() => {
    const decks = loadDecks();
    const aid   = loadActiveDeckId();
    // Sort: active deck first, then by name
    const sorted = [...decks].sort((a, b) => {
      if (a.id === aid) return -1;
      if (b.id === aid) return 1;
      return a.name.localeCompare(b.name);
    });
    setAllDecks(sorted.length > 0 ? sorted : [makeDefaultDeck("Default")]);
  }, []);

  // Navigation state
  const [step, setStep]                 = useState<AppStep>("mode");
  const [mode, setMode]                 = useState<GameMode | null>(null);
  const [aiDifficulty, setAiDifficulty] = useState<AIDifficulty>("random");
  const [whiteDeck, setWhiteDeck]       = useState<DeckConfig | null>(null);
  const [blackDeck, setBlackDeck]       = useState<DeckConfig | null>(null);
  const [rematchKey, setRematchKey]     = useState(0);

  // Loading screen
  if (!allDecks) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#f5f0e8" }}>
        <span className="font-serif text-[#8b7d6b] animate-pulse">Loading…</span>
      </div>
    );
  }

  // ── Mode select ──────────────────────────────────────────────
  if (step === "mode") {
    return (
      <ModeSelect
        onSelect={selected => {
          setMode(selected);
          if (selected === "pvp") {
            setStep("deck-p1");
          } else {
            setStep("difficulty");
          }
        }}
      />
    );
  }

  // ── Difficulty select (AI modes only) ────────────────────────
  if (step === "difficulty" && mode && mode !== "pvp") {
    // Guard: validate the active deck before letting into AI battle
    const activeDeckId = loadActiveDeckId();
    const activeDeck   = allDecks.find(d => d.id === activeDeckId) ?? allDecks[0] ?? makeDefaultDeck("Default");

    if (!isDeckValid(activeDeck.slots)) {
      return (
        <DeckInvalidWarning
          errors={getDeckErrors(activeDeck.slots)}
          onGoToDecks={() => router.push("/decks")}
          onBack={() => setStep("mode")}
        />
      );
    }

    return (
      <DifficultySelect
        mode={mode}
        onSelect={diff => {
          setAiDifficulty(diff);
          // Set up decks for the AI match
          const playerDeck = activeDeck;
          const aiDeck     = makeRandomDeck("AI Deck");
          if (mode === "ai-black") {
            setWhiteDeck(playerDeck);
            setBlackDeck(aiDeck);
          } else {
            setWhiteDeck(aiDeck);
            setBlackDeck(playerDeck);
          }
          setStep("battle");
        }}
        onBack={() => setStep("mode")}
      />
    );
  }

  // ── PvP: Player 1 deck picker ────────────────────────────────
  if (step === "deck-p1") {
    return (
      <DeckPickerPvP
        allDecks={allDecks}
        step="deck-p1"
        onConfirm={deck => {
          setWhiteDeck(deck);
          setStep("deck-p2");
        }}
        onBack={() => setStep("mode")}
      />
    );
  }

  // ── PvP: Player 2 deck picker ────────────────────────────────
  if (step === "deck-p2") {
    return (
      <DeckPickerPvP
        allDecks={allDecks}
        step="deck-p2"
        onConfirm={deck => {
          setBlackDeck(deck);
          setMode("pvp");
          setStep("battle");
        }}
        onBack={() => setStep("deck-p1")}
      />
    );
  }

  // ── Battle ───────────────────────────────────────────────────
  if (step === "battle" && whiteDeck && blackDeck && mode) {
    return (
      <BattleView
        key={rematchKey}
        whiteDeck={whiteDeck}
        blackDeck={blackDeck}
        mode={mode}
        aiDifficulty={aiDifficulty}
        onRematch={() => {
          if (mode !== "pvp") {
            // Regenerate AI deck and stay in battle
            const activeDeckId = loadActiveDeckId();
            const activeDeck   = allDecks.find(d => d.id === activeDeckId) ?? allDecks[0];
            const aiDeck       = makeRandomDeck("AI Deck");
            if (mode === "ai-black") {
              setWhiteDeck(activeDeck);
              setBlackDeck(aiDeck);
            } else {
              setWhiteDeck(aiDeck);
              setBlackDeck(activeDeck);
            }
          }
          // PvP rematch keeps same decks
          setRematchKey(k => k + 1);
        }}
      />
    );
  }

  // Fallback
  return null;
}