# arena-api — Game Server

## 🎯 Project Goal
The authoritative multiplayer game server for the Arena Battle Royale game.
All game logic runs here. Clients never trust themselves — the server is the
source of truth for position, health, damage, and win conditions.

**Port**: `2567` (default) | `$PORT` env var in production  
**Tech**: Node.js · Express · Colyseus 0.17 · `@colyseus/schema` v3  
**Tick rate**: 20 Hz (50 ms interval via `setSimulationInterval`)

---

## 🗺️ Directory Structure

```
src/
  index.ts            ← Express app + Colyseus server bootstrap + room registration
  config/
    map.ts            ← MAP_WIDTH, MAP_HEIGHT, TILE_SIZE, collision grid, spawn/chest positions
    weapons.ts        ← Re-exports WeaponConfig + WEAPONS from @average.dev/arena-shared
    items.ts          ← ItemConfig interface + ITEMS map (health_potion, swords, armor, etc.)
  rooms/
    types.ts          ← ArenaRoomOptions interface (shared by ArenaRoom + SandboxRoom)
    arena.ts          ← ArenaRoom — main battle royale room (20-player cap, zone enabled)
    sandbox.ts        ← SandboxRoom — dev-only single-player sandbox (no zone, instant start)
    lobby.ts          ← Colyseus built-in LobbyRoom (room browser / matchmaking list)
  schemas/
    game-state.ts     ← GameState root schema (players, items, zone, phase, aliveCount, etc.)
    player-state.ts   ← PlayerState — all synced player fields + server-only lastAttackTime
    zone-state.ts     ← ZoneState — current/target center, radius, DPS, phase index
    item-state.ts     ← ItemState — id, itemType, x, y, isPickedUp
  systems/
    game-loop.ts      ← GameLoop class — orchestrates all systems at 20 Hz
    movement.ts       ← processMovement() — velocity, tile collision, facing update
    combat.ts         ← processAttack() — range, arc, cooldown, damage, kill detection
    zone.ts           ← updateZone() + applyZoneDamage() — shrink phases and DPS
    loot.ts           ← spawnChests() + handleInteract() — chest spawning and pickup
    spawn.ts          ← getSpawnPoint() + respawnPlayer() — spawn point management
  utils/
    math.ts           ← Vector2, distanceSquared, lerp, clamp, randomInCircle
    validation.ts     ← sanitizeInput() — clamps and validates raw client InputCommand
```

---

## 🏗️ Architecture

### Colyseus Room Lifecycle
Each `Room` handles the full lifecycle of one match. Rooms are created on demand
by Colyseus matchmaking when a client calls `joinOrCreate`.

```
onCreate  → initialize GameState schema, build collision grid, start GameLoop, spawn chests
onJoin    → create PlayerState, assign spawn point, trigger countdown if ≥ 2 players
onLeave   → mark player dead (isAlive = false)
onDispose → room garbage collected by Colyseus
```

### Room Types
| Room | Use | Zone | Auto-start |
|---|---|---|---|
| `arena` | Live matches | ✅ | When ≥ 2 players join → countdown |
| `sandbox` | Development / testing | ❌ | Immediately on first join |
| `lobby` | Room browser (built-in) | n/a | n/a |

`arena` rooms are filtered by `matchMode` and `deviceType` for matchmaking.  
`sandbox` is only registered in `NODE_ENV !== 'production'`.

### Game Phase State Machine
```
waiting ──(≥ 2 players join)──► countdown ──(5 000 ms)──► playing ──(1 alive)──► ended
```
- **Movement** runs in ALL active phases (waiting, countdown, playing)
- **Combat, zone, loot, win detection** run only in `playing`
- This prevents reconciliation jitter when players move during the pre-game countdown

### GameLoop (20 Hz)
`GameLoop.tick()` is called every 50 ms by `setSimulationInterval`. It orchestrates:
1. `tickMovement()` — always runs (all non-ended phases)
2. `tickCombatAndZone()` — playing phase only:
   - Process attacks and interactions per player
   - Broadcast `player_attacked` / `player_hit` events via `onEvent` callback
   - Update zone (shrink, damage out-of-zone players)
   - Check win condition (alive ≤ 1)

### Schema Sync (Colyseus Binary Patches)
All `@type()`-decorated fields on Schema classes are automatically serialized as
binary delta patches and sent to every client every tick. Only changed fields
are transmitted — not the full state.

> ⚠️ `PlayerState.lastAttackTime` is intentionally NOT decorated with `@type`.
> It is server-only state. Never add `@type` to it.

### Room Messages (Type B Events)
Instant events that must arrive before the next state patch use `room.broadcast()`:
- `player_attacked` — immediately triggers attack animation on all clients
- `player_hit` — immediately reduces health UI on the target's client

These complement the schema patch (Type A) rather than replacing it.

---

## ⚙️ Systems Reference

### movement.ts — `processMovement(player, input, collisionGrid, deltaTime)`
- Speed: `PLAYER_SPEED` (200 px/s) from `@average.dev/arena-shared`
- Tile collision: AABB vs grid cell (`collisionGrid[tileY][tileX] === 1`)
- Map bounds: clamps to `MAP_WIDTH` / `MAP_HEIGHT`
- Facing: derived from dominant dx/dy axis, overridable by `input.facing`

### combat.ts — `processAttack(attacker, allPlayers, gameTime)`
- Cooldown: `lastAttackTime + weapon.attackSpeed ≤ gameTime`
- Range: `distanceSquared ≤ weapon.range²`
- Arc: 180° facing check (only hits players in the direction the attacker faces)
- Returns `CombatResult[]` — caller broadcasts `player_hit` for each

### zone.ts — `updateZone` / `applyZoneDamage`
Zone phases (0 → 4) shrink the safe circle over time. DPS is applied every tick
to players outside `currentRadius` from `currentCenter`.

| Phase | Radius | Duration | DPS |
|---|---|---|---|
| 0 | 100% | 30 s | 0 |
| 1 | 75% | 60 s | 5 |
| 2 | 50% | 45 s | 10 |
| 3 | 25% | 30 s | 20 |
| 4 | 5% | 20 s | 40 |

### loot.ts — `spawnChests` / `handleInteract`
- Chests spawn at `CHEST_LOCATIONS` (co-located with spawn points at +40, +40 offset)
- Interact range: 60 px
- Pickup: weapon → `player.weapon`, armor → `player.armor`, consumable → +20 HP

---

## 📐 Map Configuration (`config/map.ts`)
```
MAP_WIDTH  = 2048 px
MAP_HEIGHT = 2048 px
TILE_SIZE  = 32 px  →  64×64 tile grid
```
- Collision grid is currently all-zero (fully open map)
- 30 random spawn points generated at module load time (seeded per server restart)
- Do NOT add border walls to the collision grid — they cause client reconciliation jitter

---

## 🔗 External Dependencies
| Package | Purpose |
|---|---|
| `colyseus` | WebSocket room server + matchmaking |
| `@colyseus/schema` | Binary delta state serialization |
| `@colyseus/monitor` | Dev-only room inspector UI at `/colyseus` |
| `@colyseus/ws-transport` | WebSocket transport layer |
| `@average.dev/arena-shared` | Shared types (InputCommand, WeaponConfig, WEAPONS, constants) |

---

## 🚫 Rules for Future Agents
1. **Never trust raw client input.** Always pass message data through `sanitizeInput()` before use.
2. **Keep reducers (systems) pure.** No I/O in `processMovement`, `processAttack`, etc. Side effects (broadcast, state mutation) happen in `GameLoop` or the Room.
3. **Do not add `@type` to server-only fields.** Fields without the decorator are invisible to clients — this is intentional for data like `lastAttackTime`.
4. **Do not add border walls to the collision grid.** The client prediction clamps to map bounds separately; server walls would cause jitter during reconciliation.
5. **Shared constants and types belong in `@average.dev/arena-shared`**, not duplicated here.
6. **`sandbox` is dev-only.** The `SandboxRoom` registration is gated by `NODE_ENV !== 'production'`.
7. **Run `yarn nx typecheck arena-api` after every change.**
