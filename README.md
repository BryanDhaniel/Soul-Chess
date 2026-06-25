<div align="center">

# ♟️ SOULCHESS

**A fantasy variant of classic chess — a 16×16 octagonal board, 20 troops per player, and a unique magical ability on every piece.**

<img width="696" height="577" alt="image" src="https://github.com/user-attachments/assets/eab795d7-39f0-4d98-a41c-2cbb7c0cc520" />

</div>

---

## 📖 About The Project

**SoulChess** is a turn-based strategy game that wraps classic chess rules in a dark fantasy theme. Instead of the standard 8×8 board, SoulChess is played on a much larger **16×16 octagonal board**, where each player deploys **20 pieces** from their own deck before the battle begins.

The combat system keeps the soul of classic chess intact: **1 hit, 1 kill** — there are no HP, attack, or defense stats to track. What sets each piece apart is its **unique active/passive ability**, which can turn the tide of battle in an instant.

The project is built entirely with **Next.js (App Router) + TypeScript**, with no heavy animation dependency — every transition and visual effect is hand-written using plain CSS `@keyframes` to keep the bundle size light.

---

## ✨ Key Features

- 🗺️ **16×16 Octagonal Board** — a large board with corner-cut geometry forming an octagon, far bigger than the standard 8×8 chessboard.
- 🛡️ **Deck Builder** — build your own 20-piece formation before each match, with automatic validation (exactly 1 Soul King & 1 Soulbound Queen required, slots must total 20).
- ⚔️ **6 Fantasy-Themed Piece Types**, each with a distinct ability (see the table below).
- 🤖 **AI with 3 Difficulty Tiers** — Easy (random), Normal (greedy, prioritizing captures & king safety), and Hard (depth-2 minimax).
- 👥 **Local PvP Mode** — two players on the same device, complete with a deck-selection flow.
- 🎨 **"Fantasy Parchment" Aesthetic** — an ivory, gold, and sapphire color palette with serif typography, inspired by fantasy manhwa art.
- 🎬 **Hand-Rolled Animations** — every UI transition is written in pure CSS `@keyframes` (no Framer Motion) for better performance and a smaller bundle.
- 🐳 **Docker-Ready** — runs out of the box via Docker Compose for consistent deployments.

---

## 🖼️ Screenshots
<img width="1365" height="634" alt="image" src="https://github.com/user-attachments/assets/487bd967-e85a-409a-b5fd-536ae9417751" />
<img width="1365" height="637" alt="image" src="https://github.com/user-attachments/assets/84247154-9dd4-45c3-b046-c5abea684f50" />

---

## ♞ Pieces & Abilities

| Piece | Symbol | Chess Role | Movement | Unique Ability |
|---|---|---|---|---|
| **Soul King** | ♔ | King | 1 step in any direction | **Royal Swap** — swap places with any friendly piece (3-turn cooldown) |
| **Soulbound Queen** | ♛ | Queen | Unlimited slide, any direction | **Royal Teleport** — teleport to any empty tile, cannot capture (4-turn cooldown) |
| **Void Rook** | ♜ | Rook | Unlimited slide, horizontal/vertical | **Fortify** — blocks the next enemy attack against it (single use) |
| **Wraith Bishop** | ♝ | Bishop | Unlimited slide, diagonal | **Color Bind** (passive) — can only be captured by an attacker standing on a matching-colored tile |
| **Arcane Knight** | ♞ | Knight | L-shaped leap, jumps over other pieces | **Flanking Strike** — moves again in the same turn after a successful capture |
| **Iron Pawn** | ♟ | Pawn | 1 step forward/backward, captures diagonally | **Soul Mimic** — after capturing a non-King piece, transforms into that piece for 1 turn |

> Victory is achieved by capturing the enemy **Soul King** — just like checkmate in classic chess.

---

## 🧠 AI & Difficulty Levels

| Level | Strategy | Description |
|---|---|---|
| Easy | `RandomStrategy` | Picks a random legal move |
| Normal | `GreedyStrategy` | Prioritizes captures & king safety |
| Hard | `MinimaxStrategy` | Depth-2 minimax with a board evaluation function |

---

## 🛠️ Tech Stack

| Category | Technology |
|---|---|
| Framework | [Next.js](https://nextjs.org) (App Router) |
| Language | TypeScript |
| UI Library | React 19 |
| Styling | Tailwind CSS v4 |
| Icons | [lucide-react](https://lucide.dev) |
| Animation | Hand-written CSS `@keyframes` (no Framer Motion) |
| Deck Storage | `localStorage` (client-side) |
| Containerization | Docker + Docker Compose |

---

## 🚀 Getting Started

### Prerequisites
- Node.js (latest LTS recommended)
- A package manager of your choice: `npm`, `yarn`, `pnpm`, or `bun`

### Local

1. Install dependencies:
```bash
npm install
# or
pnpm install
# or
yarn install
# or
bun install
```

2. Run the development server:
```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser to see the result.

### Production Build
```bash
npm run build
npm run start
```

### Docker

> Make sure your system has [Docker Desktop](https://docs.docker.com/desktop/setup/install/linux/) or [Docker Engine](https://docs.docker.com/engine/) with [Docker Buildx](https://github.com/docker/buildx#linux-packages) installed (Linux only).

Start the container:
```bash
sudo docker compose up
```

Or run it in the background:
```bash
sudo docker compose up -d
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

Stop the containers (if running in the background):
```bash
sudo docker compose down
```

Rebuild after making changes to the [Dockerfile](./Dockerfile) or [compose.yaml](./compose.yaml):
```bash
sudo docker compose down
sudo docker compose up --build
```

---

## 🎮 How To Play

1. **Open the Main Menu** and choose a game mode.
2. **Build your Deck** on the *Decks* page — pick 20 pieces from the available pool and place them in your deploy zone (rows 11–15). A deck must contain exactly 1 **Soul King** and 1 **Soulbound Queen**.
3. **Start a Match** — face the AI (pick a difficulty) or play locally against another player (PvP).
4. **Move your pieces** according to their movement patterns, use unique abilities to turn the tide of battle, and take advantage of special tiles on the board for tactical edge.
5. **Win the game** by capturing the enemy's **Soul King**.

---

## 📁 Project Structure

```
Soul-Chess/
├── app/
│   ├── components/
│   │   └── Board.tsx          # Board rendering & piece display
│   ├── decks/
│   │   └── page.tsx           # Deck builder page
│   ├── play/
│   │   └── local/page.tsx     # Local PvP/AI match page
│   ├── hooks/
│   │   └── useGameState.ts    # Game state management
│   ├── lib/
│   │   ├── ai.ts              # AI strategies (Random/Greedy/Minimax)
│   │   ├── boardUtils.ts      # Octagonal board geometry & special tiles
│   │   ├── deckStorage.ts     # Deck validation & persistence (localStorage)
│   │   ├── gameEngine.ts      # Core game logic (move, attack, ability)
│   │   ├── pieceRegistry.ts   # Definitions for all 6 piece types & abilities
│   │   ├── sounds.ts          # Sound effects
│   │   └── soundtrack.ts      # Background music
│   ├── types/
│   │   └── game.ts            # Core TypeScript types (Piece, Tile, GameState, etc.)
│   ├── page.tsx                # Main menu
│   └── layout.tsx
├── public/
│   └── images/                 # Image assets & screenshots
├── Dockerfile
├── compose.yaml
└── package.json
```

---

## 🗺️ Roadmap

- [ ] **Settings** page (audio, controls, display preferences)
- [ ] Original audio assets (currently placeholders)
- [ ] **Mobile** UI polish
- [ ] **Page transition** animations
- [ ] Online/multiplayer mode (not yet finalized)

---

## 🤝 Contributing

Contributions, ideas, and bug reports are welcome. Feel free to open an issue or pull request on this repository.

---
