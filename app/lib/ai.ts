// ============================================================
// SOULCHESS — AI Module
// ============================================================
// Architecture: strategy pattern — swap difficulty by changing
// the AIStrategy implementation.
//
// Difficulties:
//   "random"  → RandomStrategy  (Easy)   — pure random legal move
//   "greedy"  → GreedyStrategy  (Normal) — prioritise captures & king safety
//   "minimax" → MinimaxStrategy (Hard)   — depth-2 minimax with eval
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

// ─── Movement helpers (self-contained, mirrors gameEngine.ts) ─
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

  if (piece.definitionId !== "iron_pawn") {
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
  }

  // Pawn diagonal attacks — all 4 directions (matches gameEngine.ts)
  if (piece.definitionId === "iron_pawn") {
    for (const dr of [-1, 1]) {
      for (const dc of [-1, 1]) {
        const r = piece.position.row + dr;
        const c = piece.position.col + dc;
        if (!isInBounds(r, c) || !isInsideOctagon(r, c)) continue;
        const t = pieceMap.get(coordKey({ row: r, col: c }));
        if (t && t.owner !== piece.owner) targets.push(t);
      }
    }
  }

  return targets;
}

// ─── Piece value table for evaluation ────────────────────────
const PIECE_VALUES: Record<string, number> = {
  soul_king:       1000,
  soulbound_queen: 9,
  void_rook:       5,
  wraith_bishop:   3,
  arcane_knight:   3,
  iron_pawn:       1,
};

function pieceValue(definitionId: string): number {
  return PIECE_VALUES[definitionId] ?? 2;
}

// ─── Board evaluation (from aiPlayer's perspective) ──────────
function evaluate(state: GameState, aiPlayer: Player): number {
  let score = 0;
  const opponent: Player = aiPlayer === "white" ? "black" : "white";

  for (const p of Object.values(state.pieces)) {
    const v = pieceValue(p.definitionId);
    score += p.owner === aiPlayer ? v : -v;
  }

  // Bonus: king alive
  const aiKingId = state.kingIds[aiPlayer];
  const opKingId = state.kingIds[opponent];
  if (aiKingId && !state.pieces[aiKingId]) score -= 1000;
  if (opKingId && !state.pieces[opKingId]) score += 1000;

  return score;
}

// ─── Strategy interface ───────────────────────────────────────
export interface AIStrategy {
  chooseMove(state: GameState, aiPlayer: Player): AIMove | null;
}

// ─── Easy: Random Strategy ───────────────────────────────────
// Pick a random piece, then a random action (attack preferred if available).
export class RandomStrategy implements AIStrategy {
  chooseMove(state: GameState, aiPlayer: Player): AIMove | null {
    const pieceMap = buildPieceMap(state.pieces);

    const myPieces = Object.values(state.pieces).filter(
      p => p.owner === aiPlayer && !p.hasActed,
    );
    if (myPieces.length === 0) return null;

    const shuffled = [...myPieces].sort(() => Math.random() - 0.5);

    for (const piece of shuffled) {
      const attacks = getPieceAttacks(piece, pieceMap);
      const moves   = getPieceMoves(piece, pieceMap);

      if (attacks.length > 0) {
        const target = attacks[Math.floor(Math.random() * attacks.length)];
        return { kind: "attack", pieceId: piece.id, targetId: target.id };
      }

      if (moves.length > 0) {
        const dest = moves[Math.floor(Math.random() * moves.length)];
        return { kind: "move", pieceId: piece.id, to: dest };
      }
    }

    return null;
  }
}

// ─── Normal: Greedy Strategy ─────────────────────────────────
// Always choose the highest-value capture available.
// If no capture, move the most-forward piece (advance toward enemy).
export class GreedyStrategy implements AIStrategy {
  chooseMove(state: GameState, aiPlayer: Player): AIMove | null {
    const pieceMap = buildPieceMap(state.pieces);
    const opponent: Player = aiPlayer === "white" ? "black" : "white";

    const myPieces = Object.values(state.pieces).filter(
      p => p.owner === aiPlayer && !p.hasActed,
    );
    if (myPieces.length === 0) return null;

    // 1. Find the highest-value capture across all pieces
    let bestCapture: { pieceId: string; targetId: string; value: number } | null = null;

    for (const piece of myPieces) {
      const attacks = getPieceAttacks(piece, pieceMap);
      for (const target of attacks) {
        const v = pieceValue(target.definitionId);
        if (!bestCapture || v > bestCapture.value) {
          bestCapture = { pieceId: piece.id, targetId: target.id, value: v };
        }
      }
    }

    if (bestCapture) {
      return { kind: "attack", pieceId: bestCapture.pieceId, targetId: bestCapture.targetId };
    }

    // 2. Find piece+move that makes the most forward progress toward enemy
    // "Forward" = decreasing row for white (enemy is row 0), increasing for black
    const opponentBackRow = opponent === "black" ? 0 : 15;
    let bestMove: { pieceId: string; to: Coord; progress: number } | null = null;

    for (const piece of myPieces) {
      const moves = getPieceMoves(piece, pieceMap);
      for (const dest of moves) {
        const progress = aiPlayer === "white"
          ? piece.position.row - dest.row   // white advances toward row 0
          : dest.row - piece.position.row;  // black advances toward row 15

        // Bonus for moving toward enemy back row
        const distBonus = aiPlayer === "white"
          ? Math.abs(opponentBackRow - piece.position.row)
          : Math.abs(opponentBackRow - piece.position.row);
        const score = progress + distBonus * 0.01;

        if (!bestMove || score > bestMove.progress) {
          bestMove = { pieceId: piece.id, to: dest, progress: score };
        }
      }
    }

    if (bestMove) {
      return { kind: "move", pieceId: bestMove.pieceId, to: bestMove.to };
    }

    return null;
  }
}

// ─── Hard: Minimax Strategy ───────────────────────────────────
// Depth-2 minimax with alpha-beta pruning and piece-value evaluation.
export class MinimaxStrategy implements AIStrategy {
  private depth: number;

  constructor(depth = 2) {
    this.depth = depth;
  }

  chooseMove(state: GameState, aiPlayer: Player): AIMove | null {
    const myPieces = Object.values(state.pieces).filter(
      p => p.owner === aiPlayer && !p.hasActed,
    );
    if (myPieces.length === 0) return null;

    // Collect all candidate moves
    const pieceMap = buildPieceMap(state.pieces);
    const candidates: AIMove[] = [];

    for (const piece of myPieces) {
      for (const target of getPieceAttacks(piece, pieceMap)) {
        candidates.push({ kind: "attack", pieceId: piece.id, targetId: target.id });
      }
      for (const dest of getPieceMoves(piece, pieceMap)) {
        candidates.push({ kind: "move", pieceId: piece.id, to: dest });
      }
    }

    if (candidates.length === 0) return null;

    // Shuffle to avoid deterministic play at equal scores
    const shuffled = [...candidates].sort(() => Math.random() - 0.5);

    let bestScore = -Infinity;
    let bestMove: AIMove = shuffled[0];

    for (const move of shuffled) {
      const nextState = this.applyMove(state, move, aiPlayer);
      if (!nextState) continue;
      const score = this.minimax(nextState, this.depth - 1, false, aiPlayer, -Infinity, Infinity);
      if (score > bestScore) {
        bestScore = score;
        bestMove = move;
      }
    }

    return bestMove;
  }

  private minimax(
    state: GameState,
    depth: number,
    isMaximising: boolean,
    aiPlayer: Player,
    alpha: number,
    beta: number,
  ): number {
    if (depth === 0 || state.phase !== "battle") {
      return evaluate(state, aiPlayer);
    }

    const currentPlayer: Player = state.currentPlayer;
    const pieceMap = buildPieceMap(state.pieces);
    const myPieces = Object.values(state.pieces).filter(
      p => p.owner === currentPlayer && !p.hasActed,
    );

    const moves: AIMove[] = [];
    for (const piece of myPieces) {
      for (const target of getPieceAttacks(piece, pieceMap)) {
        moves.push({ kind: "attack", pieceId: piece.id, targetId: target.id });
      }
      for (const dest of getPieceMoves(piece, pieceMap)) {
        moves.push({ kind: "move", pieceId: piece.id, to: dest });
      }
    }

    if (moves.length === 0) return evaluate(state, aiPlayer);

    if (isMaximising) {
      let maxEval = -Infinity;
      for (const move of moves) {
        const next = this.applyMove(state, move, currentPlayer);
        if (!next) continue;
        const score = this.minimax(next, depth - 1, false, aiPlayer, alpha, beta);
        maxEval = Math.max(maxEval, score);
        alpha = Math.max(alpha, score);
        if (beta <= alpha) break;
      }
      return maxEval;
    } else {
      let minEval = Infinity;
      for (const move of moves) {
        const next = this.applyMove(state, move, currentPlayer);
        if (!next) continue;
        const score = this.minimax(next, depth - 1, true, aiPlayer, alpha, beta);
        minEval = Math.min(minEval, score);
        beta = Math.min(beta, score);
        if (beta <= alpha) break;
      }
      return minEval;
    }
  }

  // Lightweight state mutation for minimax tree exploration.
  // Does NOT run abilities or full engine logic — sufficient for eval.
  private applyMove(state: GameState, move: AIMove, player: Player): GameState | null {
    const pieces = { ...state.pieces };

    if (move.kind === "attack") {
      const attacker = pieces[move.pieceId];
      const defender = pieces[move.targetId];
      if (!attacker || !defender) return null;

      delete pieces[move.targetId];
      pieces[move.pieceId] = { ...attacker, position: defender.position, hasActed: true };

      // Check win condition
      const opponent: Player = player === "white" ? "black" : "white";
      const opKingId = state.kingIds[opponent];
      const phase = opKingId && !pieces[opKingId] ? "ended" : state.phase;

      return {
        ...state,
        pieces,
        phase,
        winner: phase === "ended" ? player : null,
        currentPlayer: opponent,
      };
    } else {
      const piece = pieces[move.pieceId];
      if (!piece) return null;

      pieces[move.pieceId] = { ...piece, position: move.to, hasActed: true };
      const opponent: Player = player === "white" ? "black" : "white";
      return { ...state, pieces, currentPlayer: opponent };
    }
  }
}

// ─── Factory ─────────────────────────────────────────────────
export type AIDifficulty = "random" | "greedy" | "minimax";

export function createAI(difficulty: AIDifficulty): AIStrategy {
  switch (difficulty) {
    case "greedy":  return new GreedyStrategy();
    case "minimax": return new MinimaxStrategy(2);
    case "random":
    default:
      return new RandomStrategy();
  }
}