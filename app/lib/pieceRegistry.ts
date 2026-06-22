// ============================================================
// SOULCHESS — Piece Registry
// ============================================================
// Gameplay is standard chess movement + custom skills.
// Naming keeps the original fantasy flavour.
// ============================================================
import type { PieceDefinition } from "../types/game";

const DEFINITIONS: PieceDefinition[] = [

  // 1. SOUL KING ─────────────────────────────────────────────
  {
    typeId: "soul_king", name: "Soul King", faction: "Arcane", tier: 3,
    description: "Moves one tile in any direction. Capture the enemy Soul King to win.",
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
        id: "royal_swap", name: "Royal Swap",
        description: "Swap places with any one friendly piece on the board (a piece must be available to swap with).",
        cooldown: 3, range: 0,
      },
    ],
  },

  // 2. SOULBOUND QUEEN ───────────────────────────────────────
  {
    typeId: "soulbound_queen", name: "Soulbound Queen", faction: "Arcane", tier: 3,
    description: "Slides unlimited distance in any direction.",
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
        id: "royal_teleport", name: "Royal Teleport",
        description: "Teleport to any empty tile on the board. Cannot be used to capture.",
        cooldown: 4, range: 0,
      },
    ],
  },

  // 3. VOID ROOK ─────────────────────────────────────────────
  {
    typeId: "void_rook", name: "Void Rook", faction: "Void", tier: 2,
    description: "Slides unlimited distance horizontally or vertically.",
    symbol: "♜",
    movement: {
      directions: [[-1,0,0],[1,0,0],[0,-1,0],[0,1,0]],
      canLeap: false,
    },
    abilities: [
      {
        id: "fortify", name: "Fortify",
        description: "Block the next enemy attack against this Rook. Single use, then this ability is spent.",
        cooldown: 0, range: 0,
      },
    ],
  },

  // 4. WRAITH BISHOP ─────────────────────────────────────────
  {
    typeId: "wraith_bishop", name: "Wraith Bishop", faction: "Void", tier: 2,
    description: "Slides unlimited distance diagonally. Bound to its square colour — only an attacker standing on a matching coloured tile can capture it.",
    symbol: "♝",
    movement: {
      directions: [[-1,-1,0],[-1,1,0],[1,-1,0],[1,1,0]],
      canLeap: false,
    },
    abilities: [
      {
        id: "color_bind", name: "Color Bind",
        description: "Passive — can only be captured by an attacker standing on a tile of the same colour (light/dark) as this Bishop.",
        cooldown: 0, range: 0,
      },
    ],
  },

  // 5. ARCANE KNIGHT ─────────────────────────────────────────
  {
    typeId: "arcane_knight", name: "Arcane Knight", faction: "Arcane", tier: 1,
    description: "Leaps in an L-shape, ignoring pieces in between.",
    symbol: "♞",
    movement: {
      directions: [
        [-2,-1,1],[-2,1,1],[-1,-2,1],[-1,2,1],
        [ 1,-2,1],[ 1,2,1],[ 2,-1,1],[ 2,1,1],
      ],
      canLeap: true,
    },
    abilities: [
      {
        id: "flanking_strike", name: "Flanking Strike",
        description: "After capturing a piece, immediately move again this same turn.",
        cooldown: 0, range: 0,
      },
    ],
  },

  // 6. IRON PAWN ─────────────────────────────────────────────
  {
    typeId: "iron_pawn", name: "Iron Pawn", faction: "Iron", tier: 1,
    description: "Marches forward one tile, captures diagonally.",
    symbol: "♟",
    movement: {
      // Forward direction is flipped per owner in the engine via pawnDir()
      // (white moves toward row 0, black moves toward row 15).
      // Diagonal captures (left/right, one step forward) are handled
      // separately in calcAttacks — same as standard chess pawn capture.
      directions: [[-1,0,1]],
      canLeap: false,
    },
    abilities: [
      {
        id: "soul_mimic", name: "Soul Mimic",
        description: "After capturing a non-King piece, transform into that piece for 1 turn, then revert to an Iron Pawn.",
        cooldown: 0, range: 0,
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