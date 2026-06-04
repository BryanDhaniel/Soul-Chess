// ============================================================
// SOULCHESS — Game Engine (Pure Reducer)
// ============================================================
import type {
  GameState, GameAction, Piece, Tile, Player, Coord, TurnRecord, DeckConfig,
} from "../types/game";
import {
  createBoard, buildPieceMap, applyHighlights, clearHighlights,
  resolveAttack, coordKey, coordsEqual, isInBounds, isInsideOctagon, GRID_SIZE,
} from "./boardUtils";
import { getPieceDefinitionById } from "./pieceRegistry";

// ─── Piece factory ───────────────────────────────────────────
let _uid = 0;
function makePiece(definitionId: string, owner: Player, position: Coord): Piece {
  const def = getPieceDefinitionById(definitionId);
  return {
    id: `${definitionId}_${owner}_${++_uid}`,
    definitionId, owner,
    hp: def.maxHp, maxHp: def.maxHp,
    attack: def.attack, defense: def.defense,
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
function pawnDir(owner: Player) { return owner === "white" ? -1 : 1; }

function calcMoves(piece: Piece, pieceMap: Map<string, Piece>): Coord[] {
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

function calcAttacks(piece: Piece, pieceMap: Map<string, Piece>): Coord[] {
  const def  = getPieceDefinitionById(piece.definitionId);
  const flip = piece.definitionId === "iron_pawn" ? pawnDir(piece.owner) : 1;
  const valid: Coord[] = [];

  for (const [dr, dc, maxSteps] of def.movement.directions) {
    const steps = maxSteps === 0 ? GRID_SIZE : maxSteps;
    for (let s = 1; s <= steps; s++) {
      const r = piece.position.row + dr * flip * s;
      const c = piece.position.col + dc * s;
      if (!isInBounds(r, c) || !isInsideOctagon(r, c)) break;
      const target = pieceMap.get(coordKey({ row: r, col: c }));
      if (target) {
        if (target.owner !== piece.owner) valid.push({ row: r, col: c });
        if (!def.movement.canLeap) break;
      }
    }
  }

  // Pawn: diagonal forward attacks only
  if (piece.definitionId === "iron_pawn") {
    const dir = pawnDir(piece.owner);
    for (const dc of [-1, 1]) {
      const r = piece.position.row + dir;
      const c = piece.position.col + dc;
      if (!isInBounds(r, c) || !isInsideOctagon(r, c)) continue;
      const t = pieceMap.get(coordKey({ row: r, col: c }));
      if (t && t.owner !== piece.owner) valid.push({ row: r, col: c });
    }
  }
  return valid;
}

// ─── Tile mods ───────────────────────────────────────────────
function tileMods(tile: Tile) {
  switch (tile.effect) {
    case "amplify": return { atk:  1, def:  0 };
    case "shield":  return { atk:  0, def:  1 };
    case "cursed":  return { atk: -1, def: -1 };
    default:        return { atk:  0, def:  0 };
  }
}

// ─── Auto-switch ─────────────────────────────────────────────
function switchPlayer(state: GameState): GameState {
  const next: Player = state.currentPlayer === "white" ? "black" : "white";
  const newPieces: Record<string, Piece> = {};
  for (const [id, p] of Object.entries(state.pieces)) {
    newPieces[id] = {
      ...p, hasActed: false,
      buffs: p.buffs
        .map(b => ({ ...b, duration: b.duration === -1 ? -1 : b.duration - 1 }))
        .filter(b => b.duration !== 0),
      abilities: p.abilities.map(ab => ({
        ...ab, currentCooldown: Math.max(0, ab.currentCooldown - 1),
      })),
    };
  }
  return {
    ...state,
    currentPlayer: next,
    turnNumber: next === "white" ? state.turnNumber + 1 : state.turnNumber,
    pieces: newPieces,
    board: syncBoard(clearHighlights(state.board), newPieces),
    selectedPieceId: null,
    validMoves: [], validAttacks: [], validAbilityTargets: [], activeAbilityId: null,
  };
}

// ─── Win check ───────────────────────────────────────────────
// kingId === "" means king was never placed (invalid deck) — not a win condition.
// kingId !== "" but not in pieces means king was captured → opponent wins.
function checkWin(state: GameState): Player | null {
  const wk = state.kingIds.white;
  const bk = state.kingIds.black;
  // White king captured → black wins
  if (wk && !state.pieces[wk]) return "black";
  // Black king captured → white wins
  if (bk && !state.pieces[bk]) return "white";
  return null;
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
      return {
        ...state, selectedPieceId: piece.id,
        validMoves: moves, validAttacks: attacks,
        board: applyHighlights(clearHighlights(state.board), piece.position, moves, attacks, []),
      };
    }

    case "DESELECT":
      return {
        ...state, selectedPieceId: null,
        validMoves: [], validAttacks: [], validAbilityTargets: [],
        board: clearHighlights(state.board),
      };

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

      let moved: Piece = { ...piece, position: dest, hasActed: true };
      const landTile = state.board[dest.row][dest.col];
      if (landTile.effect === "sacred" && moved.maxHp > 0) {
        moved = { ...moved, hp: Math.min(moved.maxHp, moved.hp + 1) };
      }

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

      const am = tileMods(state.board[attacker.position.row][attacker.position.col]);
      const dm = tileMods(state.board[defender.position.row][defender.position.col]);
      const atkBuff = attacker.buffs.reduce((s, b) => s + b.attackMod, 0);
      const defBuff = defender.buffs.reduce((s, b) => s + b.defenseMod, 0);

      const effAtk = { ...attacker, attack:  attacker.attack + am.atk + atkBuff };
      const effDef = { ...defender, defense: Math.max(0, defender.defense + dm.def + defBuff) };
      const { damage, isLethal } = resolveAttack(effAtk, effDef);

      const newPieces = { ...state.pieces };
      if (isLethal) delete newPieces[defender.id];
      else newPieces[defender.id] = { ...defender, hp: defender.hp - damage };
      newPieces[attacker.id] = { ...attacker, hasActed: true };

      const record: TurnRecord = {
        turn: state.turnNumber, player: state.currentPlayer,
        action: "attack", pieceId: attacker.id,
        pieceDefinitionId: attacker.definitionId,
        from: attacker.position, to: defender.position,
        damage,
        capturedPieceId: isLethal ? defender.id : undefined,
        capturedDefinitionId: isLethal ? defender.definitionId : undefined,
      };
      const next = switchPlayer({ ...state, pieces: newPieces, history: [...state.history, record] });
      const winner = checkWin(next);
      return { ...next, winner, phase: winner ? "ended" : next.phase };
    }

    default:
      return state;
  }
}