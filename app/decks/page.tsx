// ============================================================
// SOULCHESS — /decks  (Deck Builder + Formation Editor)
// ============================================================
"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronLeft, Plus, Trash2, Save, Crown, Swords, Shield,
  Heart, Edit2, Check, X, Play, Star,
} from "lucide-react";
import type { DeckConfig, FormationSlot, PieceDefinition } from "../types/game";
import { getAllDefinitions } from "../lib/pieceRegistry";
import {
  loadDecks, saveDecks, loadActiveDeckId, saveActiveDeckId,
  createNewDeck, upsertDeck, deleteDeck, makeDefaultDeck,
} from "../lib/deckStorage";

// ─── Constants ───────────────────────────────────────────────
const FORM_COLS = 5;
const FORM_ROWS = 4;
const MAX_PIECES = FORM_COLS * FORM_ROWS; // 20

const TIER_COLOR: Record<number, string> = {
  1: "#8b7d6b",
  2: "#3b82f6",
  3: "#b8860b",
};
const FACTION_COLOR: Record<string, string> = {
  Arcane: "#c9a84c",
  Void:   "#9b6de0",
  Iron:   "#7a8fa0",
  Fire:   "#e05c2a",
};

// ─── Small helpers ───────────────────────────────────────────
function slotKey(slot: number) { return `slot_${slot}`; }
function pieceCount(deck: DeckConfig) { return deck.slots.length; }

// ─── Sub-components ──────────────────────────────────────────

function PieceCard({
  def, selected, onClick,
}: { def: PieceDefinition; selected: boolean; onClick: () => void }) {
  const fc = FACTION_COLOR[def.faction] ?? "#c9a84c";
  const tc = TIER_COLOR[def.tier];
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 w-full px-2.5 py-2 rounded-lg border text-left transition-all hover:scale-[1.01] cursor-pointer"
      style={{
        background: selected ? `${fc}18` : "rgba(253,251,247,0.6)",
        borderColor: selected ? fc : "#c9a84c25",
        boxShadow: selected ? `0 0 0 1.5px ${fc}` : "none",
      }}
    >
      <span className="text-lg leading-none shrink-0">{def.symbol}</span>
      <div className="flex flex-col flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="font-serif font-semibold text-xs text-[#1e3a6e] truncate">{def.name}</span>
          <span className="text-[8px] uppercase tracking-wider shrink-0" style={{ color: tc }}>T{def.tier}</span>
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
        </div>
      </div>
    </button>
  );
}

function FormationGrid({
  deck, selectedDef, onSlotClick, onSlotClear,
}: {
  deck: DeckConfig;
  selectedDef: PieceDefinition | null;
  onSlotClick: (slotIndex: number) => void;
  onSlotClear: (slotIndex: number) => void;
}) {
  const slotMap = new Map(deck.slots.map(s => [s.slotIndex, s.definitionId]));
  const defs = getAllDefinitions();
  const defMap = new Map(defs.map(d => [d.typeId, d]));

  return (
    <div className="flex flex-col gap-2">
      {/* Label */}
      <div className="flex items-center justify-between">
        <span className="text-[10px] uppercase tracking-widest text-[#8b7d6b]">
          Formation Grid · {pieceCount(deck)}/{MAX_PIECES} pieces
        </span>
        <div className="flex items-center gap-3 text-[9px] text-[#8b7d6b]">
          <span className="flex items-center gap-1">
            <span className="inline-block w-3 h-3 rounded-sm bg-[#e8dcc8] border border-[#c9a84c30]" />
            Empty slot
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block w-3 h-3 rounded-sm bg-[#c9a84c25] border border-[#c9a84c]" />
            Filled
          </span>
        </div>
      </div>

      {/* Direction labels */}
      <div className="text-center text-[9px] uppercase tracking-[0.3em] text-[#8b7d6b] mb-0.5">
        ← Enemy Side
      </div>

      {/* Grid */}
      <div
        className="grid gap-1.5 mx-auto w-full"
        style={{ gridTemplateColumns: `repeat(${FORM_COLS}, minmax(0, 1fr))` }}
      >
        {Array.from({ length: MAX_PIECES }, (_, i) => {
          const defId = slotMap.get(i);
          const def = defId ? defMap.get(defId) : null;
          const fc = def ? (FACTION_COLOR[def.faction] ?? "#c9a84c") : null;

          return (
            <div
              key={i}
              className="relative aspect-square rounded-md border flex items-center justify-center cursor-pointer transition-all hover:scale-105 group"
              style={{
                background: def ? `${fc}15` : "rgba(232,220,200,0.5)",
                borderColor: def ? (fc ?? "#c9a84c") : "#c9a84c30",
                boxShadow: def ? `0 0 0 1px ${fc}50` : "none",
              }}
              onClick={() => onSlotClick(i)}
            >
              {def ? (
                <>
                  <span className="text-base leading-none select-none">{def.symbol}</span>
                  {/* Clear button */}
                  <button
                    onClick={e => { e.stopPropagation(); onSlotClear(i); }}
                    className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-[#f87171] border border-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                  >
                    <X className="size-2.5 text-white" />
                  </button>
                </>
              ) : (
                <Plus className="size-3 text-[#c9a84c60]" />
              )}
            </div>
          );
        })}
      </div>

      <div className="text-center text-[9px] uppercase tracking-[0.3em] text-[#8b7d6b] mt-0.5">
        ← Your Side (front row at top of grid)
      </div>

      {selectedDef && (
        <p className="text-center text-[10px] text-[#b8860b] italic mt-1">
          Click an empty slot to place {selectedDef.name}
        </p>
      )}
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────
export default function DecksPage() {
  const router = useRouter();
  const allDefs = getAllDefinitions();

  const [decks, setDecks]           = useState<DeckConfig[]>([]);
  const [activeDeckId, setActiveDeckId] = useState<string | null>(null);
  const [editingDeck, setEditingDeck]   = useState<DeckConfig | null>(null);
  const [selectedDef, setSelectedDef]   = useState<PieceDefinition | null>(null);
  const [renamingId, setRenamingId]     = useState<string | null>(null);
  const [renameValue, setRenameValue]   = useState("");

  // ── Load from localStorage ──────────────────────────────
  useEffect(() => {
    let loaded = loadDecks();
    if (loaded.length === 0) {
      const d1 = makeDefaultDeck("Arcane Army");
      const d2 = makeDefaultDeck("Shadow Legion");
      loaded = [d1, d2];
      saveDecks(loaded);
    }
    setDecks(loaded);
    const aid = loadActiveDeckId() ?? loaded[0]?.id ?? null;
    setActiveDeckId(aid);
    setEditingDeck(loaded.find(d => d.id === aid) ?? loaded[0] ?? null);
  }, []);

  // ── Persist on change ───────────────────────────────────
  const persistDecks = useCallback((next: DeckConfig[]) => {
    setDecks(next);
    saveDecks(next);
  }, []);

  // ── Slot click: place selected piece ───────────────────
  const handleSlotClick = useCallback((slotIndex: number) => {
    if (!editingDeck || !selectedDef) return;
    const existing = editingDeck.slots.find(s => s.slotIndex === slotIndex);
    if (existing) return; // already filled — use clear button
    if (editingDeck.slots.length >= MAX_PIECES) return;

    const newSlot: FormationSlot = { slotIndex, definitionId: selectedDef.typeId };
    const updated: DeckConfig = { ...editingDeck, slots: [...editingDeck.slots, newSlot] };
    setEditingDeck(updated);
    const nextDecks = upsertDeck(decks, updated);
    persistDecks(nextDecks);
  }, [editingDeck, selectedDef, decks, persistDecks]);

  // ── Slot clear ──────────────────────────────────────────
  const handleSlotClear = useCallback((slotIndex: number) => {
    if (!editingDeck) return;
    const updated: DeckConfig = {
      ...editingDeck,
      slots: editingDeck.slots.filter(s => s.slotIndex !== slotIndex),
    };
    setEditingDeck(updated);
    persistDecks(upsertDeck(decks, updated));
  }, [editingDeck, decks, persistDecks]);

  // ── New deck ─────────────────────────────────────────────
  const handleNewDeck = useCallback(() => {
    const d = createNewDeck(`Deck ${decks.length + 1}`);
    const next = [...decks, d];
    persistDecks(next);
    setEditingDeck(d);
    setActiveDeckId(d.id);
    saveActiveDeckId(d.id);
  }, [decks, persistDecks]);

  // ── Delete deck ──────────────────────────────────────────
  const handleDeleteDeck = useCallback((id: string) => {
    const next = deleteDeck(decks, id);
    persistDecks(next);
    if (editingDeck?.id === id) {
      setEditingDeck(next[0] ?? null);
      setActiveDeckId(next[0]?.id ?? null);
    }
  }, [decks, editingDeck, persistDecks]);

  // ── Select deck to edit ──────────────────────────────────
  const handleSelectDeck = useCallback((deck: DeckConfig) => {
    setEditingDeck(deck);
    setActiveDeckId(deck.id);
    saveActiveDeckId(deck.id);
  }, []);

  // ── Rename ───────────────────────────────────────────────
  const startRename = (deck: DeckConfig) => { setRenamingId(deck.id); setRenameValue(deck.name); };
  const commitRename = () => {
    if (!renamingId || !renameValue.trim()) { setRenamingId(null); return; }
    const updated = decks.map(d => d.id === renamingId ? { ...d, name: renameValue.trim() } : d);
    persistDecks(updated);
    if (editingDeck?.id === renamingId) setEditingDeck(prev => prev ? { ...prev, name: renameValue.trim() } : prev);
    setRenamingId(null);
  };

  // ── Clear entire deck ────────────────────────────────────
  const handleClearDeck = () => {
    if (!editingDeck) return;
    const updated = { ...editingDeck, slots: [] };
    setEditingDeck(updated);
    persistDecks(upsertDeck(decks, updated));
  };

  // ── Play ─────────────────────────────────────────────────
  const handlePlay = () => {
    if (activeDeckId) saveActiveDeckId(activeDeckId);
    router.push("/play/local");
  };

  const count = editingDeck ? pieceCount(editingDeck) : 0;
  const canPlay = count === MAX_PIECES;

  // ── Render ───────────────────────────────────────────────
  return (
    <div
      className="min-h-screen w-full flex flex-col"
      style={{ background: "radial-gradient(ellipse at top, #fff4c2 0%, #f5f0e8 45%, #ece4d3 100%)" }}
    >
      {/* Header */}
      <header
        className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-[#c9a84c30] shrink-0"
        style={{ background: "rgba(253,251,247,0.85)", backdropFilter: "blur(8px)" }}
      >
        <button onClick={() => router.push("/")} className="flex items-center gap-2 text-[#8b7d6b] hover:text-[#1e3a6e] transition-colors cursor-pointer">
          <ChevronLeft className="size-4" />
          <span className="text-xs uppercase tracking-widest font-medium">Back</span>
        </button>
        <div className="flex items-center gap-2">
          <Crown className="size-4 text-[#b8860b]" />
          <span className="font-serif font-bold text-base text-[#1e3a6e] tracking-wider">Deck Builder</span>
        </div>
        <button
          onClick={handlePlay}
          disabled={!canPlay}
          className="flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider text-[#fdfbf7] transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer hover:opacity-90"
          style={{ background: "linear-gradient(135deg, #c9a84c 0%, #b8860b 100%)", boxShadow: canPlay ? "0 4px 12px rgba(184,134,11,0.3)" : "none" }}
        >
          <Play className="size-3 fill-current" />
          {canPlay ? "Play" : `${count}/${MAX_PIECES}`}
        </button>
      </header>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden min-h-0">

        {/* ── Left: Deck List ──────────────────────────── */}
        <aside
          className="flex flex-col gap-3 w-44 sm:w-52 shrink-0 p-3 border-r border-[#c9a84c30] overflow-y-auto"
          style={{ background: "rgba(253,251,247,0.7)" }}
        >
          <div className="flex items-center justify-between">
            <span className="text-[9px] uppercase tracking-widest text-[#8b7d6b]">My Decks</span>
            <button onClick={handleNewDeck} className="text-[#b8860b] hover:text-[#1e3a6e] transition-colors cursor-pointer">
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
                      onKeyDown={e => { if (e.key === "Enter") commitRename(); if (e.key === "Escape") setRenamingId(null); }}
                      className="flex-1 bg-transparent text-xs text-[#1e3a6e] font-serif outline-none border-b border-[#c9a84c] min-w-0"
                      onClick={e => e.stopPropagation()}
                    />
                  ) : (
                    <span className="flex-1 font-serif text-xs text-[#1e3a6e] truncate">{deck.name}</span>
                  )}

                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    <button onClick={e => { e.stopPropagation(); startRename(deck); }} className="text-[#8b7d6b] hover:text-[#1e3a6e] cursor-pointer">
                      <Edit2 className="size-3" />
                    </button>
                    {decks.length > 1 && (
                      <button onClick={e => { e.stopPropagation(); handleDeleteDeck(deck.id); }} className="text-[#f87171] hover:text-red-600 cursor-pointer">
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

        {/* ── Centre: Formation Grid ───────────────────── */}
        <main className="flex-1 flex flex-col gap-4 p-4 sm:p-5 overflow-y-auto min-w-0">
          {editingDeck ? (
            <>
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-serif font-bold text-base text-[#1e3a6e]">{editingDeck.name}</h2>
                  <p className="text-[10px] text-[#8b7d6b] mt-0.5">
                    Drag a piece type from the right → click a slot to place it
                  </p>
                </div>
                <button
                  onClick={handleClearDeck}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#f8711340] text-[#f87171] text-xs hover:bg-[#f8711310] transition-colors cursor-pointer"
                >
                  <Trash2 className="size-3" />
                  Clear
                </button>
              </div>

              <FormationGrid
                deck={editingDeck}
                selectedDef={selectedDef}
                onSlotClick={handleSlotClick}
                onSlotClear={handleSlotClear}
              />

              {/* Mobile: compact piece selector below grid */}
              <div className="lg:hidden flex flex-col gap-2 mt-2">
                <span className="text-[9px] uppercase tracking-widest text-[#8b7d6b]">Select Piece</span>
                <div className="grid grid-cols-2 gap-1.5">
                  {allDefs.map(def => (
                    <PieceCard
                      key={def.typeId}
                      def={def}
                      selected={selectedDef?.typeId === def.typeId}
                      onClick={() => setSelectedDef(prev => prev?.typeId === def.typeId ? null : def)}
                    />
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-sm text-[#8b7d6b] italic font-serif">Select or create a deck</p>
            </div>
          )}
        </main>

        {/* ── Right: Piece Roster ──────────────────────── */}
        <aside
          className="hidden lg:flex flex-col gap-3 w-64 xl:w-72 shrink-0 p-4 border-l border-[#c9a84c30] overflow-y-auto"
          style={{ background: "rgba(253,251,247,0.7)" }}
        >
          <span className="text-[9px] uppercase tracking-widest text-[#8b7d6b]">
            Piece Roster · click to select
          </span>

          {/* Filter by faction */}
          <div className="flex flex-col gap-1.5">
            {allDefs.map(def => (
              <PieceCard
                key={def.typeId}
                def={def}
                selected={selectedDef?.typeId === def.typeId}
                onClick={() => setSelectedDef(prev => prev?.typeId === def.typeId ? null : def)}
              />
            ))}
          </div>

          {/* Selected piece detail */}
          {selectedDef && (
            <div
              className="mt-2 rounded-lg border px-3 py-3 flex flex-col gap-2"
              style={{ background: "rgba(201,168,76,0.06)", borderColor: "#c9a84c40" }}
            >
              <div className="flex items-center gap-2">
                <span className="text-2xl">{selectedDef.symbol}</span>
                <div>
                  <p className="font-serif font-bold text-sm text-[#1e3a6e]">{selectedDef.name}</p>
                  <p className="text-[9px] uppercase tracking-wider" style={{ color: FACTION_COLOR[selectedDef.faction] }}>
                    {selectedDef.faction}
                  </p>
                </div>
              </div>
              <p className="text-[10px] text-[#8b7d6b] leading-relaxed">{selectedDef.description}</p>
              {selectedDef.abilities.map(ab => (
                <div key={ab.id} className="flex flex-col gap-0.5">
                  <span className="text-[10px] font-semibold text-[#1e3a6e]">{ab.name}</span>
                  <span className="text-[9px] text-[#8b7d6b]">{ab.description}</span>
                </div>
              ))}
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}