// ============================================================
// SOULCHESS — Board Utilities
// ============================================================
import type { Coord, Tile, TileEffect, Piece, MovementPattern } from "../types/game";

export const GRID_SIZE = 16;
export const CORNER_CUT = 4; // triangle size cut from corners

// ─── Octagon Geometry ────────────────────────────────────────

/** Returns true if a coordinate is inside the octagon play area */
export function isInsideOctagon(row: number, col: number): boolean {
  const isTopLeft     = row + col < CORNER_CUT;
  const isTopRight    = col - row > GRID_SIZE - 1 - CORNER_CUT;
  const isBottomLeft  = row - col > GRID_SIZE - 1 - CORNER_CUT;
  const isBottomRight = row + col > (GRID_SIZE - 1) * 2 - CORNER_CUT;
  return !(isTopLeft || isTopRight || isBottomLeft || isBottomRight);
}

export function coordKey(coord: Coord): string {
  return `${coord.row}-${coord.col}`;
}

export function coordsEqual(a: Coord, b: Coord): boolean {
  return a.row === b.row && a.col === b.col;
}

export function isInBounds(row: number, col: number): boolean {
  return row >= 0 && row < GRID_SIZE && col >= 0 && col < GRID_SIZE;
}

// ─── Board Initialisation ────────────────────────────────────

/** Sparse tile effects placed on specific squares for flavour */
const SPECIAL_TILES: Array<{ coord: Coord; effect: TileEffect }> = [
  // Centre cluster — amplify
  { coord: { row: 7, col: 7 },   effect: "amplify" },
  { coord: { row: 7, col: 8 },   effect: "amplify" },
  { coord: { row: 8, col: 7 },   effect: "amplify" },
  { coord: { row: 8, col: 8 },   effect: "amplify" },
  // Shield corners (inner)
  { coord: { row: 4, col: 7 },   effect: "shield" },
  { coord: { row: 11, col: 8 },  effect: "shield" },
  { coord: { row: 7, col: 4 },   effect: "shield" },
  { coord: { row: 8, col: 11 },  effect: "shield" },
  // Sacred spots
  { coord: { row: 3, col: 8 },   effect: "sacred" },
  { coord: { row: 12, col: 7 },  effect: "sacred" },
  // Cursed diagonal
  { coord: { row: 5, col: 5 },   effect: "cursed" },
  { coord: { row: 10, col: 10 }, effect: "cursed" },
  { coord: { row: 5, col: 10 },  effect: "cursed" },
  { coord: { row: 10, col: 5 },  effect: "cursed" },
  // Portal pair
  { coord: { row: 6, col: 3 },   effect: "portal" },
  { coord: { row: 9, col: 12 },  effect: "portal" },
];

const PORTAL_TARGETS: Record<string, Coord> = {
  "6-3":  { row: 9, col: 12 },
  "9-12": { row: 6, col: 3  },
};

export function createBoard(): Tile[][] {
  // Build special tile lookup
  const specialMap = new Map<string, { effect: TileEffect }>();
  for (const s of SPECIAL_TILES) {
    specialMap.set(coordKey(s.coord), { effect: s.effect });
  }

  const board: Tile[][] = [];
  for (let r = 0; r < GRID_SIZE; r++) {
    board[r] = [];
    for (let c = 0; c < GRID_SIZE; c++) {
      const coord: Coord = { row: r, col: c };
      const key = coordKey(coord);
      const special = specialMap.get(key);
      board[r][c] = {
        coord,
        isInside: isInsideOctagon(r, c),
        isLight: (r + c) % 2 === 0,
        effect: special?.effect ?? "none",
        portalTarget: PORTAL_TARGETS[key],
        highlight: "none",
        pieceId: undefined,
      };
    }
  }
  return board;
}

// ─── Highlight Helpers ───────────────────────────────────────

export function clearHighlights(board: Tile[][]): Tile[][] {
  return board.map(row =>
    row.map(tile => ({ ...tile, highlight: "none" as const }))
  );
}

export function applyHighlights(
  board: Tile[][],
  selected: Coord | null,
  moves: Coord[],
  attacks: Coord[],
  abilities: Coord[],
): Tile[][] {
  const next = clearHighlights(board);

  for (const coord of moves) {
    next[coord.row][coord.col] = { ...next[coord.row][coord.col], highlight: "move" };
  }
  for (const coord of attacks) {
    next[coord.row][coord.col] = { ...next[coord.row][coord.col], highlight: "attack" };
  }
  for (const coord of abilities) {
    next[coord.row][coord.col] = { ...next[coord.row][coord.col], highlight: "ability" };
  }
  if (selected) {
    next[selected.row][selected.col] = { ...next[selected.row][selected.col], highlight: "selected" };
  }
  return next;
}

// ─── Movement Calculation ────────────────────────────────────

/**
 * Returns all valid move destinations for a piece.
 * Respects octagon bounds, blocking pieces, and leap flag.
 */
export function calculateMoves(
  piece: Piece,
  board: Tile[][],
  pieceMap: Map<string, Piece>, // coord-key → Piece
): Coord[] {
  const { movement } = getPieceDefinition(piece.definitionId);
  const valid: Coord[] = [];

  for (const [dr, dc, maxSteps] of movement.directions) {
    const steps = maxSteps === 0 ? GRID_SIZE : maxSteps;

    for (let s = 1; s <= steps; s++) {
      const r = piece.position.row + dr * s;
      const c = piece.position.col + dc * s;

      if (!isInBounds(r, c) || !isInsideOctagon(r, c)) break;

      const key = coordKey({ row: r, col: c });
      const blocker = pieceMap.get(key);

      if (blocker) {
        // If leap, we just skip this tile but continue in direction
        if (!movement.canLeap) break;
        continue;
      }

      valid.push({ row: r, col: c });
    }
  }

  return valid;
}

/**
 * Returns all valid attack targets for a piece.
 * Attack range follows the same pattern as movement,
 * but targets enemy-occupied tiles instead of empty ones.
 */
export function calculateAttacks(
  piece: Piece,
  board: Tile[][],
  pieceMap: Map<string, Piece>,
): Coord[] {
  const { movement } = getPieceDefinition(piece.definitionId);
  const valid: Coord[] = [];

  for (const [dr, dc, maxSteps] of movement.directions) {
    const steps = maxSteps === 0 ? GRID_SIZE : maxSteps;

    for (let s = 1; s <= steps; s++) {
      const r = piece.position.row + dr * s;
      const c = piece.position.col + dc * s;

      if (!isInBounds(r, c) || !isInsideOctagon(r, c)) break;

      const key = coordKey({ row: r, col: c });
      const target = pieceMap.get(key);

      if (target) {
        if (target.owner !== piece.owner) {
          valid.push({ row: r, col: c });
        }
        // Either way, stop sliding past this tile
        if (!movement.canLeap) break;
      }
    }
  }

  return valid;
}

// ─── Combat ──────────────────────────────────────────────────

/**
 * Resolves a single attack.
 * Returns { damage, isLethal }.
 * A piece with maxHp === 0 is "chess-mode" — always lethal.
 */
export function resolveAttack(attacker: Piece, defender: Piece): { damage: number; isLethal: boolean } {
  const isChessMode = defender.maxHp === 0;
  if (isChessMode) return { damage: 0, isLethal: true };

  const rawDamage = Math.max(1, attacker.attack - defender.defense);
  const isLethal = rawDamage >= defender.hp;
  return { damage: rawDamage, isLethal };
}

// ─── Piece Definition Registry ───────────────────────────────
// Imported lazily to avoid circular deps — populated by pieceRegistry.ts

type DefinitionGetter = (id: string) => { movement: MovementPattern; maxHp: number };
let _getDefinition: DefinitionGetter | null = null;

export function registerDefinitionGetter(fn: DefinitionGetter) {
  _getDefinition = fn;
}

export function getPieceDefinition(id: string): { movement: MovementPattern; maxHp: number } {
  if (!_getDefinition) throw new Error("Piece definition getter not registered");
  return _getDefinition(id);
}

// ─── Piece Map Builder ───────────────────────────────────────

/** Builds a coord-key → Piece lookup from the pieces record */
export function buildPieceMap(pieces: Record<string, Piece>): Map<string, Piece> {
  const map = new Map<string, Piece>();
  for (const piece of Object.values(pieces)) {
    map.set(coordKey(piece.position), piece);
  }
  return map;
}

// ─── Placement Zone ──────────────────────────────────────────

/** White deploys on bottom rows (10-15), Black on top rows (0-5) */
export function isInDeploymentZone(coord: Coord, player: "white" | "black"): boolean {
  if (!isInsideOctagon(coord.row, coord.col)) return false;
  if (player === "white") return coord.row >= 10;
  return coord.row <= 5;
}