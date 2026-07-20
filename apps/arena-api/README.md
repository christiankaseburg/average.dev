# arena-api

Colyseus 0.17 game server that powers the **Arena** multiplayer battle royale. It maintains authoritative game state for every active match and broadcasts delta-patched updates to connected clients at 20 Hz.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js (see `.nvmrc` at repo root) |
| Game networking | [Colyseus 0.17](https://docs.colyseus.io/) |
| Language | TypeScript |
| Build | `tsc` via Nx |
| Container | Docker (see `Dockerfile`) |

---

## Directory Structure

```
apps/arena-api/
├── src/
│   ├── index.ts              # Entry point — registers rooms, HTTP routes, starts server
│   ├── config/
│   │   ├── map.ts            # Tile map dimensions & collision grid
│   │   ├── weapons.ts        # Re-exports WeaponConfig/WEAPONS from arena-shared
│   │   └── items.ts          # Loot table definitions (item ids, spawn weights)
│   ├── rooms/
│   │   ├── arena.room.ts     # ArenaRoom — production battle royale room
│   │   ├── sandbox.room.ts   # SandboxRoom — single-player dev/testing room (dev only)
│   │   └── lobby.room.ts     # LobbyRoom — matchmaking holding room
│   ├── schemas/
│   │   ├── game-state.schema.ts   # Root GameState (players map, items map, zone, phase)
│   │   ├── player-state.schema.ts # PlayerState (position, health, facing, weapon…)
│   │   ├── zone-state.schema.ts   # ZoneState (center, radius, shrink progress)
│   │   └── item-state.schema.ts   # ItemState (position, itemId, picked up flag)
│   ├── systems/
│   │   ├── game-loop.ts      # GameLoop class — orchestrates all systems each tick
│   │   ├── movement.system.ts
│   │   ├── combat.system.ts
│   │   ├── zone.system.ts
│   │   ├── loot.system.ts
│   │   └── spawn.system.ts
│   └── utils/                # Small pure helpers (math, collision, etc.)
├── Dockerfile
├── package.json
├── project.json              # Nx project config
└── tsconfig.json
```

---

## Running Locally

```sh
yarn nx dev arena-api
```

This compiles and starts the server with `ts-node` (or `tsx`) in watch mode. The server listens on **port 2567** by default.

**Environment variables** (create a `.env` file in `apps/arena-api/` or set them in your shell):

| Variable | Default | Description |
|---|---|---|
| `PORT` | `2567` | HTTP / WebSocket listen port |
| `NODE_ENV` | `development` | Set to `production` to disable `SandboxRoom` and the Colyseus monitor |

When `NODE_ENV` is **not** `production`:
- `SandboxRoom` is registered and joinable at room name `"sandbox"`.
- The Colyseus monitor UI is served at `http://localhost:2567/colyseus`.

**Health check** (always available): `GET http://localhost:2567/api/health`

---

## Building

```sh
yarn nx build arena-api
```

Output lands in `dist/apps/arena-api/`. The `Dockerfile` runs this build and starts the compiled JS.

---

## Key Architecture Decisions

### Pure-function Systems

Every file in `src/systems/` (except `game-loop.ts`) exports **pure functions** — they receive the current `GameState` and a delta-time value, mutate state in place, and return nothing:

```ts
// Example signature pattern
export function tickMovement(state: GameState, dt: number): void { … }
```

This keeps logic testable in isolation (just call the function with a mock state object) and avoids the complexity of class hierarchies with shared mutable fields.

### The Game Loop

`GameLoop` is a thin orchestrator class instantiated once per `ArenaRoom`. Colyseus calls `setSimulationInterval` to drive it at **20 Hz (50 ms per tick)**:

```ts
this.setSimulationInterval((dt) => this.gameLoop.tick(dt), 1000 / 20);
```

Inside `GameLoop.tick()`, systems run in a fixed order every tick:

1. `spawn.system` — respawn loot if needed
2. `movement.system` — apply player inputs to positions
3. `combat.system` — resolve attacks and damage
4. `zone.system` — advance zone shrink, apply out-of-zone damage
5. Win condition check — transition `GamePhase` when ≤1 player alive

**Why 20 Hz?** It is a common sweet-spot for action games: low enough to keep bandwidth reasonable (Colyseus delta-patches the schema automatically), high enough that 50 ms of latency is imperceptible for a top-down shooter. Increasing to 60 Hz triples bandwidth with diminishing returns; decreasing below 20 Hz makes movement noticeably choppy.

### Colyseus Schema Versioning

`@colyseus/schema` serialises state as a compact binary diff. **Adding or removing `@type`-decorated fields in a schema is a breaking change** — existing clients will desync. When you need to evolve a schema:

1. Prefer adding new optional fields; never reorder or remove existing ones.
2. Bump the schema version comment at the top of the file so it is easy to track.
3. If a breaking change is unavoidable, coordinate a simultaneous deploy of `arena-api` and `arena-web`.

---

## How to Add a New System

1. Create `src/systems/my-feature.system.ts`:

```ts
import { GameState } from '../schemas/game-state.schema';

export function tickMyFeature(state: GameState, dt: number): void {
  // your logic here
}
```

2. Import and call it inside `GameLoop.tick()` in `game-loop.ts` at the appropriate position in the execution order.

That's it. No registration, no class inheritance required.

---

## How to Add a New Room

1. Create `src/rooms/my-feature.room.ts`:

```ts
import { Room, Client } from '@colyseus/core';
import { GameState } from '../schemas/game-state.schema';

export class MyFeatureRoom extends Room<GameState> {
  onCreate(options: any) {
    this.setState(new GameState());
    this.setSimulationInterval((dt) => { /* … */ }, 50);
  }

  onJoin(client: Client) { /* … */ }
  onLeave(client: Client) { /* … */ }
  onDispose() { /* … */ }
}
```

2. Register it in `src/index.ts`:

```ts
gameServer.define('my-feature', MyFeatureRoom);
// For dev-only rooms, guard with:
if (process.env.NODE_ENV !== 'production') {
  gameServer.define('my-feature', MyFeatureRoom);
}
```

---

## Related Packages

- **`@average.dev/arena-shared`** (`libs/arena-shared`) — shared TypeScript types and constants used by both this server and `arena-web`. Import from here rather than duplicating definitions.
