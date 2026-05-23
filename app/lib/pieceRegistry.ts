// ============================================================
// SOULCHESS — Piece Registry (Starter Set)
// ============================================================
// 10 unique piece types to bootstrap the game.
// Each has a distinct movement pattern, HP tier, and ability.
// ============================================================
import type { PieceDefinition, Ability, AbilityContext, GameState } from "../types/game";
import { registerDefinitionGetter } from "./boardUtils";

// ─── Ability Helpers ─────────────────────────────────────────

function noOp(ctx: AbilityContext): GameState { return ctx.state; }

// ─── Piece Definitions ───────────────────────────────────────

const DEFINITIONS: PieceDefinition[] = [

  // ── 1. SOUL KING ─────────────────────────────────────────
  // Win condition piece. Moves 1 in any direction. Survives hits (HP).
  {
    typeId: "soul_king",
    name: "Soul King",
    faction: "Arcane",
    description: "The linchpin of your army. Capture the enemy King to win.",
    maxHp: 5,
    attack: 2,
    defense: 2,
    tier: 3,
    symbol: "♔",
    movement: {
      directions: [
        [-1,-1,1],[-1,0,1],[-1,1,1],
        [ 0,-1,1],          [ 0,1,1],
        [ 1,-1,1],[ 1,0,1],[ 1,1,1],
      ],
      canLeap: false,
    },
    abilities: [
      {
        id: "royal_guard",
        name: "Royal Guard",
        description: "Gain +2 defense for 1 turn.",
        cooldown: 3,
        apCost: 0,
        range: 0,
        effect: (ctx) => {
          const king = { ...ctx.caster };
          king.buffs = [...king.buffs, { id: "royal_guard_buff", name: "Royal Guard", duration: 1, attackMod: 0, defenseMod: 2, movementMod: 0 }];
          return { ...ctx.state, pieces: { ...ctx.state.pieces, [king.id]: king } };
        },
      },
    ],
  },

  // ── 2. ARCANE KNIGHT ─────────────────────────────────────
  // L-shaped leap like a chess knight. One-shot capture (no HP).
  {
    typeId: "arcane_knight",
    name: "Arcane Knight",
    faction: "Arcane",
    description: "Leaps over pieces in an L-shape. Instant capture on contact.",
    maxHp: 0,  // chess-mode: one-shot
    attack: 3,
    defense: 0,
    tier: 1,
    symbol: "♞",
    movement: {
      directions: [
        [-2,-1,1],[-2,1,1],
        [-1,-2,1],[-1,2,1],
        [ 1,-2,1],[ 1,2,1],
        [ 2,-1,1],[ 2,1,1],
      ],
      canLeap: true,
    },
    abilities: [
      {
        id: "arcane_dash",
        name: "Arcane Dash",
        description: "Move up to 3 tiles in a straight line regardless of pieces.",
        cooldown: 2,
        apCost: 0,
        range: 3,
        effect: noOp, // implemented in game engine
      },
    ],
  },

  // ── 3. VOID ROOK ─────────────────────────────────────────
  // Slides orthogonally. Has HP — hard to kill.
  {
    typeId: "void_rook",
    name: "Void Rook",
    faction: "Void",
    description: "A hulking siege engine. Slides in straight lines, absorbs punishment.",
    maxHp: 8,
    attack: 4,
    defense: 3,
    tier: 2,
    symbol: "♜",
    movement: {
      directions: [
        [-1,0,0],[1,0,0],[0,-1,0],[0,1,0], // unlimited orthogonal
      ],
      canLeap: false,
    },
    abilities: [
      {
        id: "siege_pulse",
        name: "Siege Pulse",
        description: "Deal 2 damage to all enemies in the same row or column.",
        cooldown: 4,
        apCost: 0,
        range: 0,
        effect: noOp,
      },
    ],
  },

  // ── 4. WRAITH BISHOP ─────────────────────────────────────
  // Slides diagonally. One-shot, but high attack.
  {
    typeId: "wraith_bishop",
    name: "Wraith Bishop",
    faction: "Void",
    description: "Drifts diagonally across the board. Destroys on contact.",
    maxHp: 0,
    attack: 5,
    defense: 0,
    tier: 1,
    symbol: "♝",
    movement: {
      directions: [
        [-1,-1,0],[-1,1,0],[1,-1,0],[1,1,0], // unlimited diagonal
      ],
      canLeap: false,
    },
    abilities: [
      {
        id: "phase_shift",
        name: "Phase Shift",
        description: "Pass through one piece when moving this turn.",
        cooldown: 3,
        apCost: 0,
        range: 0,
        effect: noOp,
      },
    ],
  },

  // ── 5. STORM MAGE ────────────────────────────────────────
  // Moves like a queen (any direction, unlimited) but only 3 steps.
  // Has HP. Ranged feel via long movement.
  {
    typeId: "storm_mage",
    name: "Storm Mage",
    faction: "Arcane",
    description: "Commands the storm. Moves in any direction up to 3 squares.",
    maxHp: 4,
    attack: 3,
    defense: 1,
    tier: 2,
    symbol: "✦",
    movement: {
      directions: [
        [-1,-1,3],[-1,0,3],[-1,1,3],
        [ 0,-1,3],          [ 0,1,3],
        [ 1,-1,3],[ 1,0,3],[ 1,1,3],
      ],
      canLeap: false,
    },
    abilities: [
      {
        id: "lightning_bolt",
        name: "Lightning Bolt",
        description: "Strike target tile for 3 damage. Range 4.",
        cooldown: 3,
        apCost: 0,
        range: 4,
        effect: noOp,
      },
    ],
  },

  // ── 6. IRON PAWN ─────────────────────────────────────────
  // Moves forward 1, attacks diagonally forward. Has some HP.
  {
    typeId: "iron_pawn",
    name: "Iron Pawn",
    faction: "Iron",
    description: "The backbone of every army. Marches forward, strikes diagonal.",
    maxHp: 3,
    attack: 2,
    defense: 1,
    tier: 1,
    symbol: "♟",
    movement: {
      // white moves up (row - 1), black moves down (row + 1)
      // Direction will be flipped per owner in the engine
      directions: [
        [-1, 0, 1], // forward
      ],
      canLeap: false,
    },
    abilities: [
      {
        id: "shield_wall",
        name: "Shield Wall",
        description: "Adjacent friendly pawns gain +1 defense.",
        cooldown: 2,
        apCost: 0,
        range: 1,
        effect: noOp,
      },
    ],
  },

  // ── 7. SOULBOUND QUEEN ───────────────────────────────────
  // Full queen movement (unlimited, all 8 directions). Chess-mode.
  {
    typeId: "soulbound_queen",
    name: "Soulbound Queen",
    faction: "Arcane",
    description: "The most powerful piece. Unlimited movement, devastating capture.",
    maxHp: 0,
    attack: 6,
    defense: 0,
    tier: 3,
    symbol: "♛",
    movement: {
      directions: [
        [-1,-1,0],[-1,0,0],[-1,1,0],
        [ 0,-1,0],          [ 0,1,0],
        [ 1,-1,0],[ 1,0,0],[ 1,1,0],
      ],
      canLeap: false,
    },
    abilities: [
      {
        id: "soul_shatter",
        name: "Soul Shatter",
        description: "Destroy target piece regardless of HP or defense.",
        cooldown: 5,
        apCost: 0,
        range: 3,
        effect: noOp,
      },
    ],
  },

  // ── 8. EMBER DRAKE ───────────────────────────────────────
  // Moves diagonally OR 2 forward. High HP, medium attack.
  {
    typeId: "ember_drake",
    name: "Ember Drake",
    faction: "Fire",
    description: "A scaled beast. Charges forward or circles prey diagonally.",
    maxHp: 6,
    attack: 3,
    defense: 2,
    tier: 2,
    symbol: "🐉",
    movement: {
      directions: [
        [-2,0,1],           // charge forward 2
        [-1,-1,2],[-1,1,2], // diagonal up to 2
        [ 1,-1,2],[ 1,1,2], // diagonal backwards up to 2
      ],
      canLeap: false,
    },
    abilities: [
      {
        id: "flame_breath",
        name: "Flame Breath",
        description: "Deal 2 damage to all pieces in a 3-tile forward cone.",
        cooldown: 3,
        apCost: 0,
        range: 3,
        effect: noOp,
      },
    ],
  },

  // ── 9. PHANTOM ASSASSIN ──────────────────────────────────
  // Moves 1-2 in any direction. Ignores defense. Low HP.
  {
    typeId: "phantom_assassin",
    name: "Phantom Assassin",
    faction: "Void",
    description: "Slips through defenses. Strikes true — bypasses armor.",
    maxHp: 2,
    attack: 4,
    defense: 0,
    tier: 2,
    symbol: "☽",
    movement: {
      directions: [
        [-2,-2,1],[-2,0,1],[-2,2,1],
        [-1,-1,1],[-1,0,1],[-1,1,1],
        [ 0,-2,1],          [ 0,2,1],
        [ 1,-1,1],[ 1,0,1],[ 1,1,1],
        [ 2,-2,1],[ 2,0,1],[ 2,2,1],
      ],
      canLeap: true,
    },
    abilities: [
      {
        id: "shadow_step",
        name: "Shadow Step",
        description: "Teleport to any empty tile within 4 squares.",
        cooldown: 3,
        apCost: 0,
        range: 4,
        effect: noOp,
      },
    ],
  },

  // ── 10. STONE SENTINEL ───────────────────────────────────
  // Immovable (0 move range). Very high HP & defense. Acts as a wall.
  {
    typeId: "stone_sentinel",
    name: "Stone Sentinel",
    faction: "Iron",
    description: "Cannot move. Provides a nearly-impenetrable wall.",
    maxHp: 12,
    attack: 2,
    defense: 5,
    tier: 2,
    symbol: "⬡",
    movement: {
      directions: [], // cannot move
      canLeap: false,
    },
    abilities: [
      {
        id: "taunt",
        name: "Taunt",
        description: "Enemy pieces adjacent to this sentinel cannot move away for 1 turn.",
        cooldown: 4,
        apCost: 0,
        range: 1,
        effect: noOp,
      },
    ],
  },
];

// ─── Registry Map ─────────────────────────────────────────────
const DEFINITION_MAP = new Map<string, PieceDefinition>(
  DEFINITIONS.map(d => [d.typeId, d])
);

export function getPieceDefinitionById(typeId: string): PieceDefinition {
  const def = DEFINITION_MAP.get(typeId);
  if (!def) throw new Error(`Unknown piece type: ${typeId}`);
  return def;
}

export function getAllDefinitions(): PieceDefinition[] {
  return DEFINITIONS;
}

// Register the getter with boardUtils to avoid circular imports
registerDefinitionGetter((id) => {
  const def = getPieceDefinitionById(id);
  return { movement: def.movement, maxHp: def.maxHp };
});