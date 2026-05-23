// ============================================================
// SOULCHESS — Core Type Definitions (canonical, v2)
// ============================================================

export type Player = "white" | "black";
export type GamePhase = "battle" | "ended";
export type ActionType = "move" | "attack";
export type TileHighlight = "none" | "selected" | "move" | "attack" | "ability";

// ─── Coordinate ──────────────────────────────────────────────
export interface Coord {
  row: number;
  col: number;
}

// ─── Movement Pattern ────────────────────────────────────────
// [deltaRow, deltaCol, maxSteps]  — 0 = unlimited slider
export interface MovementPattern {
  directions: Array<[number, number, number]>;
  canLeap: boolean;
}

// ─── Ability ─────────────────────────────────────────────────
export interface Ability {
  id: string;
  name: string;
  description: string;
  cooldown: number;
  currentCooldown: number;
  range: number;
}

// ─── Piece Definition (static data in registry) ──────────────
export interface PieceDefinition {
  typeId: string;
  name: string;
  faction: string;
  description: string;
  maxHp: number;        // 0 = chess-mode one-shot
  attack: number;
  defense: number;
  movement: MovementPattern;
  abilities: Omit<Ability, "currentCooldown">[];
  symbol: string;
  tier: 1 | 2 | 3;
}

// ─── Piece Instance (runtime) ────────────────────────────────
export interface Piece {
  id: string;
  definitionId: string;
  owner: Player;
  hp: number;
  maxHp: number;
  attack: number;
  defense: number;
  position: Coord;
  hasActed: boolean;    // used its 1 action this turn
  abilities: Ability[];
  buffs: Buff[];
}

// ─── Buff ────────────────────────────────────────────────────
export interface Buff {
  id: string;
  name: string;
  duration: number;     // turns remaining; -1 = permanent
  attackMod: number;
  defenseMod: number;
  movementMod: number;
}

// ─── Tile ────────────────────────────────────────────────────
export type TileEffect = "none" | "amplify" | "shield" | "cursed" | "sacred" | "portal" | "trap";

export interface Tile {
  coord: Coord;
  isInside: boolean;
  isLight: boolean;
  effect: TileEffect;
  portalTarget?: Coord;
  highlight: TileHighlight;
  pieceId?: string;
}

// ─── Deck / Formation ────────────────────────────────────────
// slotIndex = row * 5 + col  (5 cols × 4 rows = 20 slots)
export interface FormationSlot {
  slotIndex: number;
  definitionId: string;
}

export interface DeckConfig {
  id: string;
  name: string;
  slots: FormationSlot[];
}

// ─── Turn Record ─────────────────────────────────────────────
export interface TurnRecord {
  turn: number;
  player: Player;
  action: ActionType;
  pieceId: string;
  from?: Coord;
  to?: Coord;
  damage?: number;
  capturedPieceId?: string;
}

// ─── Game State ──────────────────────────────────────────────
export interface GameState {
  phase: GamePhase;
  currentPlayer: Player;
  turnNumber: number;
  board: Tile[][];
  pieces: Record<string, Piece>;
  selectedPieceId: string | null;
  validMoves: Coord[];
  validAttacks: Coord[];
  validAbilityTargets: Coord[];
  activeAbilityId: string | null;
  kingIds: Record<Player, string>;
  history: TurnRecord[];
  winner: Player | null;
}

// ─── Actions ─────────────────────────────────────────────────
export type GameAction =
  | { type: "SELECT_PIECE"; pieceId: string }
  | { type: "MOVE_PIECE";   to: Coord }
  | { type: "ATTACK_PIECE"; targetId: string }
  | { type: "DESELECT" };