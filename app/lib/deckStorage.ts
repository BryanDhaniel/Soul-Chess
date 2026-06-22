// ============================================================
// SOULCHESS - Deck Storage (localStorage)
// ============================================================
import type { DeckConfig, FormationSlot, Coord } from "../types/game";
import { isInsideOctagon } from "./boardUtils";
import { getAllDefinitions } from "./pieceRegistry";

const DECKS_KEY  = "soulchess_decks";
const ACTIVE_KEY = "soulchess_active_deck";

// --- Deployment zone ---
// Stored coords are always in white's perspective (row 11-15).
// Engine mirrors black's coords: boardRow = 15 - slot.coord.row
export const WHITE_ZONE_MIN_ROW = 11;
export const WHITE_ZONE_MAX_ROW = 15;
export const MAX_PIECES = 20;

// Pieces that must appear exactly once in every deck
export const REQUIRED_PIECES: Record<string, { label: string; max: number }> = {
  soul_king:       { label: "Soul King",       max: 1 },
  soulbound_queen: { label: "Soulbound Queen", max: 1 },
};

export function isDeckValid(slots: FormationSlot[]): boolean {
  for (const [typeId, rule] of Object.entries(REQUIRED_PIECES)) {
    const count = slots.filter(s => s.definitionId === typeId).length;
    if (count !== rule.max) return false;
  }
  return slots.length === MAX_PIECES;
}

export function getDeckErrors(slots: FormationSlot[]): string[] {
  const errors: string[] = [];
  for (const [typeId, rule] of Object.entries(REQUIRED_PIECES)) {
    const count = slots.filter(s => s.definitionId === typeId).length;
    if (count === 0) errors.push(`Missing ${rule.label} (required: 1)`);
    if (count > rule.max) errors.push(`Too many ${rule.label} (max: ${rule.max})`);
  }
  if (slots.length < MAX_PIECES) errors.push(`Need ${MAX_PIECES - slots.length} more piece${MAX_PIECES - slots.length > 1 ? "s" : ""}`);
  return errors;
}

export function isInDeployZone(coord: Coord): boolean {
  return (
    coord.row >= WHITE_ZONE_MIN_ROW &&
    coord.row <= WHITE_ZONE_MAX_ROW &&
    isInsideOctagon(coord.row, coord.col)
  );
}

// --- Migration ---
// Older builds stored slots as { slotIndex, definitionId }.
// Any slot without a valid { coord: { row, col } } is dropped.
// It also checks against the active piece registry to drop removed piece definitions.
function migrateDecks(raw: unknown[]): DeckConfig[] {
  const validPieceIds = new Set(getAllDefinitions().map(def => def.typeId));

  return (raw as DeckConfig[]).map(deck => ({
    ...deck,
    slots: (deck.slots ?? []).filter(
      (s: FormationSlot) =>
        s.coord !== undefined &&
        typeof s.coord.row === "number" &&
        typeof s.coord.col === "number" &&
        validPieceIds.has(s.definitionId)
    ),
  }));
}

// --- CRUD ---
export function loadDecks(): DeckConfig[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(DECKS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return migrateDecks(Array.isArray(parsed) ? parsed : []);
  } catch { return []; }
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
  return idx === -1 ? [...decks, deck] : decks.map(d => d.id === deck.id ? deck : d);
}

export function deleteDeck(decks: DeckConfig[], id: string): DeckConfig[] {
  return decks.filter(d => d.id !== id);
}

// --- Default starter deck ---
// 1 Soul King + 1 Soulbound Queen (required) + 18 free picks,
// placed anywhere in white's deploy zone (rows 11-15).
export function makeDefaultDeck(name: string): DeckConfig {
  const placements: Array<{ row: number; col: number; id: string }> = [
    { row: 15, col: 5,  id: "void_rook"       },
    { row: 15, col: 6,  id: "arcane_knight"   },
    { row: 15, col: 7,  id: "wraith_bishop"   },
    { row: 15, col: 8,  id: "soul_king"       },
    { row: 15, col: 9,  id: "soulbound_queen" },
    { row: 15, col: 10, id: "wraith_bishop"   },
    { row: 15, col: 11, id: "arcane_knight"   },
    { row: 15, col: 12, id: "void_rook"       },
    { row: 14, col: 5,  id: "iron_pawn"       },
    { row: 14, col: 6,  id: "iron_pawn"       },
    { row: 14, col: 7,  id: "iron_pawn"       },
    { row: 14, col: 8,  id: "iron_pawn"       },
    { row: 14, col: 9,  id: "iron_pawn"       },
    { row: 14, col: 10, id: "iron_pawn"       },
    { row: 14, col: 11, id: "iron_pawn"       },
    { row: 14, col: 12, id: "iron_pawn"       },
    { row: 13, col: 6,  id: "iron_pawn"       },
    { row: 13, col: 7,  id: "iron_pawn"       },
    { row: 13, col: 8,  id: "iron_pawn"       },
    { row: 13, col: 9,  id: "iron_pawn"       },
  ];

  const slots: FormationSlot[] = placements.map(p => ({
    coord: { row: p.row, col: p.col },
    definitionId: p.id,
  }));

  return { id: crypto.randomUUID(), name, slots };
}

// --- Random AI deck ---
// Generates a fully random deck for the AI:
//  - Exactly 1 Soul King + 1 Soulbound Queen (required)
//  - Remaining 18 slots filled with random pieces from the registry
//  - Placed randomly across the deploy zone (rows 11-15)
export function makeRandomDeck(name: string): DeckConfig {
  const allDefs = getAllDefinitions();
  const freePool = allDefs.filter(
    d => !Object.keys(REQUIRED_PIECES).includes(d.typeId)
  );

  // Build pool of 18 random piece type IDs
  const pool: string[] = [];
  while (pool.length < 18) {
    const def = freePool[Math.floor(Math.random() * freePool.length)];
    pool.push(def.typeId);
  }

  const pieceIds = [...Object.keys(REQUIRED_PIECES), ...pool];

  // Collect all valid deploy zone tiles (rows 11-15 inside octagon)
  const validCoords: Array<{ row: number; col: number }> = [];
  for (let r = WHITE_ZONE_MIN_ROW; r <= WHITE_ZONE_MAX_ROW; r++) {
    for (let c = 0; c < 16; c++) {
      if (isInsideOctagon(r, c)) validCoords.push({ row: r, col: c });
    }
  }

  // Shuffle valid coords
  const shuffled = [...validCoords].sort(() => Math.random() - 0.5);

  // Assign each piece to a unique coord
  const slots: FormationSlot[] = pieceIds.slice(0, shuffled.length).map((id, i) => ({
    coord: { row: shuffled[i].row, col: shuffled[i].col },
    definitionId: id,
  }));

  return { id: crypto.randomUUID(), name, slots };
}