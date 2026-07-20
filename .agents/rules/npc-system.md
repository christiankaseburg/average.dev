# NPC System Architecture

## Overview

Arena's NPC system is split across three packages. Each layer has a distinct responsibility:

| Layer | Package | Responsibility |
|---|---|---|
| **Contract** | `arena-shared` | `NpcSnapshot`, `NpcAction` type, spawn constants |
| **Server** | `arena-api` | Spawning, state ownership, future AI |
| **Client** | `arena-web` | Asset loading, animation, rendering |

---

## Design Principles

### 1. Server owns semantics, client owns presentation (Option B)

The server sends a **high-level action string** (`NpcAction`), not an animation key:
```
idle | walking | attacking | hurt | dead
```

The client maps this to specific Phaser animations. This means:
- The server does not know or care which attack animation plays (attack1 vs attack2)
- The client can choose visual variety without server involvement
- Bandwidth is minimal — only changes are broadcast

**Do not** send Phaser animation keys like `npc_demon_a_idle` from the server. `NpcAction` is the contract.

### 2. `NPC_TYPES` and `NPC_REGISTRY` must stay in sync

`arena-shared` exports `NPC_TYPES` (the server's list for random selection):
```typescript
export const NPC_TYPES = ['demon_a'] as const;
```

`arena-web` has `NPC_REGISTRY` (the client's asset + animation metadata). Every value in `NPC_TYPES` **must** have a matching key in `NPC_REGISTRY`, or the client will throw when trying to create an `NpcEntity`.

When adding a new NPC type, update **both** in the same change.

### 3. Assets live in `public/npc/`, not `src/assets/`

NPC assets are **not** Vite imports. They are static files fetched by Phaser's loader at runtime:

```
public/npc/
  demon/
    Demon_A.png       ← sprite sheet (exported from Aseprite)
    Demon_A.json      ← Aseprite JSON Hash export (frame data + tags)
    Demon_A.aseprite  ← source file (edit this, then re-export)
```

- Do **not** `import` PNG or JSON files from `public/` in TypeScript.
- Do **not** place NPC assets in `src/assets/`.
- `NpcDefinition.pngPath` and `jsonPath` are plain URL strings (e.g. `'/npc/demon/Demon_A.png'`).

### 4. `BootScene` owns the full asset pipeline

`BootScene` is the only file that loads NPC assets and registers animations. The pipeline runs entirely in `BootScene`:
1. `preload()` — `this.load.image()` + `this.load.json()` for each NPC in `NPC_REGISTRY`
2. `create()` — `textures.addAtlas()` builds the atlas; `this.anims.create()` registers all animations globally
3. `this.game.events.emit('boot-complete')` signals that all animations are ready

`NpcSprite` is a pure **presentation layer** — it calls `this.play(animKey)` only. It does not load assets, does not parse JSON, and does not register animations.

**Do not** register animations in `NpcSprite` or `NpcEntity`. **Do not** use `game.events.once('ready', ...)` in `game-canvas.tsx` — this fires before `BootScene.create()` runs. Always use `'boot-complete'`.

---

## Adding a New NPC Type

Follow these steps in order:

### Step 1 — Export from Aseprite
- File → Export Sprite Sheet
- Output: **JSON Hash** format, Tags checked
- Item filename: `{title} {frame}.aseprite`  ← this produces frame keys like `"Demon_A 0.aseprite"`
- Place output in `public/npc/<folder>/`
- Also copy the `.aseprite` source file there for version control

### Step 2 — Add to `arena-web` NPC_REGISTRY
```typescript
// apps/arena-web/src/game/sprites/NpcDefinition.ts
export const NPC_REGISTRY: Record<string, NpcDefinition> = {
  skeleton: {
    type:        'skeleton',
    displayName: 'Skeleton',
    atlasKey:    'npc_skeleton',
    pngPath:     '/npc/skeleton/Skeleton.png',
    jsonPath:    '/npc/skeleton/Skeleton.json',
    animations: {
      idle:    'Idle',    // ← must match Aseprite tag names exactly (case-sensitive)
      walk:    'Walk',
      attack1: 'Attack01',
      hurt:    'Hurt',
      death:   'Death',
    },
    scale: 1.5,
  },
};
```

### Step 3 — Add to `arena-shared` NPC_TYPES
```typescript
// libs/arena-shared/src/constants/npc.constants.ts
export const NPC_TYPES = ['demon_a', 'skeleton'] as const;
```

`BootScene` and `StateHandler` require **no other changes**.

---

## Aseprite Export Settings (Reference)

| Setting | Value |
|---|---|
| Sheet type | Rows (or Packed) |
| Trim Sprite | ✅ |
| Trim Cells | ✅ |
| Data format | **JSON Hash** |
| Tags | ✅ |
| Item filename | `{title} {frame}.aseprite` |

The `{title} {frame}.aseprite` item filename is critical — it produces frame keys that Phaser can reference. Do not change this format without updating the frame key lookups in `BootScene`.

---

## Key Files

| File | Description |
|---|---|
| [`libs/arena-shared/src/types/npc.types.ts`](../../../libs/arena-shared/src/types/npc.types.ts) | `NpcSnapshot`, `NpcAction`, `NpcHitEvent` |
| [`libs/arena-shared/src/constants/npc.constants.ts`](../../../libs/arena-shared/src/constants/npc.constants.ts) | `NPC_TYPES`, `NPC_SPAWN_COUNT` |
| [`apps/arena-api/src/schemas/npc-state.ts`](../../../apps/arena-api/src/schemas/npc-state.ts) | Colyseus `NpcState` schema |
| [`apps/arena-api/src/systems/npc-spawner.ts`](../../../apps/arena-api/src/systems/npc-spawner.ts) | `spawnNpcs()` — called in room `onCreate()` |
| [`apps/arena-web/src/game/sprites/NpcDefinition.ts`](../../../apps/arena-web/src/game/sprites/NpcDefinition.ts) | `NPC_REGISTRY` — all NPC asset/animation metadata |
| [`apps/arena-web/src/game/scenes/boot.ts`](../../../apps/arena-web/src/game/scenes/boot.ts) | Loads assets + registers all Phaser animations |
| [`apps/arena-web/src/game/sprites/NpcSprite.ts`](../../../apps/arena-web/src/game/sprites/NpcSprite.ts) | Presentation layer — calls `play()` only |
| [`apps/arena-web/src/game/entities/NpcEntity.ts`](../../../apps/arena-web/src/game/entities/NpcEntity.ts) | Server→animation mapping, `updateFromServer()` |
| [`apps/arena-web/src/network/state-handler.ts`](../../../apps/arena-web/src/network/state-handler.ts) | Emits `npcAdd`, `npcUpdate`, `npcRemove` events |
| [`apps/arena-web/src/game/scenes/game.ts`](../../../apps/arena-web/src/game/scenes/game.ts) | Subscribes to NPC events, manages `NpcEntity` lifecycle |

---

## Future Work

- **NPC AI system** — add a `npc-ai.ts` system in `arena-api` that updates each `NpcState.action` and position on the game loop tick
- **Meta-atlas packing** — when there are 10+ NPC types, pack all sprite sheets into one large atlas (TexturePacker or Free Texture Packer) so all NPC types share one GPU texture → maximum draw call batching
- **Zone-aware selective loading** — pass the server's NPC type list to `BootScene` before it starts loading, so only types present in the current zone are fetched
- **Spine 2D migration** — `NpcSprite.playState()` is the only public interface `NpcEntity` uses; replace its internals with Spine runtime calls without changing any callers
