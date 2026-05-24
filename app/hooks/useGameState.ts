// ============================================================
// SOULCHESS — useGameState Hook (with AI support)
// ============================================================
"use client";
import { useReducer, useCallback, useMemo, useEffect, useRef } from "react";
import { gameReducer, createInitialState } from "../lib/gameEngine";
import { createAI, type AIDifficulty } from "../lib/ai";
import type { Coord, DeckConfig, Player } from "../types/game";

export interface UseGameStateOptions {
  whiteDeck: DeckConfig;
  blackDeck: DeckConfig;
  // Which player(s) are controlled by AI. undefined = human vs human.
  aiPlayers?: Partial<Record<Player, AIDifficulty>>;
  // Delay in ms before AI makes its move (feels more natural). Default 600.
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

  // Keep a stable ref to AI strategies
  const aiRef = useRef<Partial<Record<Player, ReturnType<typeof createAI>>>>({});
  useEffect(() => {
    const next: Partial<Record<Player, ReturnType<typeof createAI>>> = {};
    for (const [player, difficulty] of Object.entries(aiPlayers) as [Player, AIDifficulty][]) {
      next[player] = createAI(difficulty);
    }
    aiRef.current = next;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(aiPlayers)]);

  // ── AI turn trigger ──────────────────────────────────────
  useEffect(() => {
    if (state.phase !== "battle" || state.winner) return;

    const ai = aiRef.current[state.currentPlayer];
    if (!ai) return; // human's turn

    const timer = setTimeout(() => {
      const move = ai.chooseMove(state, state.currentPlayer);
      if (!move) return;

      if (move.kind === "attack") {
        // Select piece first (needed for engine validation), then attack
        dispatch({ type: "SELECT_PIECE", pieceId: move.pieceId });
        // Slight delay so SELECT has time to compute validAttacks before ATTACK
        setTimeout(() => {
          dispatch({ type: "ATTACK_PIECE", targetId: move.targetId });
        }, 50);
      } else {
        dispatch({ type: "SELECT_PIECE", pieceId: move.pieceId });
        setTimeout(() => {
          dispatch({ type: "MOVE_PIECE", to: move.to });
        }, 50);
      }
    }, aiDelay);

    return () => clearTimeout(timer);
  }, [state.currentPlayer, state.phase, state.winner, state.turnNumber, aiDelay]);

  // ── Human dispatchers ────────────────────────────────────
  const selectPiece = useCallback(
    (pieceId: string) => dispatch({ type: "SELECT_PIECE", pieceId }),
    [],
  );
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

  // ── Derived state ────────────────────────────────────────
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

  // Is the current turn controlled by AI?
  const isAITurn = Boolean(aiRef.current[state.currentPlayer]);

  return {
    state,
    // Human actions — UI should disable these when isAITurn = true
    selectPiece,
    deselect,
    movePiece,
    attackPiece,
    // Derived
    selectedPiece,
    validMoveKeys,
    validAttackKeys,
    isAITurn,
  };
}