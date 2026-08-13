# arena-shared — Shared Types & Constants

## 🎯 Project Goal
The single source of truth for all types and constants shared between `arena-api`
(game server) and `arena-web` (game client). Eliminates duplication and ensures
both sides always agree on the same data shapes and numeric values.

**Import path**: `@average.dev/arena-shared`  
**Zero runtime dependencies** — pure TypeScript, types only.  
**Typecheck**: `yarn nx typecheck arena-shared`

---

## 🗺️ Directory Structure

```
src/
  index.ts                        ← Public API — re-exports everything below
  types/
    input.types.ts                ← Facing, PlayerInput, InputCommand
    game.types.ts                 ← GamePhase, PlayerSnapshot, ZoneSnapshot, ItemSnapshot,
                                      PlayerAttackedEvent, PlayerHitEvent,
                                      ArenaRoomMetadata, GameEventCallback
  constants/
    game.constants.ts             ← Map dimensions, speeds, tick rate, reconciliation thresholds
    weapons.constants.ts          ← WeaponConfig interface + WEAPONS map
```

---

## 📦 Public API (`index.ts`)

### Types

#### `input.types.ts`
| Export | Description |
|---|---|
| `Facing` | `'up' \| 'down' \| 'left' \| 'right'` |
| `PlayerInput` | `{ dx, dy, attack, interact, weaponSlot, facing? }` |
| `InputCommand` | `PlayerInput & { seq: number }` — seq used for reconciliation |

#### `game.types.ts`
| Export | Description |
|---|---|
| `GamePhase` | `'waiting' \| 'countdown' \| 'playing' \| 'ended'` |
| `PlayerSnapshot` | Full player state as seen by the client (mirrors PlayerState schema) |
| `ZoneSnapshot` | Zone state snapshot (center, radius, DPS, phase) |
| `ItemSnapshot` | Item state snapshot (id, type, position, isPickedUp) |
| `PlayerAttackedEvent` | `{ sessionId, weapon }` — broadcast when attack is triggered |
| `PlayerHitEvent` | `{ targetId, attackerId, damage, killed }` — broadcast on hit |
| `ArenaRoomMetadata` | `{ roomCode, matchMode, isPrivate }` — Colyseus room listing metadata |
| `GameEventCallback` | `(event: string, data: PlayerAttackedEvent \| PlayerHitEvent) => void` |

### Constants

#### `game.constants.ts`
| Constant | Value | Description |
|---|---|---|
| `WORLD_SIZE` | `2048` | Map width in pixels |
| `WORLD_HALF_SIZE` | `2048` | Map height in pixels |
| `WORLD_HALF_SIZE` | `32` | Pixels per tile |
| `MAP_TILES` | `64` | WORLD_SIZE / WORLD_HALF_SIZE |
| `PLAYER_SPEED` | `200` | px per second |
| `TICK_RATE` | `20` | Server ticks per second |
| `TICK_INTERVAL_MS` | `50` | 1000 / TICK_RATE |
| `INPUT_SEND_RATE` | `20` | Client input sends per second |
| `RECONCILE_SNAP_THRESHOLD_SQ` | `25` | px² — snap if error is within this |
| `RECONCILE_TELEPORT_THRESHOLD` | `150` | px — teleport if error exceeds this |

#### `weapons.constants.ts`
| Key | Damage | Range | Cooldown | Knockback |
|---|---|---|---|---|
| `fists` | 5 | 4 units | 500 ms | 1 units |
| `sword` | 15 | 6 units | 800 ms | 2 units |
| `dagger` | 10 | 3 units | 400 ms | 0 units |
| `spear` | 12 | 6 units | 1000 ms | 3 units |
| `bow` | 20 | 20 units | 1200 ms | 1 units |

```typescript
// WeaponConfig interface
interface WeaponConfig {
  name: string;
  damage: number;
  range: number;       // pixels
  attackSpeed: number; // cooldown in milliseconds
  knockback: number;   // pixels
}
```

---

## 🔗 Who Imports This?

| Consumer | What it uses |
|---|---|
| `apps/arena-api` | `InputCommand`, `WeaponConfig`, `WEAPONS`, `WORLD_SIZE`, `WORLD_SIZE`, `PLAYER_SPEED`, `TICK_INTERVAL_MS`, `GameEventCallback` |
| `apps/arena-web` | `PlayerSnapshot`, `ZoneSnapshot`, `ItemSnapshot`, `PlayerAttackedEvent`, `PlayerHitEvent`, `ArenaRoomMetadata`, `InputCommand`, `Facing`, `WEAPONS`, all constants |

---

## 🚫 Rules for Future Agents
1. **Zero runtime dependencies.** This library must never import from any package with side effects. `import type` from TypeScript utility packages is fine, but no runtime code.
2. **Never import from `arena-api` or `arena-web`.** The dependency graph is: `arena-api` → `arena-shared` ← `arena-web`. No circular dependencies.
3. **Everything must be exported from `index.ts`.** Consumers import from `@average.dev/arena-shared`, never from deep internal paths.
4. **`PlayerSnapshot` must mirror `PlayerState` schema fields.** When adding a new synced field to `PlayerState` in arena-api, add the corresponding field here too.
5. **Weapon changes must happen here.** The `WEAPONS` map is imported by both client and server. Any new weapon must be added to `weapons.constants.ts` and both sides automatically see it.
6. **Reconciliation thresholds are here.** `RECONCILE_SNAP_THRESHOLD_SQ` and `RECONCILE_TELEPORT_THRESHOLD` are used by `PlayerEntity.reconcile()` in arena-web. Changing them affects client feel.
7. **Run `yarn nx typecheck arena-shared` after every change.**
