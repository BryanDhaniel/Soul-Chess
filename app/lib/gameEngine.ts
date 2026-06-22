// ============================================================
// SOULCHESS — Game Engine (Pure Reducer)
// ============================================================
import type {
  GameState, GameAction, Piece, Tile, Player, Coord, TurnRecord, DeckConfig,
} from "../types/game";
import {
  createBoard, buildPieceMap, applyHighlights, clearHighlights,
  coordKey, coordsEqual, isInBounds, isInsideOctagon, GRID_SIZE,
} from "./boardUtils";
import { getPieceDefinitionById } from "./pieceRegistry";

// ─── Tile colour helper (for Bishop Color Bind) ──────────────
// Standard chess square colouring: (row + col) even = light, odd = dark
function tileColor(coord: Coord): "light" | "dark" {
  return (coord.row + coord.col) % 2 === 0 ? "light" : "dark";
}

// ─── Piece factory ───────────────────────────────────────────
let _uid = 0;
function makePiece(definitionId: string, owner: Player, position: Coord): Piece {
  const def = getPieceDefinitionById(definitionId);
  return {
    id: `${definitionId}_${owner}_${++_uid}`,
    definitionId, owner,
    position, hasActed: false,
    abilities: def.abilities.map(ab => ({ ...ab, currentCooldown: 0 })),
    buffs: [],
  };
}

// ─── Deploy decks ────────────────────────────────────────────
// Slots are stored in white-perspective coords (row 11–15).
// Black is mirrored: blackRow = 15 - whiteRow
//   white row 15 → black row 0  (back rank)
//   white row 11 → black row 4  (front)
function deployDeck(
  deck: DeckConfig,
  owner: Player,
  pieces: Record<string, Piece>,
): { pieces: Record<string, Piece>; kingId: string } {
  const out = { ...pieces };
  let kingId = "";

  for (const slot of deck.slots) {
    const boardRow = owner === "white"
      ? slot.coord.row
      : 15 - slot.coord.row;
    const boardCol = slot.coord.col;

    if (!isInsideOctagon(boardRow, boardCol)) continue;
    if (Object.values(out).some(p =>
      p.position.row === boardRow && p.position.col === boardCol
    )) continue;

    const piece = makePiece(slot.definitionId, owner, { row: boardRow, col: boardCol });
    out[piece.id] = piece;
    if (slot.definitionId === "soul_king") kingId = piece.id;
  }

  return { pieces: out, kingId };
}

// ─── Board sync ──────────────────────────────────────────────
function syncBoard(board: Tile[][], pieces: Record<string, Piece>): Tile[][] {
  const next = board.map(r => r.map(t => ({ ...t, pieceId: undefined as string | undefined })));
  for (const p of Object.values(pieces)) {
    next[p.position.row][p.position.col] = {
      ...next[p.position.row][p.position.col],
      pieceId: p.id,
    };
  }
  return next;
}

// ─── Movement ────────────────────────────────────────────────
// Pawn direction is defined as [-1,0,1] assuming WHITE moves toward row 0.
// Only black needs to be flipped (+1, moving toward row 15).
function pawnDir(owner: Player) { return owner === "white" ? 1 : -1; }

// effective definitionId — Soul Mimic disguise overrides movement/attacks
function effectiveDefId(piece: Piece): string {
  return piece.mimicDefinitionId ?? piece.definitionId;
}

export function calcMoves(piece: Piece, pieceMap: Map<string, Piece>): Coord[] {
  const defId = effectiveDefId(piece);
  const def   = getPieceDefinitionById(defId);
  const flip  = defId === "iron_pawn" ? pawnDir(piece.owner) : 1;
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

export function calcAttacks(piece: Piece, pieceMap: Map<string, Piece>): Coord[] {
  const defId = effectiveDefId(piece);
  const def   = getPieceDefinitionById(defId);
  const flip  = defId === "iron_pawn" ? pawnDir(piece.owner) : 1;
  const valid: Coord[] = [];

  // PERBAIKAN 1: Bidak Pawn jangan diproses di loop serangan standar
  // agar tidak bisa menyerang lurus ke depan
  if (defId !== "iron_pawn") {
    for (const [dr, dc, maxSteps] of def.movement.directions) {
      const steps = maxSteps === 0 ? GRID_SIZE : maxSteps;
      for (let s = 1; s <= steps; s++) {
        const r = piece.position.row + dr * flip * s;
        const c = piece.position.col + dc * s;
        if (!isInBounds(r, c) || !isInsideOctagon(r, c)) break;
        const target = pieceMap.get(coordKey({ row: r, col: c }));
        if (target) {
          if (target.owner !== piece.owner && isAttackable(piece, target)) {
            valid.push({ row: r, col: c });
          }
          if (!def.movement.canLeap) break;
        }
      }
    }
  }

  // Pawn (or mimicked pawn): diagonal forward attacks only
  if (defId === "iron_pawn") {
    const dir = pawnDir(piece.owner);
    for (const dc of [-1, 1]) {
      // PERBAIKAN 2: Kalikan dir dengan -1. 
      // Putih (dir=1) akan menjadi -1 (maju ke atas). 
      // Hitam (dir=-1) akan menjadi 1 (maju ke bawah).
      const r = piece.position.row + (-1 * dir); 
      const c = piece.position.col + dc;
      if (!isInBounds(r, c) || !isInsideOctagon(r, c)) continue;
      const t = pieceMap.get(coordKey({ row: r, col: c }));
      if (t && t.owner !== piece.owner && isAttackable(piece, t)) {
        valid.push({ row: r, col: c });
      }
    }
  }
  
  return valid;
}

// ─── Color Bind check ────────────────────────────────────────
// Bishop passive: can only be captured by an attacker standing on
// the same square colour (light/dark) as the Bishop itself.
// Also respects Soul Mimic — if a piece is disguised as a Bishop, it inherits Color Bind.
function isAttackable(attacker: Piece, defender: Piece): boolean {
  if (effectiveDefId(defender) !== "wraith_bishop") return true;
  return tileColor(attacker.position) === tileColor(defender.position);
}

// ─── Ability target calculation ──────────────────────────────
// Returns valid ability targets for the given piece + ability.
function calcAbilityTargets(
  piece: Piece, abilityId: string, pieces: Record<string, Piece>,
): Coord[] {
  if (abilityId === "royal_swap") {
    // Any friendly piece other than this King
    return Object.values(pieces)
      .filter(p => p.owner === piece.owner && p.id !== piece.id)
      .map(p => p.position);
  }

  if (abilityId === "royal_teleport") {
    // Any empty tile on the board
    const occupied = new Set(Object.values(pieces).map(p => coordKey(p.position)));
    const targets: Coord[] = [];
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        if (!isInsideOctagon(r, c)) continue;
        const coord = { row: r, col: c };
        if (!occupied.has(coordKey(coord))) targets.push(coord);
      }
    }
    return targets;
  }

  return [];
}

// ─── Auto-switch ─────────────────────────────────────────────
function switchPlayer(state: GameState): GameState {
  const next: Player = state.currentPlayer === "white" ? "black" : "white";
  const turnNumber = next === "white" ? state.turnNumber + 1 : state.turnNumber;

  const newPieces: Record<string, Piece> = {};
  for (const [id, p] of Object.entries(state.pieces)) {
    let piece: Piece = {
      ...p, hasActed: false,
      buffs: p.buffs
        .map(b => ({ ...b, duration: b.duration === -1 ? -1 : b.duration - 1 }))
        .filter(b => b.duration !== 0),
      abilities: p.abilities.map(ab => ({
        ...ab, currentCooldown: Math.max(0, ab.currentCooldown - 1),
      })),
    };

    // Soul Mimic revert check — disguise ends once we reach the stored revert turn
    if (piece.mimicDefinitionId && piece.mimicRevertTurn !== undefined) {
      if (turnNumber >= piece.mimicRevertTurn) {
        piece = {
          ...piece,
          definitionId: piece.baseDefinitionId ?? piece.definitionId,
          mimicDefinitionId: undefined,
          mimicRevertTurn: undefined,
          baseDefinitionId: undefined,
        };
      }
    }

    newPieces[id] = piece;
  }

  const nextState: GameState = {
    ...state,
    currentPlayer: next,
    turnNumber,
    pieces: newPieces,
    board: syncBoard(clearHighlights(state.board), newPieces),
    selectedPieceId: null,
    validMoves: [], validAttacks: [], validAbilityTargets: [], activeAbilityId: null,
    isDraw: false,
  };

  // Check stalemate for the next player
  if (checkStalemate(nextState)) {
    return { ...nextState, phase: "draw", isDraw: true };
  }

  return nextState;
}

// ─── Win check ───────────────────────────────────────────────
function checkWin(state: GameState): Player | null {
  const wk = state.kingIds.white;
  const bk = state.kingIds.black;
  if (wk && !state.pieces[wk]) return "black";
  if (bk && !state.pieces[bk]) return "white";
  return null;
}

// ─── Stalemate check ─────────────────────────────────────────
// Returns true if the current player has NO valid moves or attacks.
// Chess rule: stalemate = draw.
function checkStalemate(state: GameState): boolean {
  const myPieces = Object.values(state.pieces).filter(
    p => p.owner === state.currentPlayer
  );
  const pieceMap = buildPieceMap(state.pieces);

  for (const piece of myPieces) {
    if (calcMoves(piece, pieceMap).length > 0) return false;
    if (calcAttacks(piece, pieceMap).length > 0) return false;
  }

  return true; // no moves and no attacks → stalemate
}

// ─── Public API ──────────────────────────────────────────────
export function createInitialState(whiteDeck: DeckConfig, blackDeck: DeckConfig): GameState {
  const board = createBoard();
  let pieces: Record<string, Piece> = {};
  const { pieces: p1, kingId: wk } = deployDeck(whiteDeck, "white", pieces);
  pieces = p1;
  const { pieces: p2, kingId: bk } = deployDeck(blackDeck, "black", pieces);
  pieces = p2;

  // If either deck is missing a king, the game cannot be played properly.
  // Show an immediate win for the player who HAS a king, or null if both missing.
  let startWinner: Player | null = null;
  if (!wk && bk) startWinner = "white";  // white has no king → black wins
  if (wk && !bk) startWinner = "black";  // black has no king → white wins

  return {
    phase: startWinner ? "ended" : "battle",
    currentPlayer: "white", turnNumber: 1,
    board: syncBoard(board, pieces), pieces,
    selectedPieceId: null, validMoves: [], validAttacks: [],
    validAbilityTargets: [], activeAbilityId: null,
    kingIds: { white: wk, black: bk }, history: [],
    winner: startWinner,
    isDraw: false,
  };
}

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {

    case "SELECT_PIECE": {
      if (state.phase !== "battle") return state;
      const piece = state.pieces[action.pieceId];
      if (!piece || piece.owner !== state.currentPlayer || piece.hasActed) return state;
      const pieceMap = buildPieceMap(state.pieces);
      const moves   = calcMoves(piece, pieceMap);
      const attacks = calcAttacks(piece, pieceMap);

      // Auto-merge ability targets for King (swap) / Queen (teleport) — no activation step needed
      let abilityTargets: Coord[] = [];
      let abilityId: string | null = null;
      const autoAbility = piece.abilities.find(
        a => (a.id === "royal_swap" || a.id === "royal_teleport") && a.currentCooldown === 0
      );
      if (autoAbility) {
        abilityTargets = calcAbilityTargets(piece, autoAbility.id, state.pieces);
        abilityId = autoAbility.id;
      }

      return {
        ...state, selectedPieceId: piece.id,
        validMoves: moves, validAttacks: attacks,
        validAbilityTargets: abilityTargets, activeAbilityId: abilityId,
        board: applyHighlights(clearHighlights(state.board), piece.position, moves, attacks, abilityTargets),
      };
    }

    case "DESELECT":
      return {
        ...state, selectedPieceId: null,
        validMoves: [], validAttacks: [], validAbilityTargets: [], activeAbilityId: null,
        board: clearHighlights(state.board),
      };

    // ── Activate an ability: enters "pick a target" mode ─────
    case "ACTIVATE_ABILITY": {
      if (!state.selectedPieceId || state.phase !== "battle") return state;
      const piece = state.pieces[state.selectedPieceId];
      if (!piece || piece.hasActed) return state;

      const ability = piece.abilities.find(a => a.id === action.abilityId);
      if (!ability || ability.currentCooldown > 0) return state;

      // Only Royal Swap & Royal Teleport need manual target selection
      if (action.abilityId !== "royal_swap" && action.abilityId !== "royal_teleport") {
        return state;
      }

      const targets = calcAbilityTargets(piece, action.abilityId, state.pieces);
      if (targets.length === 0) return state; // no valid targets, can't activate

      return {
        ...state,
        activeAbilityId: action.abilityId,
        validAbilityTargets: targets,
        validMoves: [], validAttacks: [],
        board: applyHighlights(clearHighlights(state.board), piece.position, [], [], targets),
      };
    }

    // ── Execute the active ability on a chosen target ────────
    case "USE_ABILITY": {
      if (!state.selectedPieceId || !state.activeAbilityId || state.phase !== "battle") return state;
      const piece = state.pieces[state.selectedPieceId];
      if (!piece || piece.hasActed) return state;
      if (!state.validAbilityTargets.some(t => coordsEqual(t, action.target))) return state;

      const abilityId = state.activeAbilityId;
      const ability = piece.abilities.find(a => a.id === abilityId)!;

      let newPieces = { ...state.pieces };
      let record: TurnRecord;

      if (abilityId === "royal_swap") {
        // Find the friendly piece standing on the target tile
        const partner = Object.values(state.pieces).find(
          p => coordsEqual(p.position, action.target) && p.owner === piece.owner
        );
        if (!partner) return state;

        newPieces[piece.id]   = { ...piece, position: partner.position, hasActed: true };
        newPieces[partner.id] = { ...partner, position: piece.position };

        record = {
          turn: state.turnNumber, player: state.currentPlayer,
          action: "attack", pieceId: piece.id, pieceDefinitionId: piece.definitionId,
          from: piece.position, to: partner.position,
        };
      } else if (abilityId === "royal_teleport") {
        newPieces[piece.id] = { ...piece, position: action.target, hasActed: true };

        record = {
          turn: state.turnNumber, player: state.currentPlayer,
          action: "move", pieceId: piece.id, pieceDefinitionId: piece.definitionId,
          from: piece.position, to: action.target,
        };
      } else {
        return state; // unsupported ability via this path
      }

      // Put ability on cooldown
      newPieces[piece.id] = {
        ...newPieces[piece.id],
        abilities: newPieces[piece.id].abilities.map(a =>
          a.id === abilityId ? { ...a, currentCooldown: ability.cooldown } : a
        ),
      };

      const next = switchPlayer({ ...state, pieces: newPieces, history: [...state.history, record] });
      return { ...next, winner: checkWin(next) };
    }

    case "MOVE_PIECE": {
      if (!state.selectedPieceId || state.phase !== "battle") return state;
      const piece = state.pieces[state.selectedPieceId];
      if (!piece || piece.hasActed) return state;
      if (!state.validMoves.some(m => coordsEqual(m, action.to))) return state;

      let dest = action.to;
      const destTile = state.board[dest.row][dest.col];
      if (destTile.effect === "portal" && destTile.portalTarget) {
        const pt = destTile.portalTarget;
        if (!state.board[pt.row][pt.col].pieceId) dest = pt;
      }

      const moved: Piece = { ...piece, position: dest, hasActed: true };

      const record: TurnRecord = {
        turn: state.turnNumber, player: state.currentPlayer,
        action: "move", pieceId: piece.id,
        pieceDefinitionId: piece.definitionId,
        from: piece.position, to: dest,
      };
      const newPieces = { ...state.pieces, [piece.id]: moved };
      const next = switchPlayer({ ...state, pieces: newPieces, history: [...state.history, record] });
      return { ...next, winner: checkWin(next) };
    }

    case "ATTACK_PIECE": {
      if (!state.selectedPieceId || state.phase !== "battle") return state;
      const attacker = state.pieces[state.selectedPieceId];
      const defender = state.pieces[action.targetId];
      if (!attacker || !defender || attacker.hasActed) return state;
      if (!state.validAttacks.some(a => coordsEqual(a, defender.position))) return state;

      // ── Fortify (Void Rook) — block this attack once ──────
      if (effectiveDefId(defender) === "void_rook" && !defender.fortifyUsed) {
        const fortify = defender.abilities.find(a => a.id === "fortify");
        if (fortify) {
          // Consume Fortify: defender survives, attacker still uses its action
          const newPieces = {
            ...state.pieces,
            [defender.id]: { ...defender, fortifyUsed: true },
            [attacker.id]: { ...attacker, hasActed: true },
          };
          const record: TurnRecord = {
            turn: state.turnNumber, player: state.currentPlayer,
            action: "attack", pieceId: attacker.id,
            pieceDefinitionId: attacker.definitionId,
            from: attacker.position, to: defender.position,
            // No capturedPieceId — the attack was blocked
          };
          const next = switchPlayer({ ...state, pieces: newPieces, history: [...state.history, record] });
          return { ...next, winner: checkWin(next) };
        }
      }

      // ── Normal 1-hit capture — attacker moves into defender's tile ──
      const newPieces = { ...state.pieces };
      delete newPieces[defender.id];

      let updatedAttacker: Piece = {
        ...attacker, hasActed: true, position: defender.position,
      };

      // ── Soul Mimic (Iron Pawn) — disguise as the captured piece for 1 turn ──
      if (attacker.definitionId === "iron_pawn" && defender.definitionId !== "soul_king") {
        updatedAttacker = {
          ...updatedAttacker,
          baseDefinitionId: attacker.baseDefinitionId ?? attacker.definitionId,
          mimicDefinitionId: defender.definitionId,
          mimicRevertTurn: state.turnNumber + 2, // reverts at the start of attacker's NEXT turn
        };
      }

      newPieces[attacker.id] = updatedAttacker;

      const record: TurnRecord = {
        turn: state.turnNumber, player: state.currentPlayer,
        action: "attack", pieceId: attacker.id,
        pieceDefinitionId: attacker.definitionId,
        from: attacker.position, to: defender.position,
        capturedPieceId: defender.id,
        capturedDefinitionId: defender.definitionId,
      };

      // ── Flanking Strike (Arcane Knight) — move again after capturing ──
      if (attacker.definitionId === "arcane_knight") {
        const pieceMap = buildPieceMap(newPieces);
        const extraMoves = calcMoves({ ...updatedAttacker, hasActed: false }, pieceMap);
        const extraAttacks = calcAttacks({ ...updatedAttacker, hasActed: false }, pieceMap);

        if (extraMoves.length > 0 || extraAttacks.length > 0) {
          // Grant one more action — un-mark hasActed, stay selected, don't switch turn
          newPieces[attacker.id] = { ...updatedAttacker, hasActed: false };
          return {
            ...state,
            pieces: newPieces,
            selectedPieceId: attacker.id,
            validMoves: extraMoves,
            validAttacks: extraAttacks,
            validAbilityTargets: [], activeAbilityId: null,
            board: applyHighlights(
              syncBoard(clearHighlights(state.board), newPieces),
              updatedAttacker.position, extraMoves, extraAttacks, [],
            ),
            history: [...state.history, record],
            winner: checkWin({ ...state, pieces: newPieces }),
          };
        }
      }

      const next = switchPlayer({ ...state, pieces: newPieces, history: [...state.history, record] });
      const winner = checkWin(next);
      return { ...next, winner, phase: winner ? "ended" : next.phase };
    }

    // ── Watchdog recovery: AI got stuck, forcibly pass its turn ──
    case "FORCE_SKIP_TURN": {
      // Only act if we're still on the exact same player+turn the
      // watchdog was armed for — otherwise the game already moved on
      // normally and this is a stale timer firing late.
      if (state.currentPlayer !== action.player || state.turnNumber !== action.turn) {
        return state;
      }
      if (state.phase !== "battle") return state;

      const cleared: GameState = {
        ...state,
        selectedPieceId: null,
        validMoves: [], validAttacks: [], validAbilityTargets: [], activeAbilityId: null,
      };
      return switchPlayer(cleared);
    }

    default:
      return state;
  }
}