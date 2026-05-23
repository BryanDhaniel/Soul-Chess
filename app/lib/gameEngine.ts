// ============================================================
// SOULCHESS — Game Engine (Pure Reducer)
// ============================================================
// Turn rule: 1 action (move OR attack) → auto switch player.
// No manual "End Turn". No placement phase in battle.
// ============================================================
import type {
  GameState, GameAction, Piece, Tile, Player, Coord, TurnRecord, DeckConfig,
} from "../types/game";
import {
  createBoard, buildPieceMap, applyHighlights, clearHighlights,
  resolveAttack, coordKey, coordsEqual, GRID_SIZE, isInBounds, isInsideOctagon,
} from "./boardUtils";
import { getPieceDefinitionById } from "./pieceRegistry";

// ─── Piece Factory ───────────────────────────────────────────
let _counter = 0;
function makePiece(definitionId: string, owner: Player, position: Coord): Piece {
  const def = getPieceDefinitionById(definitionId);
  return {
    id: `${definitionId}_${owner}_${++_counter}`,
    definitionId,
    owner,
    hp: def.maxHp,
    maxHp: def.maxHp,
    attack: def.attack,
    defense: def.defense,
    position,
    hasActed: false,
    abilities: def.abilities.map(ab => ({ ...ab, currentCooldown: 0 })),
    buffs: [],
  };
}

// ─── Deploy Decks onto Board ─────────────────────────────────
// White deploys bottom zone: rows 10-13, cols mapped from slot grid (5×4)
// Black deploys top zone:    rows 2-5,  mirrored
function deployDeck(
  deck: DeckConfig,
  owner: Player,
  pieces: Record<string, Piece>,
  board: Tile[][]
): { pieces: Record<string, Piece>; kingId: string } {
  const newPieces = { ...pieces };
  let kingId = "";

  // Formation grid: 5 cols × 4 rows = 20 slots
  // slotIndex = row * 5 + col  (row 0 = back rank, row 3 = front rank)
  for (const slot of deck.slots) {
    const formRow = Math.floor(slot.slotIndex / 5); // 0-3
    const formCol = slot.slotIndex % 5;             // 0-4

    let boardRow: number;
    let boardCol: number;

    if (owner === "white") {
      // Rows 13 (back) → 10 (front), cols 6-10 (centre of 16-wide board)
      boardRow = 13 - formRow;
      boardCol = 6 + formCol;
    } else {
      // Rows 2 (back) → 5 (front), cols 6-10
      boardRow = 2 + formRow;
      boardCol = 6 + formCol;
    }

    // Skip if tile not inside octagon or already occupied
    if (!isInsideOctagon(boardRow, boardCol)) continue;
    const tileKey = coordKey({ row: boardRow, col: boardCol });
    const occupied = Object.values(newPieces).some(p =>
      p.position.row === boardRow && p.position.col === boardCol
    );
    if (occupied) continue;

    const piece = makePiece(slot.definitionId, owner, { row: boardRow, col: boardCol });
    newPieces[piece.id] = piece;
    if (slot.definitionId === "soul_king") kingId = piece.id;
  }

  return { pieces: newPieces, kingId };
}

// ─── Board Sync ───────────────────────────────────────────────
function syncBoard(board: Tile[][], pieces: Record<string, Piece>): Tile[][] {
  const next = board.map(r => r.map(t => ({ ...t, pieceId: undefined })));
  for (const p of Object.values(pieces)) {
    next[p.position.row][p.position.col] = { ...next[p.position.row][p.position.col], pieceId: p.id };
  }
  return next;
}

// ─── Movement Calculation ────────────────────────────────────
function ownerDir(owner: Player) { return owner === "white" ? -1 : 1; }

function calcMoves(piece: Piece, pieceMap: Map<string, Piece>): Coord[] {
  const def = getPieceDefinitionById(piece.definitionId);
  const flip = piece.definitionId === "iron_pawn" ? ownerDir(piece.owner) : 1;
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
  const def = getPieceDefinitionById(piece.definitionId);
  const flip = piece.definitionId === "iron_pawn" ? ownerDir(piece.owner) : 1;
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

  // Iron Pawn attacks diagonally forward only
  if (piece.definitionId === "iron_pawn") {
    const dir = ownerDir(piece.owner);
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

// ─── Tile stat mods ──────────────────────────────────────────
function tileMods(tile: Tile) {
  switch (tile.effect) {
    case "amplify": return { atk: 1, def: 0 };
    case "shield":  return { atk: 0, def: 1 };
    case "cursed":  return { atk: -1, def: -1 };
    default:        return { atk: 0, def: 0 };
  }
}

// ─── Auto switch player after 1 action ───────────────────────
function switchPlayer(state: GameState): GameState {
  const next: Player = state.currentPlayer === "white" ? "black" : "white";
  const newTurn = next === "white" ? state.turnNumber + 1 : state.turnNumber;

  // Tick cooldowns for ALL pieces
  const newPieces: Record<string, Piece> = {};
  for (const [id, p] of Object.entries(state.pieces)) {
    newPieces[id] = {
      ...p,
      hasActed: false,
      buffs: p.buffs
        .map(b => ({ ...b, duration: b.duration === -1 ? -1 : b.duration - 1 }))
        .filter(b => b.duration !== 0),
      abilities: p.abilities.map(ab => ({
        ...ab,
        currentCooldown: Math.max(0, ab.currentCooldown - 1),
      })),
    };
  }

  const newBoard = syncBoard(clearHighlights(state.board), newPieces);

  return {
    ...state,
    currentPlayer: next,
    turnNumber: newTurn,
    pieces: newPieces,
    board: newBoard,
    selectedPieceId: null,
    validMoves: [],
    validAttacks: [],
    validAbilityTargets: [],
    activeAbilityId: null,
  };
}

// ─── Win check ────────────────────────────────────────────────
function checkWin(state: GameState): Player | null {
  if (state.kingIds.white && !state.pieces[state.kingIds.white]) return "black";
  if (state.kingIds.black && !state.pieces[state.kingIds.black]) return "white";
  return null;
}

// ─── Initial State ────────────────────────────────────────────
export function createInitialState(
  whiteDeck: DeckConfig,
  blackDeck: DeckConfig
): GameState {
  const board = createBoard();
  let pieces: Record<string, Piece> = {};

  const { pieces: p1, kingId: wk } = deployDeck(whiteDeck, "white", pieces, board);
  pieces = p1;
  const { pieces: p2, kingId: bk } = deployDeck(blackDeck, "black", pieces, board);
  pieces = p2;

  const synced = syncBoard(board, pieces);

  return {
    phase: "battle",
    currentPlayer: "white",
    turnNumber: 1,
    board: synced,
    pieces,
    selectedPieceId: null,
    validMoves: [],
    validAttacks: [],
    validAbilityTargets: [],
    activeAbilityId: null,
    kingIds: { white: wk, black: bk },
    history: [],
    winner: null,
  };
}

// ─── Main Reducer ─────────────────────────────────────────────
export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {

    // ── SELECT PIECE ────────────────────────────────────────
    case "SELECT_PIECE": {
      const piece = state.pieces[action.pieceId];
      if (!piece || piece.owner !== state.currentPlayer || piece.hasActed) return state;

      const pieceMap = buildPieceMap(state.pieces);
      const moves   = calcMoves(piece, pieceMap);
      const attacks = calcAttacks(piece, pieceMap);

      const board = applyHighlights(
        clearHighlights(state.board),
        piece.position, moves, attacks, []
      );

      return { ...state, selectedPieceId: piece.id, validMoves: moves, validAttacks: attacks, board };
    }

    // ── DESELECT ────────────────────────────────────────────
    case "DESELECT":
      return {
        ...state,
        selectedPieceId: null,
        validMoves: [], validAttacks: [], validAbilityTargets: [],
        board: clearHighlights(state.board),
      };

    // ── MOVE PIECE → auto switch ─────────────────────────────
    case "MOVE_PIECE": {
      if (!state.selectedPieceId) return state;
      const piece = state.pieces[state.selectedPieceId];
      if (!piece || piece.hasActed) return state;
      if (!state.validMoves.some(m => coordsEqual(m, action.to))) return state;

      // Portal check
      let dest = action.to;
      const destTile = state.board[dest.row][dest.col];
      if (destTile.effect === "portal" && destTile.portalTarget) {
        const pt = destTile.portalTarget;
        if (!state.board[pt.row][pt.col].pieceId) dest = pt;
      }

      const moved: Piece = { ...piece, position: dest, hasActed: true };

      // Sacred tile heal
      const landTile = state.board[dest.row][dest.col];
      const healed = landTile.effect === "sacred" && moved.maxHp > 0
        ? { ...moved, hp: Math.min(moved.maxHp, moved.hp + 1) }
        : moved;

      const record: TurnRecord = {
        turn: state.turnNumber, player: state.currentPlayer,
        action: "move", pieceId: piece.id, from: piece.position, to: dest,
      };

      const newPieces = { ...state.pieces, [piece.id]: healed };
      const next = switchPlayer({ ...state, pieces: newPieces, history: [...state.history, record] });
      return { ...next, winner: checkWin(next) };
    }

    // ── ATTACK PIECE → auto switch ───────────────────────────
    case "ATTACK_PIECE": {
      if (!state.selectedPieceId) return state;
      const attacker = state.pieces[state.selectedPieceId];
      const defender = state.pieces[action.targetId];
      if (!attacker || !defender || attacker.hasActed) return state;
      if (!state.validAttacks.some(a => coordsEqual(a, defender.position))) return state;

      const atkTile = state.board[attacker.position.row][attacker.position.col];
      const defTile = state.board[defender.position.row][defender.position.col];
      const am = tileMods(atkTile);
      const dm = tileMods(defTile);
      const atkBuffMod = attacker.buffs.reduce((s, b) => s + b.attackMod, 0);
      const defBuffMod = defender.buffs.reduce((s, b) => s + b.defenseMod, 0);

      const effAtk = { ...attacker, attack: attacker.attack + am.atk + atkBuffMod };
      const effDef = { ...defender, defense: Math.max(0, defender.defense + dm.def + defBuffMod) };

      const { damage, isLethal } = resolveAttack(effAtk, effDef);

      const newPieces = { ...state.pieces };
      isLethal
        ? delete newPieces[defender.id]
        : (newPieces[defender.id] = { ...defender, hp: defender.hp - damage });
      newPieces[attacker.id] = { ...attacker, hasActed: true };

      const record: TurnRecord = {
        turn: state.turnNumber, player: state.currentPlayer,
        action: "attack", pieceId: attacker.id,
        from: attacker.position, to: defender.position,
        damage, capturedPieceId: isLethal ? defender.id : undefined,
      };

      const next = switchPlayer({ ...state, pieces: newPieces, history: [...state.history, record] });
      const winner = checkWin(next);
      return { ...next, winner, phase: winner ? "ended" : next.phase };
    }

    default:
      return state;
  }
}