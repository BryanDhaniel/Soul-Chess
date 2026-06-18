// ============================================================
// SOULCHESS — Core Type Definitions
// ============================================================

export type Player = "white" | "black";
export type GamePhase = "battle" | "ended" | "draw";
export type ActionType = "move" | "attack";
export type TileHighlight = "none" | "selected" | "move" | "attack" | "ability" | "deploy";

// ─── Coordinate ──────────────────────────────────────────────
export interface Coord {
  row: number;
  col: number;
}

// ─── Movement Pattern ────────────────────────────────────────
export interface MovementPattern {
  directions: Array<[number, number, number]>; // [dr, dc, maxSteps] — 0 = unlimited
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

// ─── Piece Definition (static) ───────────────────────────────
export interface PieceDefinition {
  typeId: string;
  name: string;
  faction: string;
  description: string;
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
  position: Coord;
  hasActed: boolean;
  abilities: Ability[];
  buffs: Buff[];
}

// ─── Buff ────────────────────────────────────────────────────
export interface Buff {
  id: string;
  name: string;
  duration: number;     // -1 = permanent
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
// Slot now stores a free coord on the board, not a grid index.
// Both players share one deck; coords are stored as white-perspective
// (white zone = row 11-15). Engine mirrors for black.
export interface FormationSlot {
  coord: Coord;         // board coordinate in white's deploy zone (row 11-15)
  definitionId: string;
}

export interface DeckConfig {
  id: string;
  name: string;
  slots: FormationSlot[]; // up to 20
}

// ─── Turn Record ─────────────────────────────────────────────
export interface TurnRecord {
  turn: number;
  player: Player;
  action: ActionType;
  pieceId: string;
  pieceDefinitionId: string;   // definition of the moving piece
  from?: Coord;
  to?: Coord;
  capturedPieceId?: string;
  capturedDefinitionId?: string; // definition of captured piece (for display after removal)
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
  isDraw: boolean;
}

// ─── Actions ─────────────────────────────────────────────────
export type GameAction =
  | { type: "SELECT_PIECE"; pieceId: string }
  | { type: "MOVE_PIECE";   to: Coord }
  | { type: "ATTACK_PIECE"; targetId: string }
  | { type: "DESELECT" };