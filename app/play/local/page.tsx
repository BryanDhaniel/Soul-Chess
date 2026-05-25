// ============================================================
// SOULCHESS — /play/local  (Battle — Human vs AI or PvP)
// ============================================================
"use client";
import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Crown, ChevronLeft, Swords, Shield, Heart, Zap,
  RotateCcw, Bot, User,
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

// ─── Player config ────────────────────────────────────────────
const PLAYER_CFG: Record<Player, { label: string; color: string }> = {
  white: { label: "White Mage",  color: "#c9a84c" },
  black: { label: "Shadow Lord", color: "#9b6de0" },
};

// ─── Mode selection screen ────────────────────────────────────
function ModeSelect({
  onSelect,
}: {
  onSelect: (mode: "ai-white" | "ai-black" | "pvp") => void;
}) {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center gap-8 p-8"
      style={{ background: "radial-gradient(ellipse at top,#fff4c2 0%,#f5f0e8 45%,#ece4d3 100%)" }}
    >
      {/* Decorative chess pattern */}
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.04]"
        style={{
          backgroundImage: "repeating-conic-gradient(#2c2c2c 0deg 90deg,transparent 90deg 180deg)",
          backgroundSize: "60px 60px",
        }}
      />

      <div className="flex flex-col items-center gap-2 relative z-10">
        <Crown className="size-8 text-[#b8860b]" />
        <h1 className="font-serif font-bold text-3xl text-[#1e3a6e] tracking-widest uppercase">
          SoulChess
        </h1>
        <p className="text-[11px] uppercase tracking-[0.4em] text-[#8b7d6b]">
          Choose your battle
        </p>
      </div>

      <div className="flex flex-col gap-3 w-full max-w-sm relative z-10">
        {/* VS AI — you play White */}
        <button
          onClick={() => onSelect("ai-black")}
          className="group flex items-center gap-4 px-6 py-4 rounded-xl border-2 cursor-pointer transition-all hover:scale-[1.02] text-left"
          style={{
            background: "linear-gradient(135deg,rgba(201,168,76,0.12) 0%,rgba(201,168,76,0.04) 100%)",
            borderColor: "#c9a84c60",
            boxShadow: "0 4px 20px rgba(201,168,76,0.1)",
          }}
        >
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: "linear-gradient(135deg,#c9a84c 0%,#b8860b 100%)" }}
          >
            <User className="size-6 text-[#fdfbf7]" />
          </div>
          <div className="flex flex-col">
            <span className="font-serif font-bold text-base text-[#1e3a6e]">
              Play as White
            </span>
            <span className="text-[10px] uppercase tracking-wider text-[#8b7d6b] mt-0.5">
              You (White) vs AI (Black)
            </span>
          </div>
        </button>

        {/* VS AI — you play Black */}
        <button
          onClick={() => onSelect("ai-white")}
          className="group flex items-center gap-4 px-6 py-4 rounded-xl border-2 cursor-pointer transition-all hover:scale-[1.02] text-left"
          style={{
            background: "linear-gradient(135deg,rgba(155,109,224,0.12) 0%,rgba(155,109,224,0.04) 100%)",
            borderColor: "#9b6de060",
            boxShadow: "0 4px 20px rgba(155,109,224,0.1)",
          }}
        >
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: "linear-gradient(135deg,#1e2535 0%,#2d1f4a 100%)" }}
          >
            <User className="size-6 text-[#9b6de0]" />
          </div>
          <div className="flex flex-col">
            <span className="font-serif font-bold text-base text-[#1e3a6e]">
              Play as Black
            </span>
            <span className="text-[10px] uppercase tracking-wider text-[#8b7d6b] mt-0.5">
              AI (White) vs You (Black)
            </span>
          </div>
        </button>

        {/* PvP — local */}
        <button
          onClick={() => onSelect("pvp")}
          className="group flex items-center gap-4 px-6 py-4 rounded-xl border-2 cursor-pointer transition-all hover:scale-[1.02] text-left"
          style={{
            background: "rgba(253,251,247,0.6)",
            borderColor: "#c9a84c30",
          }}
        >
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border border-[#c9a84c40]"
            style={{ background: "rgba(201,168,76,0.08)" }}
          >
            <User className="size-5 text-[#8b7d6b]" />
          </div>
          <div className="flex flex-col">
            <span className="font-serif font-bold text-base text-[#1e3a6e]">
              Local PvP
            </span>
            <span className="text-[10px] uppercase tracking-wider text-[#8b7d6b] mt-0.5">
              Two players, one screen
            </span>
          </div>
        </button>
      </div>
    </div>
  );
}

// ─── Piece info panel ─────────────────────────────────────────
function PiecePanel({ piece, onDeselect }: { piece: Piece; onDeselect: () => void }) {
  const def = getPieceDefinitionById(piece.definitionId);
  const hpPct = piece.maxHp > 0 ? (piece.hp / piece.maxHp) * 100 : 100;

  return (
    <div
      className="rounded-lg border px-3 py-3 flex flex-col gap-2.5"
      style={{ background: "rgba(253,251,247,0.7)", borderColor: "#c9a84c40" }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl leading-none">{def.symbol}</span>
          <div>
            <p className="font-serif font-bold text-sm text-[#1e3a6e]">{def.name}</p>
            <p className="text-[9px] uppercase tracking-wider text-[#8b7d6b]">
              {def.faction} · Tier {def.tier}
            </p>
          </div>
        </div>
        <button
          onClick={onDeselect}
          className="text-[#8b7d6b] hover:text-[#2c2c2c] transition-colors cursor-pointer p-1"
        >
          <RotateCcw className="size-3.5" />
        </button>
      </div>

      <div className="flex items-center justify-around py-2 border-t border-b border-[#c9a84c20]">
        {piece.maxHp > 0 ? (
          <div className="flex flex-col items-center gap-0.5">
            <span className="flex items-center gap-1 text-[#4ade80] font-bold text-sm">
              <Heart className="size-3" />{piece.hp}/{piece.maxHp}
            </span>
            <span className="text-[9px] uppercase tracking-widest text-[#8b7d6b]">HP</span>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-0.5">
            <span className="flex items-center gap-1 text-[#f87171] font-bold text-sm">
              <Swords className="size-3" />∞
            </span>
            <span className="text-[9px] uppercase tracking-widest text-[#8b7d6b]">One-Shot</span>
          </div>
        )}
        <div className="flex flex-col items-center gap-0.5">
          <span className="flex items-center gap-1 text-[#f97316] font-bold text-sm">
            <Swords className="size-3" />{piece.attack}
          </span>
          <span className="text-[9px] uppercase tracking-widest text-[#8b7d6b]">ATK</span>
        </div>
        <div className="flex flex-col items-center gap-0.5">
          <span className="flex items-center gap-1 text-[#60a5fa] font-bold text-sm">
            <Shield className="size-3" />{piece.defense}
          </span>
          <span className="text-[9px] uppercase tracking-widest text-[#8b7d6b]">DEF</span>
        </div>
      </div>

      {piece.maxHp > 0 && (
        <div className="h-1.5 rounded-full bg-black/10 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{
              width: `${hpPct}%`,
              background: hpPct > 60 ? "#4ade80" : hpPct > 30 ? "#facc15" : "#f87171",
            }}
          />
        </div>
      )}

      {piece.abilities.length > 0 && (
        <div className="flex flex-col gap-1">
          <span className="text-[9px] uppercase tracking-widest text-[#8b7d6b]">Abilities</span>
          {piece.abilities.map(ab => (
            <div
              key={ab.id}
              className="flex items-center justify-between rounded px-2 py-1.5 border"
              style={{
                background: ab.currentCooldown > 0 ? "rgba(0,0,0,0.03)" : "rgba(155,109,224,0.08)",
                borderColor: ab.currentCooldown > 0 ? "#2c2c2c10" : "rgba(155,109,224,0.3)",
              }}
            >
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-semibold text-[#1e3a6e] truncate">{ab.name}</span>
                <span className="text-[9px] text-[#8b7d6b] truncate">{ab.description}</span>
              </div>
              <div className="shrink-0 ml-2">
                {ab.currentCooldown > 0
                  ? <span className="text-[9px] text-[#8b7d6b] whitespace-nowrap">CD {ab.currentCooldown}t</span>
                  : <span className="flex items-center gap-0.5 text-[#9b6de0] text-[9px] font-bold"><Zap className="size-3" />Ready</span>
                }
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Legend ───────────────────────────────────────────────────
function Legend() {
  return (
    <div className="flex items-center gap-3 flex-wrap">
      {[
        { color: "rgba(201,168,76,0.5)",  label: "Selected" },
        { color: "rgba(74,222,128,0.5)",  label: "Move" },
        { color: "rgba(248,113,113,0.5)", label: "Attack" },
      ].map(({ color, label }) => (
        <div key={label} className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-sm border border-white/20" style={{ background: color }} />
          <span className="text-[9px] uppercase tracking-widest text-[#8b7d6b]">{label}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Win screen overlay ───────────────────────────────────────
function WinOverlay({
  winner, onRematch, onExit,
}: { winner: Player; onRematch: () => void; onExit: () => void }) {
  const cfg = PLAYER_CFG[winner];
  return (
    <div
      className="absolute inset-0 z-50 flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)" }}
    >
      <div
        className="flex flex-col items-center gap-5 px-10 py-8 rounded-2xl border-2 mx-4"
        style={{
          background: "linear-gradient(135deg,#fdfbf7 0%,#f5f0e8 100%)",
          borderColor: cfg.color,
          boxShadow: `0 0 0 4px ${cfg.color}30, 0 20px 60px rgba(0,0,0,0.3)`,
        }}
      >
        <Crown className="size-10" style={{ color: cfg.color }} />
        <div className="text-center">
          <p className="text-[10px] uppercase tracking-[0.4em] text-[#8b7d6b]">Victory</p>
          <h2
            className="font-serif font-bold text-2xl tracking-widest uppercase mt-1"
            style={{ color: cfg.color }}
          >
            {cfg.label}
          </h2>
          <p className="text-xs text-[#8b7d6b] mt-2 italic font-serif">
            &quot;The board is a battlefield of souls.&quot;
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={onRematch}
            className="px-5 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider text-[#fdfbf7] cursor-pointer hover:opacity-90 transition-opacity"
            style={{ background: `linear-gradient(135deg,${cfg.color} 0%,${cfg.color}cc 100%)` }}
          >
            Rematch
          </button>
          <button
            onClick={onExit}
            className="px-5 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider cursor-pointer border border-[#c9a84c40] text-[#8b7d6b] hover:text-[#1e3a6e] hover:border-[#c9a84c] transition-colors"
          >
            Exit
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Deck loader ──────────────────────────────────────────────
function useDecks() {
  const [decks, setDecks] = useState<{ white: DeckConfig; black: DeckConfig } | null>(null);
  useEffect(() => {
    const all  = loadDecks();
    const aid  = loadActiveDeckId();
    const fb   = makeDefaultDeck("Default");
    const white = all.find(d => d.id === aid) ?? all[0] ?? fb;
    const black = all[1] ?? all[0] ?? fb;
    setDecks({ white, black });
  }, []);
  return decks;
}

// ─── Battle view ──────────────────────────────────────────────
type GameMode = "ai-white" | "ai-black" | "pvp";

function BattleView({
  whiteDeck, blackDeck, mode, onRematch,
}: {
  whiteDeck: DeckConfig;
  blackDeck: DeckConfig;
  mode: GameMode;
  onRematch: () => void;
}) {
  const router = useRouter();

  // Map mode → aiPlayers config
  const aiPlayers: Partial<Record<Player, AIDifficulty>> = mode === "ai-black"
    ? { black: "random" }
    : mode === "ai-white"
      ? { white: "random" }
      : {};

  // Human player
  const humanPlayer: Player = mode === "ai-white" ? "black" : "white";

  const {
    state, selectPiece, deselect, movePiece, attackPiece,
    selectedPiece, validMoveKeys, validAttackKeys, isAITurn,
  } = useGameState({ whiteDeck, blackDeck, aiPlayers, aiDelay: 600 });

  const { currentPlayer, turnNumber, phase, winner } = state;
  const cfg = PLAYER_CFG[currentPlayer];

  // Derive label for current player
  const isCurrentAI = mode !== "pvp" && currentPlayer !== humanPlayer;

  const handleTileClick = useCallback((
    row: number, col: number, piece: Piece | null,
  ) => {
    // Block input during AI turn
    if (isAITurn) return;
    if (phase !== "battle") return;
    // In vs-AI modes, block input if it's not the human's turn
    if (mode !== "pvp" && currentPlayer !== humanPlayer) return;

    const coord = { row, col };
    const key   = coordKey(coord);

    if (piece && validAttackKeys.has(key) && piece.owner !== currentPlayer) {
      attackPiece(piece.id);
      return;
    }
    if (validMoveKeys.has(key) && !piece) {
      movePiece(coord);
      return;
    }
    if (piece && piece.owner === currentPlayer) {
      piece.id === state.selectedPieceId ? deselect() : selectPiece(piece.id);
      return;
    }
    deselect();
  }, [
    isAITurn, phase, mode, currentPlayer, humanPlayer,
    state.selectedPieceId, validMoveKeys, validAttackKeys,
    movePiece, attackPiece, selectPiece, deselect,
  ]);

  const turnLabel = isCurrentAI ? `${cfg.label} (AI) thinking…` : `${cfg.label}'s Turn`;

  return (
    <div
      className="h-screen w-full flex flex-col relative overflow-hidden"
      style={{ background: "radial-gradient(ellipse at top,#fff4c2 0%,#f5f0e8 45%,#ece4d3 100%)" }}
    >
      {/* Win overlay */}
      {phase === "ended" && winner && (
        <WinOverlay
          winner={winner}
          onRematch={onRematch}
          onExit={() => router.push("/")}
        />
      )}

      {/* Header */}
      <header
        className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-[#c9a84c30] shrink-0"
        style={{ background: "rgba(253,251,247,0.85)", backdropFilter: "blur(8px)" }}
      >
        <button
          onClick={() => router.push("/")}
          className="flex items-center gap-2 text-[#8b7d6b] hover:text-[#1e3a6e] transition-colors cursor-pointer"
        >
          <ChevronLeft className="size-4" />
          <span className="text-xs uppercase tracking-widest font-medium">Exit</span>
        </button>

        {/* Turn indicator */}
        <div className="flex flex-col items-center">
          <div className="flex items-center gap-1.5">
            {isCurrentAI
              ? <Bot className="size-3.5 animate-pulse" style={{ color: cfg.color }} />
              : <User className="size-3.5" style={{ color: cfg.color }} />
            }
            <span
              className="font-serif font-bold text-sm uppercase tracking-widest"
              style={{ color: cfg.color }}
            >
              {turnLabel}
            </span>
          </div>
          <span className="text-[9px] uppercase tracking-widest text-[#8b7d6b]">
            Turn {turnNumber}
            {mode !== "pvp" && ` · ${mode === "ai-black" ? "You = White" : "You = Black"}`}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Crown className="size-4 text-[#b8860b]" />
          <span className="font-serif font-bold text-sm text-[#1e3a6e]">SoulChess</span>
        </div>
      </header>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden min-h-0">

        {/* Board — centred, square, fits viewport height without scrolling */}
        <div className="flex-1 flex items-center justify-center p-3 min-w-0 min-h-0 overflow-hidden">
          <div
            style={{
              /* Square: limited by whichever is smaller — remaining width or height */
              width:  "min(100%, calc(100vh - 120px))",
              height: "min(100%, calc(100vh - 120px))",
              maxWidth: 560,
              maxHeight: 560,
              aspectRatio: "1/1",
            }}
          >
            <Board state={state} onTileClick={handleTileClick} />
          </div>
        </div>

        {/* Right panel */}
        <aside
          className="hidden lg:flex flex-col gap-4 w-64 xl:w-72 shrink-0 p-4 border-l border-[#c9a84c30] overflow-y-auto"
          style={{ background: "rgba(253,251,247,0.7)" }}
        >
          {/* Turn pill */}
          <div
            className="rounded-lg px-3 py-2.5 border"
            style={{ background: `${cfg.color}12`, borderColor: `${cfg.color}50` }}
          >
            <div className="flex items-center justify-center gap-2">
              {isCurrentAI
                ? <Bot className="size-4 animate-pulse" style={{ color: cfg.color }} />
                : <User className="size-4" style={{ color: cfg.color }} />
              }
              <span
                className="font-serif font-bold text-sm uppercase tracking-widest"
                style={{ color: cfg.color }}
              >
                {isCurrentAI ? "AI Thinking…" : "Your Turn"}
              </span>
            </div>
            <p className="text-[9px] text-[#8b7d6b] text-center mt-1 uppercase tracking-widest">
              {isCurrentAI ? "Wait for AI to move" : "Move or attack → auto switch"}
            </p>
          </div>

          {/* Selected piece */}
          {selectedPiece ? (
            <PiecePanel piece={selectedPiece} onDeselect={deselect} />
          ) : (
            <div
              className="rounded-lg border border-dashed flex items-center justify-center px-4 py-5"
              style={{ borderColor: "#c9a84c40" }}
            >
              <p className="text-xs text-[#8b7d6b] italic font-serif text-center">
                {isAITurn ? "AI is choosing a move…" : "Select a piece to see its stats"}
              </p>
            </div>
          )}

          <Legend />

          <button
            onClick={() => router.push("/decks")}
            className="mt-auto flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-[#c9a84c40] text-xs text-[#8b7d6b] hover:text-[#1e3a6e] hover:border-[#c9a84c] transition-colors cursor-pointer"
          >
            Edit Decks
          </button>
        </aside>
      </div>

      {/* Mobile bottom bar */}
      <div
        className="lg:hidden border-t border-[#c9a84c30] px-4 py-3 flex items-center justify-between shrink-0"
        style={{ background: "rgba(253,251,247,0.95)" }}
      >
        <div className="flex items-center gap-2">
          {isCurrentAI
            ? <Bot className="size-4 animate-pulse" style={{ color: cfg.color }} />
            : <User className="size-4" style={{ color: cfg.color }} />
          }
          <span className="text-xs font-serif" style={{ color: cfg.color }}>
            {isCurrentAI
              ? "AI thinking…"
              : selectedPiece
                ? `${selectedPiece.definitionId.replace(/_/g, " ")} selected`
                : `${cfg.label} — tap a piece`
            }
          </span>
        </div>
        <button
          onClick={() => router.push("/decks")}
          className="text-xs text-[#8b7d6b] border border-[#c9a84c40] px-3 py-1.5 rounded-lg hover:bg-[#c9a84c10] transition-colors cursor-pointer"
        >
          Decks
        </button>
      </div>
    </div>
  );
}

// ─── Page entry ───────────────────────────────────────────────
export default function PlayLocalPage() {
  const decks = useDecks();
  const [mode, setMode] = useState<GameMode | null>(null);
  const [rematchKey, setRematchKey] = useState(0);
  // AI always gets a freshly generated random deck each game
  const [aiDeck, setAiDeck] = useState<DeckConfig | null>(null);

  if (!decks) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#f5f0e8" }}>
        <span className="font-serif text-[#8b7d6b] animate-pulse">Loading…</span>
      </div>
    );
  }

  if (!mode || !aiDeck) {
    return (
      <ModeSelect
        onSelect={(selectedMode) => {
          setMode(selectedMode);
          // Generate fresh random deck for AI (or null for PvP)
          setAiDeck(
            selectedMode !== "pvp"
              ? makeRandomDeck("AI Deck")
              : decks.white // PvP: aiDeck unused, just needs to be non-null
          );
        }}
      />
    );
  }

  // Assign decks: human always uses their saved deck, AI gets random
  const whiteDeck = mode === "ai-white" ? aiDeck : decks.white;
  const blackDeck = mode === "ai-black" ? aiDeck : decks.black;

  return (
    <BattleView
      key={rematchKey}
      whiteDeck={whiteDeck}
      blackDeck={blackDeck}
      mode={mode}
      onRematch={() => {
        // Generate a new random AI deck on rematch too
        if (mode !== "pvp") setAiDeck(makeRandomDeck("AI Deck"));
        setRematchKey(k => k + 1);
      }}
    />
  );
}