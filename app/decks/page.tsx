// ============================================================
// SOULCHESS — /decks  Deck Builder (Refined v2)
// ============================================================
"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronLeft, Plus, Trash2, Edit2, Star, Play,
  X, Crown, Check, AlertCircle,
} from "lucide-react";
import type { DeckConfig, FormationSlot, PieceDefinition, Coord } from "../types/game";
import { getAllDefinitions, getPieceDefinitionById } from "../lib/pieceRegistry";
import {
  loadDecks, saveDecks, loadActiveDeckId, saveActiveDeckId,
  createNewDeck, upsertDeck, deleteDeck, makeDefaultDeck,
  isInDeployZone, WHITE_ZONE_MIN_ROW, MAX_PIECES,
  REQUIRED_PIECES, isDeckValid, getDeckErrors,
} from "../lib/deckStorage";
import { isInsideOctagon, coordKey, GRID_SIZE } from "../lib/boardUtils";

// ─── Keyframes ────────────────────────────────────────────────
const STYLES = `
  @keyframes slideDown  { from{opacity:0;transform:translateY(-12px)} to{opacity:1;transform:translateY(0)} }
  @keyframes slideUp    { from{opacity:0;transform:translateY(12px)}  to{opacity:1;transform:translateY(0)} }
  @keyframes slideRight { from{opacity:0;transform:translateX(-12px)} to{opacity:1;transform:translateX(0)} }
  @keyframes fadeIn     { from{opacity:0} to{opacity:1} }
  @keyframes cardIn     { from{opacity:0;transform:scale(0.96) translateY(6px)} to{opacity:1;transform:scale(1) translateY(0)} }
  @keyframes pulse      { 0%,100%{opacity:1} 50%{opacity:0.55} }
`;

// ─── Constants ────────────────────────────────────────────────
const FACTION_COLOR: Record<string, string> = {
  Arcane: "#c9a84c", Void: "#9b6de0", Iron: "#7a8fa0", Fire: "#e05c2a",
};
const FACTION_BG: Record<string, string> = {
  Arcane: "rgba(201,168,76,0.08)", Void: "rgba(155,109,224,0.08)",
  Iron: "rgba(122,143,160,0.08)", Fire: "rgba(224,92,42,0.08)",
};
const TIER_LABEL: Record<number, string> = { 1: "Common", 2: "Rare", 3: "Legendary" };
const TIER_COLOR: Record<number, string> = { 1: "#8b7d6b", 2: "#3b82f6", 3: "#b8860b" };

// ─── Ornate divider ───────────────────────────────────────────
function OrnDivider() {
  return (
    <div className="flex items-center gap-2 w-full" style={{ opacity: 0.4 }}>
      <div className="h-px flex-1" style={{ background: "linear-gradient(90deg,transparent,#c9a84c)" }} />
      <div style={{ width: 4, height: 4, transform: "rotate(45deg)", background: "#c9a84c" }} />
      <div className="h-px flex-1" style={{ background: "linear-gradient(90deg,#c9a84c,transparent)" }} />
    </div>
  );
}

// ─── Piece Card ───────────────────────────────────────────────
function PieceCard({
  def, selected, count, onClick,
}: {
  def: PieceDefinition; selected: boolean; count: number; onClick: () => void;
}) {
  const fc      = FACTION_COLOR[def.faction] ?? "#c9a84c";
  const rule    = REQUIRED_PIECES[def.typeId];
  const isMaxed = rule ? count >= rule.max : false;

  return (
    <button
      onClick={isMaxed ? undefined : onClick}
      className="relative flex items-center gap-2.5 w-full px-3 py-2.5 text-left transition-all"
      style={{
        background: isMaxed
          ? "rgba(74,222,128,0.06)"
          : selected
            ? `${fc}12`
            : "rgba(253,251,247,0.5)",
        border: `1px solid ${isMaxed ? "rgba(74,222,128,0.35)" : selected ? fc : "rgba(201,168,76,0.18)"}`,
        borderRadius: 10,
        boxShadow: selected && !isMaxed ? `0 0 0 2px ${fc}30` : "none",
        cursor: isMaxed ? "default" : "pointer",
        opacity: isMaxed ? 0.7 : 1,
        transform: selected && !isMaxed ? "scale(1.01)" : "scale(1)",
        transition: "all 0.15s ease",
      }}
    >
      {/* Symbol */}
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center text-base shrink-0"
        style={{ background: FACTION_BG[def.faction] ?? "rgba(201,168,76,0.08)", border: `1px solid ${fc}30` }}
      >
        {def.symbol}
      </div>

      {/* Info */}
      <div className="flex flex-col flex-1 min-w-0">
        <div className="flex items-center gap-1.5 justify-between">
          <span className="font-serif font-semibold text-xs text-[#1e3a6e] truncate">{def.name}</span>
          <div className="flex items-center gap-1 shrink-0">
            {rule && (
              <span
                className="text-[7px] px-1 py-0.5 rounded font-bold uppercase tracking-wider"
                style={{
                  background: isMaxed ? "rgba(74,222,128,0.18)" : "rgba(248,113,113,0.12)",
                  color: isMaxed ? "#4ade80" : "#f87171",
                }}
              >
                {isMaxed ? "✓" : "Req"}
              </span>
            )}
            <span
              className="text-[7px] px-1 py-0.5 rounded uppercase tracking-wider font-medium"
              style={{ background: `${TIER_COLOR[def.tier]}18`, color: TIER_COLOR[def.tier] }}
            >
              T{def.tier}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-[8px] uppercase tracking-wider" style={{ color: "#8b7d6b" }}>
            {def.faction}
          </span>
          {count > 0 && (
            <span
              className="ml-auto text-[8px] font-bold px-1.5 py-0.5 rounded-full"
              style={{ background: `${fc}20`, color: fc }}
            >
              ×{count}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

// ─── Board Preview ────────────────────────────────────────────
function BoardPreview({
  slots, selectedDef, onTileClick,
}: {
  slots: FormationSlot[];
  selectedDef: PieceDefinition | null;
  onTileClick: (coord: Coord) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [cellSize, setCellSize] = useState(28);

  useEffect(() => {
    const update = () => {
      if (containerRef.current)
        setCellSize(Math.floor(containerRef.current.offsetWidth / GRID_SIZE));
    };
    update();
    const ro = new ResizeObserver(update);
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  const slotMap = new Map(
    slots
      .filter(s => s.coord != null && typeof s.coord.row === "number")
      .map(s => [coordKey(s.coord), s.definitionId])
  );

  return (
    <div
      ref={containerRef}
      className="relative w-full overflow-hidden"
      style={{
        aspectRatio: "1/1",
        background: "linear-gradient(135deg,#e4dcce 0%,#c3b9a5 100%)",
        border: "2px solid rgba(44,44,44,0.8)",
        borderRadius: 10,
        boxShadow: "0 8px 32px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.12)",
      }}
    >
      <div
        className="absolute inset-0 grid"
        style={{
          gridTemplateColumns: `repeat(${GRID_SIZE},1fr)`,
          gridTemplateRows: `repeat(${GRID_SIZE},1fr)`,
        }}
      >
        {Array.from({ length: GRID_SIZE * GRID_SIZE }, (_, i) => {
          const row = Math.floor(i / GRID_SIZE);
          const col = i % GRID_SIZE;

          if (!isInsideOctagon(row, col)) {
            return <div key={i} style={{ background: "transparent" }} />;
          }

          const coord: Coord  = { row, col };
          const key            = coordKey(coord);
          const inZone         = isInDeployZone(coord);
          const defId          = slotMap.get(key);
          const def            = defId ? getPieceDefinitionById(defId) : null;
          const fc             = def ? (FACTION_COLOR[def.faction] ?? "#c9a84c") : null;
          const isLight        = (row + col) % 2 === 0;
          const baseBg         = isLight ? "#f8f4ec" : "#2c2c2c";

          return (
            <div
              key={i}
              className="relative w-full h-full flex items-center justify-center transition-all duration-100"
              style={{
                background: baseBg,
                cursor: inZone ? "pointer" : "default",
              }}
              onClick={() => inZone && onTileClick(coord)}
            >
              {/* Zone tint */}
              {inZone && (
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background: def
                      ? `${fc}22`
                      : selectedDef
                        ? "rgba(201,168,76,0.1)"
                        : "rgba(74,222,128,0.07)",
                  }}
                />
              )}

              {/* Hover ring (empty zone + piece selected) */}
              {inZone && !def && selectedDef && (
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{ boxShadow: "inset 0 0 0 1px rgba(201,168,76,0.4)" }}
                />
              )}

              {/* Placed piece */}
              {def && (
                <div
                  className="relative flex items-center justify-center rounded-full z-10"
                  style={{
                    width:    Math.max(12, cellSize * 0.72),
                    height:   Math.max(12, cellSize * 0.72),
                    fontSize: Math.max(7, cellSize * 0.42),
                    background: "linear-gradient(135deg,#fdfbf7 0%,#e8e0d0 100%)",
                    border: `1.5px solid ${fc}`,
                    boxShadow: `0 0 0 1px ${fc}50`,
                  }}
                >
                  <span style={{ lineHeight: 1, display: "block", marginTop: 1 }}>{def.symbol}</span>
                  {/* Remove btn */}
                  <button
                    onClick={e => { e.stopPropagation(); onTileClick(coord); }}
                    className="absolute -top-1 -right-1 rounded-full flex items-center justify-center z-20"
                    style={{
                      width:    Math.max(10, cellSize * 0.3),
                      height:   Math.max(10, cellSize * 0.3),
                      background: "#f87171",
                      border: "1px solid white",
                      opacity: 0,
                      transition: "opacity 0.15s",
                    }}
                    onMouseEnter={e => (e.currentTarget.style.opacity = "1")}
                    onMouseLeave={e => (e.currentTarget.style.opacity = "0")}
                  >
                    <X style={{ width: "55%", height: "55%", color: "white" }} />
                  </button>
                </div>
              )}

              {/* Empty zone dot */}
              {inZone && !def && (
                <div
                  className="absolute rounded-full pointer-events-none"
                  style={{
                    width:  Math.max(3, cellSize * 0.14),
                    height: Math.max(3, cellSize * 0.14),
                    background: "rgba(201,168,76,0.45)",
                  }}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Zone label */}
      <div
        className="absolute pointer-events-none flex items-center justify-center"
        style={{
          right: 4,
          top: `${(WHITE_ZONE_MIN_ROW / GRID_SIZE) * 100}%`,
          fontSize: Math.max(7, cellSize * 0.32),
          color: "#c9a84c",
          opacity: 0.55,
          fontWeight: 700,
        }}
      >
        ▶
      </div>

      {/* Board corners */}
      {(["top-1 left-1 border-t-2 border-l-2", "top-1 right-1 border-t-2 border-r-2",
         "bottom-1 left-1 border-b-2 border-l-2", "bottom-1 right-1 border-b-2 border-r-2"] as const)
        .map((cls, i) => (
          <div key={i} className={`absolute w-4 h-4 pointer-events-none rounded-sm ${cls}`}
            style={{ borderColor: "#c9a84c" }} />
        ))}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────
export default function DecksPage() {
  const router  = useRouter();
  const allDefs = getAllDefinitions();
  const [mounted, setMounted] = useState(false);

  const [decks, setDecks]             = useState<DeckConfig[]>([]);
  const [editingDeck, setEditingDeck] = useState<DeckConfig | null>(null);
  const [selectedDef, setSelectedDef] = useState<PieceDefinition | null>(null);
  const [renamingId, setRenamingId]   = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");

  useEffect(() => { setTimeout(() => setMounted(true), 30); }, []);

  // ── Load ─────────────────────────────────────────────────
  useEffect(() => {
    let loaded = loadDecks();
    if (loaded.length === 0) {
      const d = makeDefaultDeck("Arcane Army");
      loaded = [d];
      saveDecks(loaded);
    }
    setDecks(loaded);
    const aid = loadActiveDeckId() ?? loaded[0]?.id ?? null;
    setEditingDeck(loaded.find(d => d.id === aid) ?? loaded[0] ?? null);
  }, []);

  const persist = useCallback((next: DeckConfig[]) => {
    setDecks(next); saveDecks(next);
  }, []);

  // ── Tile click ────────────────────────────────────────────
  const handleTileClick = useCallback((coord: Coord) => {
    if (!editingDeck) return;
    const existing = editingDeck.slots.find(
      s => s.coord.row === coord.row && s.coord.col === coord.col
    );
    let updated: DeckConfig;
    if (existing) {
      updated = { ...editingDeck, slots: editingDeck.slots.filter(s => s !== existing) };
    } else {
      if (!selectedDef) return;
      if (editingDeck.slots.length >= MAX_PIECES) return;
      const rule = REQUIRED_PIECES[selectedDef.typeId];
      if (rule) {
        const already = editingDeck.slots.filter(s => s.definitionId === selectedDef.typeId).length;
        if (already >= rule.max) return;
      }
      const newSlot: FormationSlot = { coord, definitionId: selectedDef.typeId };
      updated = { ...editingDeck, slots: [...editingDeck.slots, newSlot] };
    }
    setEditingDeck(updated);
    persist(upsertDeck(decks, updated));
  }, [editingDeck, selectedDef, decks, persist]);

  // ── Deck CRUD ─────────────────────────────────────────────
  const handleNewDeck = useCallback(() => {
    const d = createNewDeck(`Deck ${decks.length + 1}`);
    const next = [...decks, d];
    persist(next);
    setEditingDeck(d);
    saveActiveDeckId(d.id);
  }, [decks, persist]);

  const handleDeleteDeck = useCallback((id: string) => {
    const next = deleteDeck(decks, id);
    persist(next);
    if (editingDeck?.id === id) setEditingDeck(next[0] ?? null);
  }, [decks, editingDeck, persist]);

  const handleSelectDeck = useCallback((deck: DeckConfig) => {
    setEditingDeck(deck);
    saveActiveDeckId(deck.id);
  }, []);

  const handleClearDeck = useCallback(() => {
    if (!editingDeck) return;
    const updated = { ...editingDeck, slots: [] };
    setEditingDeck(updated);
    persist(upsertDeck(decks, updated));
  }, [editingDeck, decks, persist]);

  const commitRename = useCallback(() => {
    if (!renamingId || !renameValue.trim()) { setRenamingId(null); return; }
    const next = decks.map(d => d.id === renamingId ? { ...d, name: renameValue.trim() } : d);
    persist(next);
    if (editingDeck?.id === renamingId)
      setEditingDeck(prev => prev ? { ...prev, name: renameValue.trim() } : prev);
    setRenamingId(null);
  }, [renamingId, renameValue, decks, editingDeck, persist]);

  // ── Derived ───────────────────────────────────────────────
  const slots      = editingDeck?.slots ?? [];
  const count      = slots.length;
  const canPlay    = editingDeck ? isDeckValid(slots) : false;
  const deckErrors = editingDeck ? getDeckErrors(slots) : [];

  const defCountMap = new Map<string, number>();
  for (const s of slots) {
    defCountMap.set(s.definitionId, (defCountMap.get(s.definitionId) ?? 0) + 1);
  }

  // ── Render ────────────────────────────────────────────────
  return (
    <>
      <style>{STYLES}</style>
      <div
        className="h-screen w-full flex flex-col overflow-hidden"
        style={{ background: "radial-gradient(ellipse at top,#fff4c2 0%,#f5f0e8 45%,#ece4d3 100%)" }}
      >
        {/* Subtle chess pattern */}
        <div
          className="pointer-events-none fixed inset-0 opacity-[0.035]"
          style={{
            backgroundImage: "repeating-conic-gradient(#2c2c2c 0deg 90deg,transparent 90deg 180deg)",
            backgroundSize: "48px 48px",
          }}
        />

        {/* ── Header ──────────────────────────────────── */}
        <header
          className="flex items-center justify-between px-5 py-3 shrink-0 relative z-10"
          style={{
            background: "rgba(253,251,247,0.88)",
            borderBottom: "1px solid rgba(201,168,76,0.22)",
            backdropFilter: "blur(10px)",
            animation: mounted ? "slideDown 0.35s ease both" : "none",
          }}
        >
          <button
            onClick={() => router.push("/")}
            className="flex items-center gap-1.5 cursor-pointer transition-colors"
            style={{ color: "#8b7d6b" }}
          >
            <ChevronLeft className="size-4" />
            <span className="text-[10px] uppercase tracking-[0.3em] font-medium hidden sm:block">Back</span>
          </button>

          <div className="flex items-center gap-2.5">
            <Crown className="size-4 text-[#b8860b]" />
            <span className="font-serif font-bold text-base text-[#1e3a6e] tracking-wider">
              Deck Builder
            </span>
          </div>

          <button
            onClick={() => {
              if (editingDeck) saveActiveDeckId(editingDeck.id);
              router.push("/play/local");
            }}
            disabled={!canPlay}
            className="flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider text-[#fdfbf7] transition-all disabled:opacity-35 disabled:cursor-not-allowed cursor-pointer hover:opacity-90 hover:scale-[1.02]"
            style={{
              background: canPlay
                ? "linear-gradient(135deg,#c9a84c 0%,#b8860b 100%)"
                : "rgba(180,170,150,0.4)",
              boxShadow: canPlay ? "0 4px 14px rgba(184,134,11,0.3)" : "none",
            }}
          >
            <Play className="size-3 fill-current" />
            {canPlay ? "Play" : `${count}/${MAX_PIECES}`}
          </button>
        </header>

        {/* ── Body ─────────────────────────────────────── */}
        <div className="flex flex-1 overflow-hidden min-h-0 relative z-10">

          {/* ── Left: Deck List ──────────────────────── */}
          <aside
            className="flex flex-col w-44 sm:w-52 shrink-0 border-r overflow-hidden"
            style={{
              background: "rgba(253,251,247,0.6)",
              borderColor: "rgba(201,168,76,0.2)",
              animation: mounted ? "slideRight 0.4s ease both 0.05s" : "none",
            }}
          >
            {/* Aside header */}
            <div
              className="flex items-center justify-between px-3 py-3 shrink-0"
              style={{ borderBottom: "1px solid rgba(201,168,76,0.15)" }}
            >
              <span
                className="font-serif text-[10px] font-semibold uppercase tracking-wider"
                style={{ color: "#8b7d6b" }}
              >
                My Decks
              </span>
              <button
                onClick={handleNewDeck}
                className="w-6 h-6 rounded-full flex items-center justify-center cursor-pointer transition-all hover:scale-110"
                style={{ background: "rgba(201,168,76,0.15)", border: "1px solid rgba(201,168,76,0.35)", color: "#b8860b" }}
              >
                <Plus className="size-3.5" />
              </button>
            </div>

            {/* Deck list */}
            <div className="flex flex-col gap-1.5 p-2 overflow-y-auto flex-1">
              {decks.map((deck, i) => {
                const isActive  = deck.id === editingDeck?.id;
                const isValid   = isDeckValid(deck.slots);
                return (
                  <div
                    key={deck.id}
                    className="group flex items-center gap-2 px-3 py-2.5 cursor-pointer transition-all"
                    style={{
                      background: isActive ? "rgba(201,168,76,0.12)" : "rgba(253,251,247,0.5)",
                      border: `1px solid ${isActive ? "#c9a84c" : "rgba(201,168,76,0.18)"}`,
                      borderRadius: 10,
                      boxShadow: isActive ? "0 0 0 1px rgba(201,168,76,0.4)" : "none",
                      animation: mounted ? `cardIn 0.35s ease both ${0.1 + i * 0.05}s` : "none",
                    }}
                    onClick={() => handleSelectDeck(deck)}
                  >
                    {renamingId === deck.id ? (
                      <input
                        autoFocus
                        value={renameValue}
                        onChange={e => setRenameValue(e.target.value)}
                        onBlur={commitRename}
                        onKeyDown={e => { if (e.key === "Enter") commitRename(); if (e.key === "Escape") setRenamingId(null); }}
                        className="flex-1 bg-transparent text-xs text-[#1e3a6e] font-serif outline-none min-w-0"
                        style={{ borderBottom: "1px solid #c9a84c" }}
                        onClick={e => e.stopPropagation()}
                      />
                    ) : (
                      <span className="flex-1 font-serif text-xs text-[#1e3a6e] truncate">{deck.name}</span>
                    )}

                    {/* Valid check */}
                    {isValid && (
                      <Check className="size-3 shrink-0 text-[#4ade80]" />
                    )}

                    {/* Actions (hover) */}
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                      <button
                        onClick={e => { e.stopPropagation(); setRenamingId(deck.id); setRenameValue(deck.name); }}
                        className="cursor-pointer transition-colors hover:text-[#1e3a6e]"
                        style={{ color: "#8b7d6b" }}
                      >
                        <Edit2 className="size-3" />
                      </button>
                      {decks.length > 1 && (
                        <button
                          onClick={e => { e.stopPropagation(); handleDeleteDeck(deck.id); }}
                          className="cursor-pointer transition-colors hover:text-red-500"
                          style={{ color: "#f87171" }}
                        >
                          <Trash2 className="size-3" />
                        </button>
                      )}
                    </div>

                    {isActive && !renamingId && (
                      <Star className="size-3 text-[#b8860b] shrink-0 fill-current opacity-0 group-hover:opacity-0" style={{ opacity: 1 }} />
                    )}
                  </div>
                );
              })}
            </div>
          </aside>

          {/* ── Centre: Board ────────────────────────── */}
          <main
            className="flex-1 flex flex-col gap-2 p-3 sm:p-4 overflow-y-auto min-w-0"
            style={{ animation: mounted ? "fadeIn 0.4s ease both 0.1s" : "none" }}
          >
            {/* Deck name + actions */}
            <div className="flex items-center justify-between shrink-0 gap-3">
              <div className="flex flex-col min-w-0">
                <h2 className="font-serif font-bold text-base text-[#1e3a6e] truncate">
                  {editingDeck?.name ?? "—"}
                </h2>
                <p className="text-[10px] text-[#8b7d6b] mt-0.5">
                  {selectedDef
                    ? `Placing ${selectedDef.name} → click zone`
                    : "Select a piece → click your zone (bottom rows)"}
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {/* Count pill */}
                <div
                  className="flex items-center gap-1.5 px-3 py-1 rounded-full"
                  style={{
                    background: canPlay ? "rgba(74,222,128,0.12)" : "rgba(201,168,76,0.1)",
                    border: `1px solid ${canPlay ? "rgba(74,222,128,0.4)" : "rgba(201,168,76,0.3)"}`,
                  }}
                >
                  {canPlay
                    ? <Check className="size-3 text-[#4ade80]" />
                    : <span className="text-[9px] font-bold" style={{ color: "#b8860b" }}>{count}/{MAX_PIECES}</span>
                  }
                  {canPlay && (
                    <span className="text-[9px] font-semibold text-[#4ade80]">Ready</span>
                  )}
                </div>

                <button
                  onClick={handleClearDeck}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs cursor-pointer transition-all hover:scale-[1.02]"
                  style={{
                    border: "1px solid rgba(248,113,113,0.3)",
                    color: "#f87171",
                    background: "rgba(248,113,113,0.05)",
                  }}
                >
                  <Trash2 className="size-3" />
                  <span className="hidden sm:block">Clear</span>
                </button>
              </div>
            </div>

            {/* Validation errors */}
            {deckErrors.length > 0 && (
              <div className="flex flex-col gap-1 shrink-0">
                {deckErrors.map(err => (
                  <div
                    key={err}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px]"
                    style={{
                      background: "rgba(248,113,113,0.08)",
                      border: "1px solid rgba(248,113,113,0.22)",
                      color: "#f87171",
                    }}
                  >
                    <AlertCircle className="size-3 shrink-0" />
                    {err}
                  </div>
                ))}
              </div>
            )}

            {/* Board */}
            <div className="flex-1 flex items-center justify-center min-h-0">
              <div className="w-full max-w-[min(100%,calc(100vh-200px))]">
                {editingDeck ? (
                  <BoardPreview
                    slots={editingDeck.slots}
                    selectedDef={selectedDef}
                    onTileClick={handleTileClick}
                  />
                ) : (
                  <div
                    className="aspect-square flex items-center justify-center rounded-xl border border-dashed"
                    style={{ borderColor: "rgba(201,168,76,0.3)" }}
                  >
                    <p className="text-sm text-[#8b7d6b] italic font-serif">Select or create a deck</p>
                  </div>
                )}
              </div>
            </div>

            {/* Legend */}
            <div className="flex items-center gap-4 shrink-0 flex-wrap">
              {[
                { color: "rgba(74,222,128,0.18)",  border: "rgba(74,222,128,0.4)", label: "Deploy zone" },
                { color: "rgba(201,168,76,0.22)",  border: "#c9a84c55",            label: "Piece placed" },
              ].map(({ color, border, label }) => (
                <div key={label} className="flex items-center gap-1.5">
                  <div className="w-3.5 h-3.5 rounded-sm border" style={{ background: color, borderColor: border }} />
                  <span className="text-[9px] uppercase tracking-wider text-[#8b7d6b]">{label}</span>
                </div>
              ))}
            </div>

            {/* Mobile piece picker */}
            <div className="lg:hidden flex flex-col gap-2 mt-1">
              <OrnDivider />
              <div className="grid grid-cols-2 gap-1.5">
                {allDefs.map(def => (
                  <PieceCard
                    key={def.typeId}
                    def={def}
                    selected={selectedDef?.typeId === def.typeId}
                    count={defCountMap.get(def.typeId) ?? 0}
                    onClick={() => setSelectedDef(p => p?.typeId === def.typeId ? null : def)}
                  />
                ))}
              </div>
            </div>
          </main>

          {/* ── Right: Piece Roster ──────────────────── */}
          <aside
            className="hidden lg:flex flex-col w-60 xl:w-64 shrink-0 border-l overflow-hidden"
            style={{
              background: "rgba(253,251,247,0.6)",
              borderColor: "rgba(201,168,76,0.2)",
              animation: mounted ? "slideDown 0.4s ease both 0.1s" : "none",
            }}
          >
            {/* Roster header */}
            <div
              className="px-3 py-3 shrink-0"
              style={{ borderBottom: "1px solid rgba(201,168,76,0.15)" }}
            >
              <span className="font-serif text-[10px] font-semibold uppercase tracking-wider text-[#8b7d6b]">
                Piece Roster
              </span>
            </div>

            {/* Piece list */}
            <div className="flex flex-col gap-1.5 p-2 overflow-y-auto flex-1">
              {allDefs.map((def, i) => (
                <div
                  key={def.typeId}
                  style={{ animation: mounted ? `cardIn 0.3s ease both ${0.15 + i * 0.025}s` : "none" }}
                >
                  <PieceCard
                    def={def}
                    selected={selectedDef?.typeId === def.typeId}
                    count={defCountMap.get(def.typeId) ?? 0}
                    onClick={() => setSelectedDef(p => p?.typeId === def.typeId ? null : def)}
                  />
                </div>
              ))}
            </div>

            {/* Selected piece detail */}
            {selectedDef != null && (
              <div
                className="shrink-0 p-3 flex flex-col gap-2"
                style={{
                  borderTop: "1px solid rgba(201,168,76,0.2)",
                  background: "rgba(201,168,76,0.04)",
                  animation: "slideUp 0.22s ease both",
                }}
              >
                <OrnDivider />
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0"
                    style={{
                      background: FACTION_BG[selectedDef.faction] ?? "rgba(201,168,76,0.08)",
                      border: `1.5px solid ${FACTION_COLOR[selectedDef.faction] ?? "#c9a84c"}40`,
                    }}
                  >
                    {selectedDef.symbol}
                  </div>
                  <div>
                    <p className="font-serif font-bold text-sm text-[#1e3a6e]">{selectedDef.name}</p>
                    <p
                      className="text-[9px] uppercase tracking-wider"
                      style={{ color: FACTION_COLOR[selectedDef.faction] }}
                    >
                      {selectedDef.faction} · {TIER_LABEL[selectedDef.tier]}
                    </p>
                  </div>
                </div>
                <p className="text-[10px] text-[#8b7d6b] leading-relaxed">{selectedDef.description}</p>

                {selectedDef.abilities.map(ab => (
                  <div
                    key={ab.id}
                    className="px-2.5 py-2 rounded-lg"
                    style={{ background: "rgba(155,109,224,0.07)", border: "1px solid rgba(155,109,224,0.22)" }}
                  >
                    <p className="text-[10px] font-semibold text-[#1e3a6e]">{ab.name}</p>
                    <p className="text-[9px] text-[#8b7d6b] mt-0.5">{ab.description}</p>
                  </div>
                ))}
                {REQUIRED_PIECES[selectedDef.typeId] && (
                  <p className="text-[9px] italic" style={{ color: "#f87171" }}>
                    Required — exactly 1 per deck
                  </p>
                )}
              </div>
            )}
          </aside>
        </div>
      </div>
    </>
  );
}