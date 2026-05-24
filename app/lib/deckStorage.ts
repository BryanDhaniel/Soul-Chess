// ============================================================
// SOULCHESS — Deck Storage (localStorage)
// ============================================================
import type { DeckConfig, FormationSlot, Coord } from "../types/game";
import { isInsideOctagon } from "./boardUtils";

const DECKS_KEY  = "soulchess_decks";
const ACTIVE_KEY = "soulchess_active_deck";

// ─── Deployment zone ─────────────────────────────────────────
// Stored coords are always in white's perspective (row 11–15).
// Engine mirrors black's coords: boardRow = 15 - slot.coord.row
export const WHITE_ZONE_MIN_ROW = 11;
export const WHITE_ZONE_MAX_ROW = 15;
export const MAX_PIECES = 20;

export function isInDeployZone(coord: Coord): boolean {
  return (
    coord.row >= WHITE_ZONE_MIN_ROW &&
    coord.row <= WHITE_ZONE_MAX_ROW &&
    isInsideOctagon(coord.row, coord.col)
  );
}

// ─── Migration ───────────────────────────────────────────────
// Older builds stored slots as { slotIndex, definitionId }.
// Any slot without a valid { coord: { row, col } } is dropped.
function migrateDecks(raw: unknown[]): DeckConfig[] {
  return (raw as DeckConfig[]).map(deck => ({
    ...deck,
    slots: (deck.slots ?? []).filter(
      (s: FormationSlot) =>
        s.coord !== undefined &&
        typeof s.coord.row === "number" &&
        typeof s.coord.col === "number"
    ),
  }));
}

// ─── CRUD ────────────────────────────────────────────────────
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

// ─── Default starter deck ────────────────────────────────────
export function makeDefaultDeck(name: string): DeckConfig {
  const placements: Array<{ row: number; col: number; id: string }> = [
    { row: 15, col: 5,  id: "void_rook"         },
    { row: 15, col: 6,  id: "arcane_knight"      },
    { row: 15, col: 7,  id: "wraith_bishop"      },
    { row: 15, col: 8,  id: "soul_king"          },
    { row: 15, col: 9,  id: "soulbound_queen"    },
    { row: 15, col: 10, id: "wraith_bishop"      },
    { row: 15, col: 11, id: "arcane_knight"      },
    { row: 15, col: 12, id: "void_rook"          },
    { row: 14, col: 5,  id: "stone_sentinel"     },
    { row: 14, col: 6,  id: "storm_mage"         },
    { row: 14, col: 7,  id: "phantom_assassin"   },
    { row: 14, col: 8,  id: "ember_drake"        },
    { row: 14, col: 9,  id: "ember_drake"        },
    { row: 14, col: 10, id: "phantom_assassin"   },
    { row: 14, col: 11, id: "storm_mage"         },
    { row: 14, col: 12, id: "stone_sentinel"     },
    { row: 13, col: 6,  id: "iron_pawn"          },
    { row: 13, col: 7,  id: "iron_pawn"          },
    { row: 13, col: 8,  id: "iron_pawn"          },
    { row: 13, col: 9,  id: "iron_pawn"          },
  ];

  const slots: FormationSlot[] = placements.map(p => ({
    coord: { row: p.row, col: p.col },
    definitionId: p.id,
  }));

  return { id: crypto.randomUUID(), name, slots };
}