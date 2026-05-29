// ============================================================
// SOULCHESS — /play/local
// ============================================================
"use client";
import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Crown, ChevronLeft, Swords, Shield, Heart, Zap,
  X, Bot, User, Info, Layers, Play,
} from "lucide-react";
import type { Piece, DeckConfig, Player } from "../../types/game";
import { useGameState } from "../../hooks/useGameState";
import { Board } from "../../components/Board";
import { coordKey } from "../../lib/boardUtils";
import { getPieceDefinitionById } from "../../lib/pieceRegistry";
import {
  loadDecks, loadActiveDeckId, makeDefaultDeck, makeRandomDeck,
} from "../../lib/deckStorage";
import type { AIDifficulty } from "../../lib/ai";

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
`;

// ─── Player config ────────────────────────────────────────────
const PLAYER_CFG: Record<Player, { label: string; color: string }> = {
  white: { label: "White Mage",  color: "#c9a84c" },
  black: { label: "Shadow Lord", color: "#9b6de0" },
};

const FACTION_COLOR: Record<string, string> = {
  Arcane: "#c9a84c", Void: "#9b6de0", Iron: "#7a8fa0", Fire: "#e05c2a",
};

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

// ─── Player Avatar Card ───────────────────────────────────────
type GameMode = "ai-black" | "ai-white" | "pvp";

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
function PiecePanel({ piece, onClose }: { piece: Piece; onClose: () => void }) {
  const def   = getPieceDefinitionById(piece.definitionId);
  const fc    = FACTION_COLOR[def.faction] ?? "#c9a84c";
  const hpPct = piece.maxHp > 0 ? (piece.hp / piece.maxHp) * 100 : 100;

  return (
    <div
      className="absolute z-40 flex flex-col overflow-hidden"
      style={{
        top: 16, right: 16, width: 220,
        background: "rgba(253,251,247,0.97)",
        border: "1px solid rgba(201,168,76,0.35)",
        borderRadius: 14,
        boxShadow: "0 12px 40px rgba(30,58,110,0.12), 0 2px 8px rgba(0,0,0,0.06)",
        animation: "panelIn 0.28s cubic-bezier(0.22,1,0.36,1) both",
        backdropFilter: "blur(12px)",
      }}
    >
      {/* Header */}
      <div
        className="flex items-center gap-2.5 px-4 py-3 shrink-0"
        style={{ borderBottom: "1px solid rgba(201,168,76,0.18)" }}
      >
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center text-lg shrink-0"
          style={{ background: `${fc}15`, border: `1.5px solid ${fc}40` }}
        >
          {def.symbol}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-serif font-bold text-sm text-[#1e3a6e] leading-tight truncate">{def.name}</p>
          <p className="text-[9px] uppercase tracking-wider mt-0.5 truncate" style={{ color: fc }}>
            {def.faction} · T{def.tier}
          </p>
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
        {/* Stats */}
        <div className="grid grid-cols-3 gap-1.5">
          {piece.maxHp > 0 ? (
            <div className="flex flex-col items-center gap-1 py-2 rounded-lg"
              style={{ background: "rgba(74,222,128,0.08)", border: "1px solid rgba(74,222,128,0.25)" }}>
              <span className="flex items-center gap-0.5 font-bold text-xs text-[#4ade80]">
                <Heart className="size-2.5" />{piece.hp}/{piece.maxHp}
              </span>
              <span className="text-[8px] uppercase tracking-wider text-[#8b7d6b]">HP</span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-1 py-2 rounded-lg"
              style={{ background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.25)" }}>
              <span className="flex items-center gap-0.5 font-bold text-xs text-[#f87171]">
                <Swords className="size-2.5" />∞
              </span>
              <span className="text-[8px] uppercase tracking-wider text-[#8b7d6b]">Kill</span>
            </div>
          )}
          <div className="flex flex-col items-center gap-1 py-2 rounded-lg"
            style={{ background: "rgba(249,115,22,0.08)", border: "1px solid rgba(249,115,22,0.25)" }}>
            <span className="flex items-center gap-0.5 font-bold text-xs text-[#f97316]">
              <Swords className="size-2.5" />{piece.attack}
            </span>
            <span className="text-[8px] uppercase tracking-wider text-[#8b7d6b]">Atk</span>
          </div>
          <div className="flex flex-col items-center gap-1 py-2 rounded-lg"
            style={{ background: "rgba(96,165,250,0.08)", border: "1px solid rgba(96,165,250,0.25)" }}>
            <span className="flex items-center gap-0.5 font-bold text-xs text-[#60a5fa]">
              <Shield className="size-2.5" />{piece.defense}
            </span>
            <span className="text-[8px] uppercase tracking-wider text-[#8b7d6b]">Def</span>
          </div>
        </div>

        {/* HP bar */}
        {piece.maxHp > 0 && (
          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(0,0,0,0.08)" }}>
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${hpPct}%`,
                background: hpPct > 60
                  ? "linear-gradient(90deg,#4ade80,#22c55e)"
                  : hpPct > 30
                    ? "linear-gradient(90deg,#facc15,#f59e0b)"
                    : "linear-gradient(90deg,#f87171,#ef4444)",
              }}
            />
          </div>
        )}

        <OrnDivider />

        {/* Abilities */}
        {piece.abilities.length > 0 && (
          <div className="flex flex-col gap-1.5">
            <span className="text-[9px] uppercase tracking-wider text-[#8b7d6b]">Abilities</span>
            {piece.abilities.map(ab => (
              <div
                key={ab.id}
                className="flex items-center justify-between px-2.5 py-2 rounded-lg"
                style={{
                  background: ab.currentCooldown > 0 ? "rgba(0,0,0,0.03)" : "rgba(155,109,224,0.08)",
                  border: `1px solid ${ab.currentCooldown > 0 ? "rgba(0,0,0,0.06)" : "rgba(155,109,224,0.28)"}`,
                }}
              >
                <div className="flex flex-col min-w-0">
                  <span className="text-[10px] font-semibold text-[#1e3a6e] truncate">{ab.name}</span>
                  <span className="text-[8px] text-[#8b7d6b] truncate">{ab.description}</span>
                </div>
                <div className="shrink-0 ml-2">
                  {ab.currentCooldown > 0 ? (
                    <span className="text-[8px] text-[#8b7d6b]">CD {ab.currentCooldown}</span>
                  ) : (
                    <span className="flex items-center gap-0.5 text-[#9b6de0] text-[8px] font-bold">
                      <Zap className="size-2.5" />Ready
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Win Overlay ──────────────────────────────────────────────
function WinOverlay({ winner, onRematch, onExit }: {
  winner: Player; onRematch: () => void; onExit: () => void;
}) {
  const cfg = PLAYER_CFG[winner];
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
          <Crown className="size-8" style={{ color: cfg.color }} />
        </div>
        <div className="text-center flex flex-col gap-1.5 w-full">
          <p className="text-[10px] uppercase tracking-[0.4em] text-[#8b7d6b]">Victory</p>
          <h2 className="font-serif font-bold text-2xl uppercase tracking-widest" style={{ color: cfg.color }}>
            {cfg.label}
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
    <>
      <style>{STYLES}</style>
      <div
        className="min-h-screen w-full flex flex-col items-center justify-center gap-10 p-8"
        style={{ background: "radial-gradient(ellipse at top,#fff4c2 0%,#f5f0e8 50%,#ece4d3 100%)" }}
      >
        <div
          className="pointer-events-none fixed inset-0 opacity-[0.04]"
          style={{
            backgroundImage: "repeating-conic-gradient(#2c2c2c 0deg 90deg,transparent 90deg 180deg)",
            backgroundSize: "56px 56px",
          }}
        />
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
      </div>
    </>
  );
}

// ─── Battle View ──────────────────────────────────────────────
function BattleView({
  whiteDeck, blackDeck, mode, onRematch,
}: {
  whiteDeck: DeckConfig; blackDeck: DeckConfig;
  mode: GameMode; onRematch: () => void;
}) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 30);
    return () => clearTimeout(t);
  }, []);

  const humanPlayer: Player = mode === "ai-white" ? "black" : "white";
  const aiPlayers: Partial<Record<Player, AIDifficulty>> =
    mode === "ai-black" ? { black: "random" } :
    mode === "ai-white" ? { white: "random" } : {};

  const {
    state, selectPiece, deselect, movePiece, attackPiece,
    selectedPiece, validMoveKeys, validAttackKeys, isAITurn,
  } = useGameState({ whiteDeck, blackDeck, aiPlayers, aiDelay: 600 });

  const { currentPlayer, turnNumber, phase, winner } = state;
  const cfg         = PLAYER_CFG[currentPlayer];
  const isCurrentAI = mode !== "pvp" && currentPlayer !== humanPlayer;
  const opponentPlayer: Player = humanPlayer === "white" ? "black" : "white";

  // Auto-open panel when piece selected
  useEffect(() => {
    if (selectedPiece) setPanelOpen(true);
  }, [selectedPiece?.id]);

  const handleTileClick = useCallback((row: number, col: number, piece: Piece | null) => {
    if (isAITurn || phase !== "battle") return;
    if (mode !== "pvp" && currentPlayer !== humanPlayer) return;
    const coord = { row, col };
    const key   = coordKey(coord);
    if (piece && validAttackKeys.has(key) && piece.owner !== currentPlayer) {
      attackPiece(piece.id); return;
    }
    if (validMoveKeys.has(key) && !piece) {
      movePiece(coord); return;
    }
    if (piece && piece.owner === currentPlayer) {
      piece.id === state.selectedPieceId ? deselect() : selectPiece(piece.id); return;
    }
    deselect();
  }, [
    isAITurn, phase, mode, currentPlayer, humanPlayer, state.selectedPieceId,
    validMoveKeys, validAttackKeys, movePiece, attackPiece, selectPiece, deselect,
  ]);

  // Piece counts
  const opponentPieces = Object.values(state.pieces).filter(p => p.owner === opponentPlayer).length;
  const humanPieces    = Object.values(state.pieces).filter(p => p.owner === humanPlayer).length;

  return (
    <>
      <style>{STYLES}</style>
      <div
        className="h-screen w-full flex flex-col overflow-hidden"
        style={{ background: "radial-gradient(ellipse at 60% 0%,#fff4c2 0%,#f5f0e8 40%,#ece4d3 100%)" }}
      >
        {/* Win overlay */}
        {phase === "ended" && winner && (
          <WinOverlay winner={winner} onRematch={onRematch} onExit={() => router.push("/")} />
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
            <span className="text-[9px] uppercase tracking-[0.3em] text-[#8b7d6b]">
              Turn {turnNumber} · {isCurrentAI ? "thinking…" : "move or attack"}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
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

            {/* Avatar column — hidden on mobile */}
            <div
              className="hidden sm:flex flex-col justify-between items-center self-stretch py-2 shrink-0"
              style={{ animation: mounted ? "avatarIn 0.45s ease both 0.15s" : "none" }}
            >
              {/* Opponent avatar (top) */}
              <PlayerCard
                player={opponentPlayer}
                isAI={mode !== "pvp"}
                isActive={currentPlayer === opponentPlayer}
                piecesLeft={opponentPieces}
              />

              {/* Turn number in centre */}
              <div className="flex flex-col items-center gap-1.5">
                <div className="w-px" style={{ height: 28, background: "linear-gradient(180deg,transparent,rgba(201,168,76,0.35))" }} />
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center"
                  style={{ background: "rgba(201,168,76,0.08)", border: "1px solid rgba(201,168,76,0.25)" }}
                >
                  <span className="font-serif text-[9px] font-bold text-[#b8860b]">{turnNumber}</span>
                </div>
                <div className="w-px" style={{ height: 28, background: "linear-gradient(180deg,rgba(201,168,76,0.35),transparent)" }} />
              </div>

              {/* Human avatar (bottom) */}
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
          {selectedPiece && panelOpen && (
            <PiecePanel
              piece={selectedPiece}
              onClose={() => { setPanelOpen(false); deselect(); }}
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
              onClick={() => selectedPiece && setPanelOpen(p => !p)}
              className="flex items-center gap-2 px-3.5 py-2 cursor-pointer transition-all hover:scale-[1.03]"
              style={{
                background: selectedPiece && panelOpen ? "rgba(201,168,76,0.15)" : "rgba(253,251,247,0.95)",
                border: `1px solid ${selectedPiece && panelOpen ? "rgba(201,168,76,0.7)" : "rgba(201,168,76,0.3)"}`,
                borderRadius: 20,
                boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
                color: selectedPiece ? "#b8860b" : "#8b7d6b",
                opacity: selectedPiece ? 1 : 0.5,
                backdropFilter: "blur(8px)",
              }}
            >
              <Info className="size-3.5" />
              <span className="font-serif text-[10px] font-semibold uppercase tracking-wider">
                {selectedPiece ? (panelOpen ? "Hide Info" : "Show Info") : "Piece Info"}
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

// ─── Deck loader ──────────────────────────────────────────────
function useDecks() {
  const [playerDeck, setPlayerDeck] = useState<DeckConfig | null>(null);
  useEffect(() => {
    const all = loadDecks();
    const aid = loadActiveDeckId();
    const fb  = makeDefaultDeck("Default");
    setPlayerDeck(all.find(d => d.id === aid) ?? all[0] ?? fb);
  }, []);
  return playerDeck;
}

// ─── Page entry ───────────────────────────────────────────────
export default function PlayLocalPage() {
  const playerDeck        = useDecks();
  const [mode, setMode]   = useState<GameMode | null>(null);
  const [aiDeck, setAiDeck] = useState<DeckConfig | null>(null);
  const [rematchKey, setRematchKey] = useState(0);

  if (!playerDeck) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#f5f0e8" }}>
        <span className="font-serif text-[#8b7d6b] animate-pulse">Loading…</span>
      </div>
    );
  }

  if (!mode || !aiDeck) {
    return (
      <ModeSelect
        onSelect={selected => {
          setMode(selected);
          setAiDeck(selected !== "pvp" ? makeRandomDeck("AI Deck") : playerDeck);
        }}
      />
    );
  }

  const whiteDeck = mode === "ai-white" ? aiDeck : playerDeck;
  const blackDeck = mode === "ai-black" ? aiDeck : playerDeck;

  return (
    <BattleView
      key={rematchKey}
      whiteDeck={whiteDeck}
      blackDeck={blackDeck}
      mode={mode}
      onRematch={() => {
        if (mode !== "pvp") setAiDeck(makeRandomDeck("AI Deck"));
        setRematchKey(k => k + 1);
      }}
    />
  );
}