# arena-shared

Pure TypeScript types and constants shared between `arena-api` (the Colyseus game server) and `arena-web` (the Phaser game client). Has **zero runtime dependencies**.

---

## Why This Library Exists

Without a shared library, each end of the network would maintain its own copy of the same types. Those copies drift apart. A developer updates `PlayerInput` on the server but forgets the client — the game silently misinterprets inputs. `arena-shared` eliminates that class of bug by making the type definition the single source of truth that both packages import.

---

## What Belongs Here

- Types that **both the server and the client** need to agree on
- Game constants that **must be identical** on both sides (e.g., tick rate, map dimensions, player speed)
- Weapon/item definitions that drive both server-side game logic and client-side UI

**Examples of good candidates:**

```
PlayerInput, InputCommand, Facing      — input shape sent from client to server
GamePhase                              — enum used in server state & client UI
PlayerSnapshot, ZoneSnapshot           — event payloads the server sends to the client
MAP_WIDTH, MAP_HEIGHT, TILE_SIZE       — map geometry
TICK_RATE, TICK_INTERVAL_MS            — must match setSimulationInterval on the server
PLAYER_SPEED                           — used by server movement & client prediction
WeaponConfig, WEAPONS                  — weapon stats shared by server combat & client HUD
```

## What Does NOT Belong Here

| Category | Reason |
|---|---|
| `@colyseus/schema` classes (`GameState`, `PlayerState`, …) | Server-only; the binary schema format is not useful on the client |
| Phaser game objects, scenes, entities | Browser/renderer dependency; cannot run in Node.js |
| React components or hooks | Browser/UI dependency |
| Server-only business logic (e.g., collision resolution, AI) | Not relevant to the client and may expose internals |
| Large data blobs (images, audio) | Not a data-asset package |

---

## Exports

### Types (`src/types/`)

| Export | File | Description |
|---|---|---|
| `Facing` | `input.types.ts` | Direction enum: `UP`, `DOWN`, `LEFT`, `RIGHT` |
| `PlayerInput` | `input.types.ts` | Raw input state snapshot `{ dx, dy, attack, facing }` |
| `InputCommand` | `input.types.ts` | Stamped input packet sent over the network `{ seq, input }` |
| `GamePhase` | `game.types.ts` | Enum: `WAITING`, `STARTING`, `ACTIVE`, `FINISHED` |
| `PlayerSnapshot` | `game.types.ts` | Lightweight player state for client-side reconciliation |
| `ZoneSnapshot` | `game.types.ts` | Zone center, radius, and target radius |
| `ItemSnapshot` | `game.types.ts` | Item position and id |
| `PlayerAttackedEvent` | `game.types.ts` | Event payload emitted when a player attacks |
| `PlayerHitEvent` | `game.types.ts` | Event payload emitted when a player is hit |

### Constants (`src/constants/`)

| Export | File | Description |
|---|---|---|
| `MAP_WIDTH`, `MAP_HEIGHT` | `game.constants.ts` | World dimensions in pixels |
| `TILE_SIZE` | `game.constants.ts` | Pixels per tile |
| `PLAYER_SPEED` | `game.constants.ts` | Pixels per second |
| `TICK_RATE` | `game.constants.ts` | Server ticks per second (20) |
| `TICK_INTERVAL_MS` | `game.constants.ts` | `1000 / TICK_RATE` (50 ms) |
| `WeaponConfig` | `weapons.constants.ts` | Type: weapon definition shape |
| `WEAPONS` | `weapons.constants.ts` | Record of all weapon configs keyed by weapon id |

---

## How to Import

The library is mapped in `tsconfig.base.json` at the repo root, so both apps can import it directly by package name:

```ts
import { InputCommand, GamePhase, TICK_RATE } from '@average.dev/arena-shared';
```

No relative path imports, no extra setup required.

---

## How to Add a New Type

1. Open the appropriate file in `src/types/` (or `src/constants/` for a constant). If neither file fits, create a new file — e.g., `src/types/spectator.types.ts`.

2. Define and export your type:

```ts
// src/types/spectator.types.ts
export interface SpectatorTarget {
  playerId: string;
  displayName: string;
}
```

3. Re-export it from `src/index.ts` so consumers can import it from the package root:

```ts
export * from './types/spectator.types';
```

4. You're done. Both `arena-api` and `arena-web` will automatically pick it up — no build step needed within the library itself (it's consumed as source via path aliases).

---

## How to Add a New Constant

Same process as a type. Define and export the value in `src/constants/`, then re-export from `src/index.ts`.

```ts
// src/constants/game.constants.ts  (add to existing file)
export const MAX_PLAYERS = 20;
```

```ts
// src/index.ts
export * from './constants/game.constants';
```

---

## Building / Testing

Because this library is consumed via TypeScript path aliases (not as a compiled npm package), there is typically no separate build step. If Nx is configured to build it:

```sh
yarn nx build arena-shared
```

To run type-checking only:

```sh
yarn nx typecheck arena-shared
```
