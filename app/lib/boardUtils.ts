// ============================================================
// SOULCHESS — Board Utilities
// ============================================================
import type { Coord, Tile, TileEffect, Piece } from "../types/game";

export const GRID_SIZE  = 16;
export const CORNER_CUT = 4;

// ─── Octagon geometry ────────────────────────────────────────
export function isInsideOctagon(row: number, col: number): boolean {
  const isTopLeft     = row + col < CORNER_CUT;
  const isTopRight    = col - row > GRID_SIZE - 1 - CORNER_CUT;
  const isBottomLeft  = row - col > GRID_SIZE - 1 - CORNER_CUT;
  const isBottomRight = row + col > (GRID_SIZE - 1) * 2 - CORNER_CUT;
  return !(isTopLeft || isTopRight || isBottomLeft || isBottomRight);
}

export function isInBounds(row: number, col: number): boolean {
  return row >= 0 && row < GRID_SIZE && col >= 0 && col < GRID_SIZE;
}

export function coordKey(coord: Coord): string {
  return `${coord.row}-${coord.col}`;
}

export function coordsEqual(a: Coord, b: Coord): boolean {
  return a.row === b.row && a.col === b.col;
}

// ─── Special tile layout ─────────────────────────────────────
const SPECIAL_TILES: Array<{ coord: Coord; effect: TileEffect }> = [
  { coord: { row: 7,  col: 7  }, effect: "amplify" },
  { coord: { row: 7,  col: 8  }, effect: "amplify" },
  { coord: { row: 8,  col: 7  }, effect: "amplify" },
  { coord: { row: 8,  col: 8  }, effect: "amplify" },
  { coord: { row: 4,  col: 7  }, effect: "shield"  },
  { coord: { row: 11, col: 8  }, effect: "shield"  },
  { coord: { row: 7,  col: 4  }, effect: "shield"  },
  { coord: { row: 8,  col: 11 }, effect: "shield"  },
  { coord: { row: 3,  col: 8  }, effect: "sacred"  },
  { coord: { row: 12, col: 7  }, effect: "sacred"  },
  { coord: { row: 5,  col: 5  }, effect: "cursed"  },
  { coord: { row: 10, col: 10 }, effect: "cursed"  },
  { coord: { row: 5,  col: 10 }, effect: "cursed"  },
  { coord: { row: 10, col: 5  }, effect: "cursed"  },
  { coord: { row: 6,  col: 3  }, effect: "portal"  },
  { coord: { row: 9,  col: 12 }, effect: "portal"  },
];

const PORTAL_TARGETS: Record<string, Coord> = {
  "6-3":  { row: 9, col: 12 },
  "9-12": { row: 6, col: 3  },
};

// ─── Board factory ───────────────────────────────────────────
export function createBoard(): Tile[][] {
  const specialMap = new Map(SPECIAL_TILES.map(s => [coordKey(s.coord), s.effect]));
  const board: Tile[][] = [];
  for (let r = 0; r < GRID_SIZE; r++) {
    board[r] = [];
    for (let c = 0; c < GRID_SIZE; c++) {
      const coord: Coord = { row: r, col: c };
      const key = coordKey(coord);
      board[r][c] = {
        coord,
        isInside: isInsideOctagon(r, c),
        isLight: (r + c) % 2 === 0,
        effect: specialMap.get(key) ?? "none",
        portalTarget: PORTAL_TARGETS[key],
        highlight: "none",
        pieceId: undefined,
      };
    }
  }
  return board;
}

// ─── Highlight helpers ───────────────────────────────────────
export function clearHighlights(board: Tile[][]): Tile[][] {
  return board.map(row => row.map(tile => ({ ...tile, highlight: "none" as const })));
}

export function applyHighlights(
  board: Tile[][],
  selected: Coord | null,
  moves: Coord[],
  attacks: Coord[],
  abilities: Coord[],
): Tile[][] {
  const next = clearHighlights(board);
  for (const c of moves)    next[c.row][c.col] = { ...next[c.row][c.col], highlight: "move" };
  for (const c of attacks)  next[c.row][c.col] = { ...next[c.row][c.col], highlight: "attack" };
  for (const c of abilities) next[c.row][c.col] = { ...next[c.row][c.col], highlight: "ability" };
  if (selected) next[selected.row][selected.col] = { ...next[selected.row][selected.col], highlight: "selected" };
  return next;
}

// ─── Piece map builder ───────────────────────────────────────
export function buildPieceMap(pieces: Record<string, Piece>): Map<string, Piece> {
  const map = new Map<string, Piece>();
  for (const p of Object.values(pieces)) map.set(coordKey(p.position), p);
  return map;
}

// ─── Combat resolution ───────────────────────────────────────