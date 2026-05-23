// ============================================================
// SOULCHESS — Piece Registry (10 starter types)
// ============================================================
import type { PieceDefinition } from "../types/game";

const DEFINITIONS: PieceDefinition[] = [

  // 1. SOUL KING ─────────────────────────────────────────────
  {
    typeId: "soul_king", name: "Soul King", faction: "Arcane", tier: 3,
    description: "The linchpin of your army. Capture the enemy King to win.",
    maxHp: 5, attack: 2, defense: 2, symbol: "♔",
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
        id: "royal_guard", name: "Royal Guard",
        description: "Gain +2 defense for 1 turn.",
        cooldown: 3, range: 0,
      },
    ],
  },

  // 2. ARCANE KNIGHT ─────────────────────────────────────────
  {
    typeId: "arcane_knight", name: "Arcane Knight", faction: "Arcane", tier: 1,
    description: "Leaps over pieces in an L-shape. Instant capture on contact.",
    maxHp: 0, attack: 3, defense: 0, symbol: "♞",
    movement: {
      directions: [
        [-2,-1,1],[-2,1,1],[-1,-2,1],[-1,2,1],
        [ 1,-2,1],[ 1,2,1],[ 2,-1,1],[ 2,1,1],
      ],
      canLeap: true,
    },
    abilities: [
      {
        id: "arcane_dash", name: "Arcane Dash",
        description: "Move up to 3 tiles in a straight line, leaping over obstacles.",
        cooldown: 2, range: 3,
      },
    ],
  },

  // 3. VOID ROOK ──────────────────────────────────────────────
  {
    typeId: "void_rook", name: "Void Rook", faction: "Void", tier: 2,
    description: "A hulking siege engine. Slides orthogonally, absorbs punishment.",
    maxHp: 8, attack: 4, defense: 3, symbol: "♜",
    movement: {
      directions: [[-1,0,0],[1,0,0],[0,-1,0],[0,1,0]],
      canLeap: false,
    },
    abilities: [
      {
        id: "siege_pulse", name: "Siege Pulse",
        description: "Deal 2 damage to all enemies in the same row or column.",
        cooldown: 4, range: 0,
      },
    ],
  },

  // 4. WRAITH BISHOP ─────────────────────────────────────────
  {
    typeId: "wraith_bishop", name: "Wraith Bishop", faction: "Void", tier: 1,
    description: "Drifts diagonally across the board. Destroys on contact.",
    maxHp: 0, attack: 5, defense: 0, symbol: "♝",
    movement: {
      directions: [[-1,-1,0],[-1,1,0],[1,-1,0],[1,1,0]],
      canLeap: false,
    },
    abilities: [
      {
        id: "phase_shift", name: "Phase Shift",
        description: "Pass through one piece when moving this turn.",
        cooldown: 3, range: 0,
      },
    ],
  },

  // 5. STORM MAGE ────────────────────────────────────────────
  {
    typeId: "storm_mage", name: "Storm Mage", faction: "Arcane", tier: 2,
    description: "Commands the storm. Moves in any direction up to 3 squares.",
    maxHp: 4, attack: 3, defense: 1, symbol: "✦",
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
        id: "lightning_bolt", name: "Lightning Bolt",
        description: "Strike a target tile within range 4 for 3 damage.",
        cooldown: 3, range: 4,
      },
    ],
  },

  // 6. IRON PAWN ─────────────────────────────────────────────
  {
    typeId: "iron_pawn", name: "Iron Pawn", faction: "Iron", tier: 1,
    description: "Marches forward, strikes diagonally. The backbone of every army.",
    maxHp: 3, attack: 2, defense: 1, symbol: "♟",
    movement: {
      // Forward direction flipped per owner in engine (white = -1, black = +1)
      directions: [[-1,0,1]],
      canLeap: false,
    },
    abilities: [
      {
        id: "shield_wall", name: "Shield Wall",
        description: "Adjacent friendly pawns gain +1 defense for 1 turn.",
        cooldown: 2, range: 1,
      },
    ],
  },

  // 7. SOULBOUND QUEEN ───────────────────────────────────────
  {
    typeId: "soulbound_queen", name: "Soulbound Queen", faction: "Arcane", tier: 3,
    description: "Unlimited movement in all directions. Devastating one-shot capture.",
    maxHp: 0, attack: 6, defense: 0, symbol: "♛",
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
        id: "soul_shatter", name: "Soul Shatter",
        description: "Destroy a target piece within range 3 regardless of HP.",
        cooldown: 5, range: 3,
      },
    ],
  },

  // 8. EMBER DRAKE ───────────────────────────────────────────
  {
    typeId: "ember_drake", name: "Ember Drake", faction: "Fire", tier: 2,
    description: "Charges forward or arcs diagonally. Breathes fire.",
    maxHp: 6, attack: 3, defense: 2, symbol: "🐉",
    movement: {
      directions: [
        [-2,0,1],
        [-1,-1,2],[-1,1,2],
        [ 1,-1,2],[ 1,1,2],
      ],
      canLeap: false,
    },
    abilities: [
      {
        id: "flame_breath", name: "Flame Breath",
        description: "Deal 2 damage to all pieces in a 3-tile forward cone.",
        cooldown: 3, range: 3,
      },
    ],
  },

  // 9. PHANTOM ASSASSIN ──────────────────────────────────────
  {
    typeId: "phantom_assassin", name: "Phantom Assassin", faction: "Void", tier: 2,
    description: "Leaps up to 2 tiles in any direction. Bypasses armor.",
    maxHp: 2, attack: 4, defense: 0, symbol: "☽",
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
        id: "shadow_step", name: "Shadow Step",
        description: "Teleport to any empty tile within 4 squares.",
        cooldown: 3, range: 4,
      },
    ],
  },

  // 10. STONE SENTINEL ───────────────────────────────────────
  {
    typeId: "stone_sentinel", name: "Stone Sentinel", faction: "Iron", tier: 2,
    description: "Cannot move. Nearly impenetrable wall. Taunts adjacent enemies.",
    maxHp: 12, attack: 2, defense: 5, symbol: "⬡",
    movement: { directions: [], canLeap: false },
    abilities: [
      {
        id: "taunt", name: "Taunt",
        description: "Enemy pieces adjacent to this sentinel cannot move away for 1 turn.",
        cooldown: 4, range: 1,
      },
    ],
  },
];

const DEF_MAP = new Map(DEFINITIONS.map(d => [d.typeId, d]));

export function getPieceDefinitionById(typeId: string): PieceDefinition {
  const def = DEF_MAP.get(typeId);
  if (!def) throw new Error(`Unknown piece type: "${typeId}"`);
  return def;
}

export function getAllDefinitions(): PieceDefinition[] {
  return DEFINITIONS;
}