// ============================================================
// SOULCHESS — useGameState Hook
// ============================================================
"use client";
import { useReducer, useCallback, useMemo } from "react";
import { gameReducer, createInitialState } from "../lib/gameEngine";
import type { Coord, DeckConfig } from "../types/game";

export function useGameState(whiteDeck: DeckConfig, blackDeck: DeckConfig) {
  const [state, dispatch] = useReducer(
    gameReducer,
    undefined,
    () => createInitialState(whiteDeck, blackDeck),
  );

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

  return {
    state,
    selectPiece,
    deselect,
    movePiece,
    attackPiece,
    selectedPiece,
    validMoveKeys,
    validAttackKeys,
  };
}