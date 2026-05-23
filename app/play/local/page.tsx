// ============================================================
// SOULCHESS — /play/local  (Battle)
// ============================================================
"use client";
import { useState, useCallback, useEffect } from "react";
import { Crown, ChevronLeft, Swords, Shield, Heart, Zap, RotateCcw } from "lucide-react";
import { useRouter } from "next/navigation";
import type { Piece, DeckConfig, Player } from "../../types/game";
import { useGameState } from "../../hooks/useGameState";
import { Board } from "../../components/Board";
import { coordKey } from "../../lib/boardUtils";
import { loadDecks, loadActiveDeckId, makeDefaultDeck } from "../../lib/deckStorage";
import { getPieceDefinitionById } from "../../lib/pieceRegistry";

// ─── Player theme ─────────────────────────────────────────────
const PLAYER_CFG: Record<Player, { label: string; color: string }> = {
  white: { label: "White Mage", color: "#c9a84c" },
  black: { label: "Shadow Lord", color: "#9b6de0" },
};

// ─── Piece Info Panel ─────────────────────────────────────────
function PieceInfoPanel({ piece, onDeselect }: { piece: Piece; onDeselect: () => void }) {
  const def = getPieceDefinitionById(piece.definitionId);
  return (
    <div
      className="rounded-lg border px-3 py-3 flex flex-col gap-2"
      style={{ background: "rgba(253,251,247,0.7)", borderColor: "#c9a84c40" }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl leading-none">{def.symbol}</span>
          <div>
            <p className="font-serif font-bold text-sm text-[#1e3a6e]">{def.name}</p>
            <p className="text-[9px] uppercase tracking-wider text-[#8b7d6b]">{def.faction} · T{def.tier}</p>
          </div>
        </div>
        <button onClick={onDeselect} className="text-[#8b7d6b] hover:text-[#2c2c2c] transition-colors cursor-pointer p-1">
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

      {/* HP bar */}
      {piece.maxHp > 0 && (
        <div className="h-1.5 rounded-full bg-black/10 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{
              width: `${(piece.hp / piece.maxHp) * 100}%`,
              background: piece.hp / piece.maxHp > 0.6 ? "#4ade80"
                : piece.hp / piece.maxHp > 0.3 ? "#facc15" : "#f87171",
            }}
          />
        </div>
      )}

      {/* Abilities */}
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
              <span className="text-xs font-semibold text-[#1e3a6e]">{ab.name}</span>
              {ab.currentCooldown > 0
                ? <span className="text-[9px] text-[#8b7d6b]">CD {ab.currentCooldown}t</span>
                : <span className="flex items-center gap-0.5 text-[#9b6de0] text-[9px] font-bold"><Zap className="size-3" />Ready</span>
              }
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Highlight legend ─────────────────────────────────────────
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

// ─── Main Page ────────────────────────────────────────────────
export default function PlayLocalPage() {
  const router = useRouter();

  // Load decks from localStorage (client-only)
  const [decks, setDecks] = useState<{ white: DeckConfig; black: DeckConfig } | null>(null);

  useEffect(() => {
    const all = loadDecks();
    const aid = loadActiveDeckId();
    const fallback = makeDefaultDeck("Default");

    // Use active deck for white; second deck (or same) for black
    const white = all.find(d => d.id === aid) ?? all[0] ?? fallback;
    const black  = all[1] ?? white; // TODO: separate deck select per player
    setDecks({ white, black });
  }, []);

  if (!decks) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#f5f0e8" }}>
        <span className="font-serif text-[#8b7d6b] animate-pulse">Loading…</span>
      </div>
    );
  }

  return <BattleView router={router} whiteDeck={decks.white} blackDeck={decks.black} />;
}

// ─── Battle View (separate so hooks run after decks load) ─────
function BattleView({
  router, whiteDeck, blackDeck,
}: { router: ReturnType<typeof useRouter>; whiteDeck: DeckConfig; blackDeck: DeckConfig }) {
  const {
    state, selectPiece, deselect, movePiece, attackPiece,
    selectedPiece, validMoveKeys, validAttackKeys,
  } = useGameState(whiteDeck, blackDeck);

  const { currentPlayer, turnNumber, phase, winner } = state;
  const cfg = PLAYER_CFG[currentPlayer];

  const handleTileClick = useCallback((row: number, col: number, piece: Piece | null) => {
    if (phase !== "battle") return;
    const coord = { row, col };
    const key = coordKey(coord);

    // Valid attack target
    if (piece && validAttackKeys.has(key) && piece.owner !== currentPlayer) {
      attackPiece(piece.id);
      return;
    }
    // Valid move
    if (validMoveKeys.has(key) && !piece) {
      movePiece(coord);
      return;
    }
    // Own piece → select / deselect
    if (piece && piece.owner === currentPlayer) {
      piece.id === state.selectedPieceId ? deselect() : selectPiece(piece.id);
      return;
    }
    deselect();
  }, [phase, currentPlayer, state.selectedPieceId, validMoveKeys, validAttackKeys,
      movePiece, attackPiece, selectPiece, deselect]);

  return (
    <div className="min-h-screen w-full flex flex-col" style={{ background: "radial-gradient(ellipse at top, #fff4c2 0%, #f5f0e8 45%, #ece4d3 100%)" }}>

      {/* Header */}
      <header className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-[#c9a84c30] shrink-0" style={{ background: "rgba(253,251,247,0.85)", backdropFilter: "blur(8px)" }}>
        <button onClick={() => router.push("/")} className="flex items-center gap-2 text-[#8b7d6b] hover:text-[#1e3a6e] transition-colors cursor-pointer">
          <ChevronLeft className="size-4" />
          <span className="text-xs uppercase tracking-widest font-medium">Exit</span>
        </button>

        {/* Turn indicator — centre */}
        <div className="flex flex-col items-center">
          {phase === "ended" && winner ? (
            <span className="font-serif font-bold text-sm uppercase tracking-widest" style={{ color: PLAYER_CFG[winner].color }}>
              {PLAYER_CFG[winner].label} Wins!
            </span>
          ) : (
            <>
              <span className="font-serif font-bold text-sm uppercase tracking-widest" style={{ color: cfg.color }}>
                {cfg.label}'s Turn
              </span>
              <span className="text-[9px] uppercase tracking-widest text-[#8b7d6b]">
                Turn {turnNumber} · {selectedPiece ? "piece selected" : "select a piece"}
              </span>
            </>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Crown className="size-4 text-[#b8860b]" />
          <span className="font-serif font-bold text-sm text-[#1e3a6e]">SoulChess</span>
        </div>
      </header>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden min-h-0">

        {/* Board */}
        <div className="flex-1 flex items-center justify-center p-3 sm:p-5 min-w-0">
          <div className="w-full max-w-xl lg:max-w-2xl">
            <Board state={state} onTileClick={handleTileClick} />
          </div>
        </div>

        {/* Right panel */}
        <aside className="hidden lg:flex flex-col gap-4 w-64 xl:w-72 shrink-0 p-4 border-l border-[#c9a84c30] overflow-y-auto" style={{ background: "rgba(253,251,247,0.7)" }}>

          {/* Turn colour bar */}
          <div
            className="rounded-lg px-3 py-2.5 border text-center"
            style={{ background: `${cfg.color}12`, borderColor: `${cfg.color}50` }}
          >
            <span className="font-serif font-bold text-sm uppercase tracking-widest" style={{ color: cfg.color }}>
              {phase === "ended" && winner ? `${PLAYER_CFG[winner].label} Wins!` : `${cfg.label}'s Turn`}
            </span>
            {phase === "battle" && (
              <p className="text-[9px] text-[#8b7d6b] mt-0.5 uppercase tracking-widest">
                Move OR Attack → auto switch
              </p>
            )}
          </div>

          {/* Selected piece */}
          {selectedPiece ? (
            <PieceInfoPanel piece={selectedPiece} onDeselect={deselect} />
          ) : (
            <div className="rounded-lg border border-dashed px-4 py-4 flex items-center justify-center" style={{ borderColor: "#c9a84c40" }}>
              <p className="text-xs text-[#8b7d6b] text-center italic font-serif">
                Select a piece to see its stats
              </p>
            </div>
          )}

          <Legend />

          {/* Go to deck builder */}
          <button
            onClick={() => router.push("/decks")}
            className="mt-auto flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-[#c9a84c40] text-xs text-[#8b7d6b] hover:text-[#1e3a6e] hover:border-[#c9a84c] transition-colors cursor-pointer"
          >
            Edit Decks
          </button>
        </aside>
      </div>

      {/* Mobile bottom bar */}
      <div className="lg:hidden border-t border-[#c9a84c30] px-4 py-3 flex items-center justify-between shrink-0" style={{ background: "rgba(253,251,247,0.95)" }}>
        <span className="text-xs text-[#8b7d6b] italic font-serif" style={{ color: cfg.color }}>
          {phase === "ended" && winner
            ? `${PLAYER_CFG[winner].label} wins!`
            : `${cfg.label}'s turn · ${selectedPiece ? selectedPiece.definitionId.replace(/_/g," ") : "tap a piece"}`
          }
        </span>
        <button onClick={() => router.push("/decks")} className="text-xs text-[#8b7d6b] border border-[#c9a84c40] px-3 py-1.5 rounded-lg hover:bg-[#c9a84c10] transition-colors cursor-pointer">
          Decks
        </button>
      </div>
    </div>
  );
}