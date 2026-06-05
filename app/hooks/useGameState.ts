// ============================================================
// SOULCHESS — useGameState Hook (with sound effects)
// ============================================================
"use client";
import { useReducer, useCallback, useMemo, useEffect, useRef } from "react";
import { gameReducer, createInitialState } from "../lib/gameEngine";
import { createAI, type AIDifficulty } from "../lib/ai";
import { sfx } from "../lib/sounds";
import type { Coord, DeckConfig, Player, GameState } from "../types/game";

export interface UseGameStateOptions {
  whiteDeck: DeckConfig;
  blackDeck: DeckConfig;
  aiPlayers?: Partial<Record<Player, AIDifficulty>>;
  aiDelay?: number;
}

export function useGameState({
  whiteDeck,
  blackDeck,
  aiPlayers = {},
  aiDelay = 600,
}: UseGameStateOptions) {
  const [state, dispatch] = useReducer(
    gameReducer,
    undefined,
    () => createInitialState(whiteDeck, blackDeck),
  );

  // ── Track previous state for sound triggers ──────────────
  const prevStateRef = useRef<GameState>(state);

  useEffect(() => {
    const prev = prevStateRef.current;
    const curr = state;

    // Piece captured — compare piece counts
    const prevCount = Object.keys(prev.pieces).length;
    const currCount = Object.keys(curr.pieces).length;
    if (currCount < prevCount) {
      sfx.capture();
    }
    // Move made (no capture, but current player switched)
    else if (prev.currentPlayer !== curr.currentPlayer && curr.phase === "battle") {
      sfx.move();
    }

    // Win / defeat
    if (!prev.winner && curr.winner) {
      // We don't know which side the human is from here — play victory always
      // (BattleView can call victory/defeat directly if needed)
      sfx.victory();
    }

    prevStateRef.current = curr;
  }, [state]);

  // ── AI turn trigger ───────────────────────────────────────
  const aiRef = useRef<Partial<Record<Player, ReturnType<typeof createAI>>>>({});
  useEffect(() => {
    const next: Partial<Record<Player, ReturnType<typeof createAI>>> = {};
    for (const [player, difficulty] of Object.entries(aiPlayers) as [Player, AIDifficulty][]) {
      next[player] = createAI(difficulty);
    }
    aiRef.current = next;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(aiPlayers)]);

  useEffect(() => {
    if (state.phase !== "battle" || state.winner) return;
    const ai = aiRef.current[state.currentPlayer];
    if (!ai) return;

    const timer = setTimeout(() => {
      const move = ai.chooseMove(state, state.currentPlayer);
      if (!move) return;

      if (move.kind === "attack") {
        dispatch({ type: "SELECT_PIECE", pieceId: move.pieceId });
        setTimeout(() => dispatch({ type: "ATTACK_PIECE", targetId: move.targetId }), 50);
      } else {
        dispatch({ type: "SELECT_PIECE", pieceId: move.pieceId });
        setTimeout(() => dispatch({ type: "MOVE_PIECE", to: move.to }), 50);
      }
    }, aiDelay);

    return () => clearTimeout(timer);
  }, [state.currentPlayer, state.phase, state.winner, state.turnNumber, aiDelay]);

  // ── Human dispatchers ─────────────────────────────────────
  const selectPiece = useCallback((pieceId: string) => {
    sfx.select();
    dispatch({ type: "SELECT_PIECE", pieceId });
  }, []);

  const deselect = useCallback(
    () => dispatch({ type: "DESELECT" }),
    [],
  );

  const movePiece = useCallback(
    (to: Coord) => dispatch({ type: "MOVE_PIECE", to }),
    [],
  );

  const attackPiece = useCallback(
    (targetId: string) => dispatch({ type: "ATTACK_PIECE", targetId }),
    [],
  );

  // ── Derived ───────────────────────────────────────────────
  const selectedPiece = state.selectedPieceId
    ? (state.pieces[state.selectedPieceId] ?? null)
    : null;

  const validMoveKeys = useMemo(
    () => new Set(state.validMoves.map(c => `${c.row}-${c.col}`)),
    [state.validMoves],
  );

  const validAttackKeys = useMemo(
    () => new Set(state.validAttacks.map(c => `${c.row}-${c.col}`)),
    [state.validAttacks],
  );

  const isAITurn = Boolean(aiRef.current[state.currentPlayer]);

  return {
    state,
    selectPiece,
    deselect,
    movePiece,
    attackPiece,
    selectedPiece,
    validMoveKeys,
    validAttackKeys,
    isAITurn,
  };
}