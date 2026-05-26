// ============================================================
// SOULCHESS — /decks  Deck Builder
// ============================================================
"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronLeft, Plus, Trash2, Edit2, Star, Play,
  Heart, Swords, Shield, X, Crown,
} from "lucide-react";
import type { DeckConfig, FormationSlot, PieceDefinition, Coord } from "../types/game";
import { getAllDefinitions, getPieceDefinitionById } from "../lib/pieceRegistry";
import {
  loadDecks, saveDecks, loadActiveDeckId, saveActiveDeckId,
  createNewDeck, upsertDeck, deleteDeck, makeDefaultDeck,
  isInDeployZone, WHITE_ZONE_MIN_ROW, WHITE_ZONE_MAX_ROW, MAX_PIECES,
  REQUIRED_PIECES, isDeckValid, getDeckErrors,
} from "../lib/deckStorage";
import { isInsideOctagon, coordKey, GRID_SIZE } from "../lib/boardUtils";

// ─── Visual constants ─────────────────────────────────────────
const FACTION_COLOR: Record<string, string> = {
  Arcane: "#c9a84c", Void: "#9b6de0", Iron: "#7a8fa0", Fire: "#e05c2a",
};
const TIER_COLOR: Record<number, string> = {
  1: "#8b7d6b", 2: "#3b82f6", 3: "#b8860b",
};

// ─── Piece Card ───────────────────────────────────────────────
function PieceCard({
  def, selected, count, onClick,
}: {
  def: PieceDefinition;
  selected: boolean;
  count: number;
  onClick: () => void;
}) {
  const fc      = FACTION_COLOR[def.faction] ?? "#c9a84c";
  const rule    = REQUIRED_PIECES[def.typeId];
  const isMaxed = rule ? count >= rule.max : false;

  return (
    <button
      onClick={isMaxed ? undefined : onClick}
      className="flex items-center gap-2 w-full px-2.5 py-2 rounded-lg border text-left transition-all hover:scale-[1.01]"
      style={{
        background: isMaxed
          ? "rgba(74,222,128,0.07)"
          : selected
            ? `${fc}18`
            : "rgba(253,251,247,0.6)",
        borderColor: isMaxed
          ? "rgba(74,222,128,0.4)"
          : selected
            ? fc
            : "#c9a84c25",
        boxShadow: selected && !isMaxed ? `0 0 0 1.5px ${fc}` : "none",
        cursor: isMaxed ? "default" : "pointer",
        opacity: isMaxed ? 0.75 : 1,
      }}
    >
      <span className="text-lg leading-none shrink-0">{def.symbol}</span>
      <div className="flex flex-col flex-1 min-w-0">
        <div className="flex items-center justify-between gap-1">
          <span className="font-serif font-semibold text-xs text-[#1e3a6e] truncate">
            {def.name}
          </span>
          <div className="flex items-center gap-1 shrink-0">
            {rule && (
              <span
                className="text-[7px] uppercase tracking-wider px-1 py-0.5 rounded font-bold"
                style={{
                  background: isMaxed ? "rgba(74,222,128,0.2)" : "rgba(248,113,113,0.15)",
                  color: isMaxed ? "#4ade80" : "#f87171",
                }}
              >
                {isMaxed ? "✓ Set" : "Required"}
              </span>
            )}
            <span
              className="text-[8px] uppercase tracking-wider"
              style={{ color: TIER_COLOR[def.tier] }}
            >
              T{def.tier}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-[9px] text-[#8b7d6b] flex items-center gap-0.5">
            <Heart className="size-2.5" />{def.maxHp > 0 ? def.maxHp : "∞"}
          </span>
          <span className="text-[9px] text-[#8b7d6b] flex items-center gap-0.5">
            <Swords className="size-2.5" />{def.attack}
          </span>
          <span className="text-[9px] text-[#8b7d6b] flex items-center gap-0.5">
            <Shield className="size-2.5" />{def.defense}
          </span>
          {count > 0 && (
            <span
              className="ml-auto text-[8px] font-bold px-1.5 py-0.5 rounded-full"
              style={{ background: `${fc}25`, color: fc }}
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
        border: "2px solid #2c2c2c",
        borderRadius: 8,
        boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
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

          const coord: Coord = { row, col };
          const key     = coordKey(coord);
          const inZone  = isInDeployZone(coord);
          const defId   = slotMap.get(key);
          const def     = defId ? getPieceDefinitionById(defId) : null;
          const fc      = def ? (FACTION_COLOR[def.faction] ?? "#c9a84c") : null;
          const isLight = (row + col) % 2 === 0;
          const baseBg  = isLight ? "#f8f4ec" : "#2c2c2c";

          return (
            <div
              key={i}
              className="relative w-full h-full flex items-center justify-center transition-all duration-100"
              style={{
                background: baseBg,
                cursor: inZone ? "pointer" : "default",
                boxShadow:
                  inZone && selectedDef && !def
                    ? "inset 0 0 0 1px rgba(201,168,76,0.35)"
                    : "none",
              }}
              onClick={() => inZone && onTileClick(coord)}
            >
              {/* Zone tint */}
              {inZone && (
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background: def
                      ? `${fc}20`
                      : selectedDef
                        ? "rgba(201,168,76,0.08)"
                        : "rgba(74,222,128,0.06)",
                  }}
                />
              )}

              {/* Placed piece token */}
              {def && (
                <div
                  className="relative flex items-center justify-center rounded-full z-10"
                  style={{
                    width:  Math.max(12, cellSize * 0.7),
                    height: Math.max(12, cellSize * 0.7),
                    fontSize: Math.max(7, cellSize * 0.42),
                    background: "linear-gradient(135deg,#fdfbf7 0%,#e8e0d0 100%)",
                    border: `1.5px solid ${fc}`,
                    boxShadow: `0 0 0 1px ${fc}60`,
                  }}
                >
                  <span style={{ lineHeight: 1, display: "block", marginTop: 1 }}>
                    {def.symbol}
                  </span>
                  {/* Remove button */}
                  <button
                    onClick={e => { e.stopPropagation(); onTileClick(coord); }}
                    className="absolute -top-1 -right-1 rounded-full flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity cursor-pointer z-20"
                    style={{
                      width:  Math.max(10, cellSize * 0.32),
                      height: Math.max(10, cellSize * 0.32),
                      background: "#f87171",
                      border: "1px solid white",
                    }}
                  >
                    <X style={{ width: "60%", height: "60%", color: "white" }} />
                  </button>
                </div>
              )}

              {/* Empty zone dot */}
              {inZone && !def && (
                <div
                  className="absolute rounded-full pointer-events-none"
                  style={{
                    width:  Math.max(3, cellSize * 0.15),
                    height: Math.max(3, cellSize * 0.15),
                    background: "rgba(201,168,76,0.4)",
                  }}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Zone label */}
      <div
        className="absolute right-1 pointer-events-none flex items-center"
        style={{ top: `${(WHITE_ZONE_MIN_ROW / GRID_SIZE) * 100}%`, fontSize: Math.max(7, cellSize * 0.35) }}
      >
        <span className="text-[#c9a84c] font-bold opacity-60">▶</span>
      </div>

      {/* Corner decorations */}
      {(["top-1 left-1 border-t-2 border-l-2", "top-1 right-1 border-t-2 border-r-2",
         "bottom-1 left-1 border-b-2 border-l-2", "bottom-1 right-1 border-b-2 border-r-2"] as const)
        .map((cls, i) => (
          <div key={i} className={`absolute w-4 h-4 border-[#c9a84c] pointer-events-none rounded-sm ${cls}`} />
        ))}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────
export default function DecksPage() {
  const router  = useRouter();
  const allDefs = getAllDefinitions();

  const [decks, setDecks]               = useState<DeckConfig[]>([]);
  const [editingDeck, setEditingDeck]   = useState<DeckConfig | null>(null);
  const [selectedDef, setSelectedDef]   = useState<PieceDefinition | null>(null);
  const [renamingId, setRenamingId]     = useState<string | null>(null);
  const [renameValue, setRenameValue]   = useState("");

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

  // ── Persist ───────────────────────────────────────────────
  const persist = useCallback((next: DeckConfig[]) => {
    setDecks(next);
    saveDecks(next);
  }, []);

  // ── Tile click: place or remove ───────────────────────────
  const handleTileClick = useCallback((coord: Coord) => {
    if (!editingDeck) return;

    const existing = editingDeck.slots.find(
      s => s.coord.row === coord.row && s.coord.col === coord.col
    );

    let updated: DeckConfig;

    if (existing) {
      // Remove
      updated = { ...editingDeck, slots: editingDeck.slots.filter(s => s !== existing) };
    } else {
      // Place
      if (!selectedDef) return;
      if (editingDeck.slots.length >= MAX_PIECES) return;
      // Enforce max-1 for required pieces
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
    if (editingDeck?.id === id) {
      setEditingDeck(next[0] ?? null);
    }
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

  // ── Rename ────────────────────────────────────────────────
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

  // Count per definition in current deck
  const defCountMap = new Map<string, number>();
  for (const s of slots) {
    defCountMap.set(s.definitionId, (defCountMap.get(s.definitionId) ?? 0) + 1);
  }

  const handlePlay = () => {
    if (editingDeck) saveActiveDeckId(editingDeck.id);
    router.push("/play/local");
  };

  // ── Render ────────────────────────────────────────────────
  return (
    <div
      className="min-h-screen w-full flex flex-col"
      style={{ background: "radial-gradient(ellipse at top,#fff4c2 0%,#f5f0e8 45%,#ece4d3 100%)" }}
    >
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
          <span className="text-xs uppercase tracking-widest font-medium">Back</span>
        </button>

        <div className="flex items-center gap-2">
          <Crown className="size-4 text-[#b8860b]" />
          <span className="font-serif font-bold text-base text-[#1e3a6e] tracking-wider">
            Deck Builder
          </span>
        </div>

        <button
          onClick={handlePlay}
          disabled={!canPlay}
          className="flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider text-[#fdfbf7] transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer hover:opacity-90"
          style={{
            background: "linear-gradient(135deg,#c9a84c 0%,#b8860b 100%)",
            boxShadow: canPlay ? "0 4px 12px rgba(184,134,11,0.3)" : "none",
          }}
        >
          <Play className="size-3 fill-current" />
          Play
        </button>
      </header>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden min-h-0">

        {/* ── Left: Deck List ─────────────────────────────── */}
        <aside
          className="flex flex-col gap-3 w-40 sm:w-48 shrink-0 p-3 border-r border-[#c9a84c30] overflow-y-auto"
          style={{ background: "rgba(253,251,247,0.7)" }}
        >
          <div className="flex items-center justify-between">
            <span className="text-[9px] uppercase tracking-widest text-[#8b7d6b]">My Decks</span>
            <button
              onClick={handleNewDeck}
              className="text-[#b8860b] hover:text-[#1e3a6e] transition-colors cursor-pointer"
            >
              <Plus className="size-4" />
            </button>
          </div>

          <div className="flex flex-col gap-1.5">
            {decks.map(deck => {
              const isActive = deck.id === editingDeck?.id;
              return (
                <div
                  key={deck.id}
                  className="group flex items-center gap-1.5 rounded-lg px-2.5 py-2 border cursor-pointer transition-all"
                  style={{
                    background: isActive ? "rgba(201,168,76,0.12)" : "rgba(253,251,247,0.5)",
                    borderColor: isActive ? "#c9a84c" : "#c9a84c25",
                    boxShadow: isActive ? "0 0 0 1px #c9a84c60" : "none",
                  }}
                  onClick={() => handleSelectDeck(deck)}
                >
                  {renamingId === deck.id ? (
                    <input
                      autoFocus
                      value={renameValue}
                      onChange={e => setRenameValue(e.target.value)}
                      onBlur={commitRename}
                      onKeyDown={e => {
                        if (e.key === "Enter") commitRename();
                        if (e.key === "Escape") setRenamingId(null);
                      }}
                      className="flex-1 bg-transparent text-xs text-[#1e3a6e] font-serif outline-none border-b border-[#c9a84c] min-w-0"
                      onClick={e => e.stopPropagation()}
                    />
                  ) : (
                    <span className="flex-1 font-serif text-xs text-[#1e3a6e] truncate">
                      {deck.name}
                    </span>
                  )}

                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        setRenamingId(deck.id);
                        setRenameValue(deck.name);
                      }}
                      className="text-[#8b7d6b] hover:text-[#1e3a6e] cursor-pointer"
                    >
                      <Edit2 className="size-3" />
                    </button>
                    {decks.length > 1 && (
                      <button
                        onClick={e => { e.stopPropagation(); handleDeleteDeck(deck.id); }}
                        className="text-[#f87171] hover:text-red-600 cursor-pointer"
                      >
                        <Trash2 className="size-3" />
                      </button>
                    )}
                  </div>

                  {isActive && <Star className="size-3 text-[#b8860b] shrink-0 fill-current" />}
                </div>
              );
            })}
          </div>
        </aside>

        {/* ── Centre: Board Preview ────────────────────────── */}
        <main className="flex-1 flex flex-col gap-3 p-3 sm:p-4 overflow-y-auto min-w-0">

          {/* Info bar */}
          <div className="flex items-center justify-between shrink-0 flex-wrap gap-2">
            <div>
              <h2 className="font-serif font-bold text-sm text-[#1e3a6e]">
                {editingDeck?.name ?? "—"}
              </h2>
              <p className="text-[10px] text-[#8b7d6b] mt-0.5">
                {selectedDef
                  ? `Placing: ${selectedDef.name} — click your zone`
                  : "Select a piece → click highlighted zone (rows 11–15)"}
              </p>
            </div>

            <div className="flex items-center gap-2">
              {/* Piece count */}
              <span
                className="px-2.5 py-1 rounded-full text-xs font-semibold"
                style={{
                  background: canPlay ? "rgba(74,222,128,0.15)" : "rgba(201,168,76,0.12)",
                  color: canPlay ? "#4ade80" : "#b8860b",
                  border: `1px solid ${canPlay ? "rgba(74,222,128,0.4)" : "#c9a84c40"}`,
                }}
              >
                {count}/{MAX_PIECES}
              </span>

              <button
                onClick={handleClearDeck}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-[#f8711340] text-[#f87171] text-xs hover:bg-[#f8711310] transition-colors cursor-pointer"
              >
                <Trash2 className="size-3" />
                Clear
              </button>
            </div>
          </div>

          {/* Validation feedback */}
          {deckErrors.length > 0 && (
            <div className="flex flex-col gap-1 shrink-0">
              {deckErrors.map(err => (
                <div
                  key={err}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px]"
                  style={{
                    background: "rgba(248,113,113,0.1)",
                    color: "#f87171",
                    border: "1px solid rgba(248,113,113,0.25)",
                  }}
                >
                  ⚠ {err}
                </div>
              ))}
            </div>
          )}

          {canPlay && (
            <div
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] shrink-0"
              style={{
                background: "rgba(74,222,128,0.1)",
                color: "#4ade80",
                border: "1px solid rgba(74,222,128,0.25)",
              }}
            >
              ✓ Deck ready — hit Play!
            </div>
          )}

          {/* Board */}
          <div className="flex-1 flex items-center justify-center min-h-0">
            <div className="w-full max-w-sm sm:max-w-md lg:max-w-lg xl:max-w-xl">
              {editingDeck ? (
                <BoardPreview
                  slots={editingDeck.slots}
                  selectedDef={selectedDef}
                  onTileClick={handleTileClick}
                />
              ) : (
                <div className="aspect-square flex items-center justify-center rounded-xl border border-dashed border-[#c9a84c40]">
                  <p className="text-sm text-[#8b7d6b] italic font-serif">
                    Select or create a deck
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 shrink-0 flex-wrap">
            {[
              { color: "rgba(74,222,128,0.15)",  border: "rgba(74,222,128,0.4)", label: "Your zone" },
              { color: "rgba(201,168,76,0.2)",   border: "#c9a84c60",            label: "Piece placed" },
            ].map(({ color, border, label }) => (
              <div key={label} className="flex items-center gap-1.5">
                <div className="w-4 h-4 rounded-sm border" style={{ background: color, borderColor: border }} />
                <span className="text-[9px] uppercase tracking-widest text-[#8b7d6b]">{label}</span>
              </div>
            ))}
          </div>

          {/* Mobile piece picker */}
          <div className="lg:hidden flex flex-col gap-2 mt-1">
            <span className="text-[9px] uppercase tracking-widest text-[#8b7d6b]">Select Piece</span>
            <div className="grid grid-cols-2 gap-1.5">
              {allDefs.map(def => (
                <PieceCard
                  key={def.typeId}
                  def={def}
                  selected={selectedDef?.typeId === def.typeId}
                  count={defCountMap.get(def.typeId) ?? 0}
                  onClick={() => setSelectedDef(prev =>
                    prev?.typeId === def.typeId ? null : def
                  )}
                />
              ))}
            </div>
          </div>
        </main>

        {/* ── Right: Piece Roster ──────────────────────────── */}
        <aside
          className="hidden lg:flex flex-col gap-3 w-60 xl:w-68 shrink-0 p-3 border-l border-[#c9a84c30] overflow-y-auto"
          style={{ background: "rgba(253,251,247,0.7)" }}
        >
          <span className="text-[9px] uppercase tracking-widest text-[#8b7d6b]">
            Piece Roster · click to select
          </span>

          <div className="flex flex-col gap-1.5">
            {allDefs.map(def => (
              <PieceCard
                key={def.typeId}
                def={def}
                selected={selectedDef?.typeId === def.typeId}
                count={defCountMap.get(def.typeId) ?? 0}
                onClick={() => setSelectedDef(prev =>
                  prev?.typeId === def.typeId ? null : def
                )}
              />
            ))}
          </div>

          {/* Selected piece detail */}
          {selectedDef != null && (
            <div
              className="rounded-lg border px-3 py-3 flex flex-col gap-2 mt-1"
              style={{ background: "rgba(201,168,76,0.06)", borderColor: "#c9a84c40" }}
            >
              <div className="flex items-center gap-2">
                <span className="text-2xl leading-none">{selectedDef.symbol}</span>
                <div>
                  <p className="font-serif font-bold text-sm text-[#1e3a6e]">{selectedDef.name}</p>
                  <p
                    className="text-[9px] uppercase tracking-wider"
                    style={{ color: FACTION_COLOR[selectedDef.faction] }}
                  >
                    {selectedDef.faction}
                  </p>
                </div>
              </div>
              <p className="text-[10px] text-[#8b7d6b] leading-relaxed">{selectedDef.description}</p>
              <div className="flex items-center gap-3 text-[10px]">
                <span className="flex items-center gap-1 text-[#4ade80]">
                  <Heart className="size-3" />{selectedDef.maxHp > 0 ? selectedDef.maxHp : "∞"}
                </span>
                <span className="flex items-center gap-1 text-[#f97316]">
                  <Swords className="size-3" />{selectedDef.attack}
                </span>
                <span className="flex items-center gap-1 text-[#60a5fa]">
                  <Shield className="size-3" />{selectedDef.defense}
                </span>
              </div>
              {selectedDef.abilities.map(ab => (
                <div key={ab.id} className="flex flex-col gap-0.5 border-t border-[#c9a84c20] pt-2">
                  <span className="text-[10px] font-semibold text-[#1e3a6e]">{ab.name}</span>
                  <span className="text-[9px] text-[#8b7d6b]">{ab.description}</span>
                </div>
              ))}
              {REQUIRED_PIECES[selectedDef.typeId] && (
                <p className="text-[9px] text-[#f87171] italic">
                  Required — exactly 1 per deck
                </p>
              )}
              <p className="text-[9px] text-[#b8860b] italic">
                Click a highlighted tile to place
              </p>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}