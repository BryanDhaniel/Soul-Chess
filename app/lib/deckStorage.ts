// ============================================================
// SOULCHESS — Deck Storage (localStorage)
// ============================================================
import type { DeckConfig, FormationSlot } from "../types/game";

const DECKS_KEY  = "soulchess_decks";
const ACTIVE_KEY = "soulchess_active_deck";

export function loadDecks(): DeckConfig[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(DECKS_KEY);
    return raw ? (JSON.parse(raw) as DeckConfig[]) : [];
  } catch {
    return [];
  }
}

export function saveDecks(decks: DeckConfig[]): void {
  localStorage.setItem(DECKS_KEY, JSON.stringify(decks));
}

export function loadActiveDeckId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ACTIVE_KEY);
}

export function saveActiveDeckId(id: string): void {
  localStorage.setItem(ACTIVE_KEY, id);
}

export function createNewDeck(name: string): DeckConfig {
  return { id: crypto.randomUUID(), name, slots: [] };
}

export function upsertDeck(decks: DeckConfig[], deck: DeckConfig): DeckConfig[] {
  const idx = decks.findIndex(d => d.id === deck.id);
  return idx === -1
    ? [...decks, deck]
    : decks.map(d => (d.id === deck.id ? deck : d));
}

export function deleteDeck(decks: DeckConfig[], id: string): DeckConfig[] {
  return decks.filter(d => d.id !== id);
}

// ─── Default starter deck (full 20-piece roster) ─────────────
export function makeDefaultDeck(name: string): DeckConfig {
  const order = [
    "soul_king",       "soulbound_queen", "void_rook",        "void_rook",        "wraith_bishop",
    "wraith_bishop",   "arcane_knight",   "arcane_knight",    "storm_mage",       "storm_mage",
    "iron_pawn",       "iron_pawn",       "iron_pawn",        "iron_pawn",        "iron_pawn",
    "ember_drake",     "phantom_assassin","phantom_assassin", "stone_sentinel",   "stone_sentinel",
  ];
  const slots: FormationSlot[] = order.map((definitionId, slotIndex) => ({
    slotIndex,
    definitionId,
  }));
  return { id: crypto.randomUUID(), name, slots };
}