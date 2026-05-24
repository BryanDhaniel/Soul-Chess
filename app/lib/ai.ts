// ============================================================
// SOULCHESS — AI Module
// ============================================================
// Architecture: strategy pattern — swap difficulty by changing
// the AIStrategy implementation. Currently: RandomStrategy.
//
// To upgrade later:
//   GreedyStrategy  → pick highest-value capture, avoid danger
//   MinimaxStrategy → depth-limited search with eval function
// ============================================================
import type { GameState, Piece, Coord, Player } from "../types/game";
import {
  buildPieceMap, coordKey, isInBounds, isInsideOctagon, GRID_SIZE,
} from "./boardUtils";
import { getPieceDefinitionById } from "./pieceRegistry";

// ─── AI Move: what the AI wants to do this turn ──────────────
export type AIMove =
  | { kind: "move";   pieceId: string; to: Coord }
  | { kind: "attack"; pieceId: string; targetId: string };

// ─── Movement helpers (duplicated from engine — keeps ai.ts self-contained) ──
function pawnDir(owner: Player) { return owner === "white" ? -1 : 1; }

function getPieceMoves(piece: Piece, pieceMap: Map<string, Piece>): Coord[] {
  const def  = getPieceDefinitionById(piece.definitionId);
  const flip = piece.definitionId === "iron_pawn" ? pawnDir(piece.owner) : 1;
  const valid: Coord[] = [];

  for (const [dr, dc, maxSteps] of def.movement.directions) {
    const steps = maxSteps === 0 ? GRID_SIZE : maxSteps;
    for (let s = 1; s <= steps; s++) {
      const r = piece.position.row + dr * flip * s;
      const c = piece.position.col + dc * s;
      if (!isInBounds(r, c) || !isInsideOctagon(r, c)) break;
      const blocker = pieceMap.get(coordKey({ row: r, col: c }));
      if (blocker) { if (!def.movement.canLeap) break; continue; }
      valid.push({ row: r, col: c });
    }
  }
  return valid;
}

function getPieceAttacks(piece: Piece, pieceMap: Map<string, Piece>): Piece[] {
  const def  = getPieceDefinitionById(piece.definitionId);
  const flip = piece.definitionId === "iron_pawn" ? pawnDir(piece.owner) : 1;
  const targets: Piece[] = [];

  for (const [dr, dc, maxSteps] of def.movement.directions) {
    const steps = maxSteps === 0 ? GRID_SIZE : maxSteps;
    for (let s = 1; s <= steps; s++) {
      const r = piece.position.row + dr * flip * s;
      const c = piece.position.col + dc * s;
      if (!isInBounds(r, c) || !isInsideOctagon(r, c)) break;
      const t = pieceMap.get(coordKey({ row: r, col: c }));
      if (t) {
        if (t.owner !== piece.owner) targets.push(t);
        if (!def.movement.canLeap) break;
      }
    }
  }

  // Pawn diagonal attacks
  if (piece.definitionId === "iron_pawn") {
    const dir = pawnDir(piece.owner);
    for (const dc of [-1, 1]) {
      const r = piece.position.row + dir;
      const c = piece.position.col + dc;
      if (!isInBounds(r, c) || !isInsideOctagon(r, c)) continue;
      const t = pieceMap.get(coordKey({ row: r, col: c }));
      if (t && t.owner !== piece.owner) targets.push(t);
    }
  }

  return targets;
}

// ─── Strategy interface ───────────────────────────────────────
export interface AIStrategy {
  chooseMove(state: GameState, aiPlayer: Player): AIMove | null;
}

// ─── Random Strategy ─────────────────────────────────────────
// Pick a random piece, then a random action (attack preferred if available).
export class RandomStrategy implements AIStrategy {
  chooseMove(state: GameState, aiPlayer: Player): AIMove | null {
    const pieceMap = buildPieceMap(state.pieces);

    // All AI pieces that haven't acted
    const myPieces = Object.values(state.pieces).filter(
      p => p.owner === aiPlayer && !p.hasActed,
    );
    if (myPieces.length === 0) return null;

    // Shuffle for randomness
    const shuffled = [...myPieces].sort(() => Math.random() - 0.5);

    for (const piece of shuffled) {
      // Gather options
      const attacks = getPieceAttacks(piece, pieceMap);
      const moves   = getPieceMoves(piece, pieceMap);

      // Prefer attack if available (still random which target)
      if (attacks.length > 0) {
        const target = attacks[Math.floor(Math.random() * attacks.length)];
        return { kind: "attack", pieceId: piece.id, targetId: target.id };
      }

      if (moves.length > 0) {
        const dest = moves[Math.floor(Math.random() * moves.length)];
        return { kind: "move", pieceId: piece.id, to: dest };
      }
    }

    return null; // No moves available (shouldn't happen unless stalemated)
  }
}

// ─── Factory ─────────────────────────────────────────────────
export type AIDifficulty = "random"; // extend: | "greedy" | "minimax"

export function createAI(difficulty: AIDifficulty): AIStrategy {
  switch (difficulty) {
    case "random":
    default:
      return new RandomStrategy();
  }
}