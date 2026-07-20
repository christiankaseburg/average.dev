# arena-web

React + Phaser 4 game client for the **Arena** multiplayer battle royale. React owns the UI shell (lobby, HUD, game-over screen). Phaser renders the game world and handles frame-by-frame rendering.

---

## Tech Stack

| Layer | Technology |
|---|---|
| UI framework | React 19 |
| Game renderer | Phaser 4 |
| Build tool | Vite |
| Networking | Colyseus.js SDK |
| Language | TypeScript |
| Styles | SCSS modules |

---

## Directory Structure

```
apps/arena-web/
└── src/
    ├── main.tsx              # React root mount
    ├── styles.scss           # Global styles / CSS reset
    ├── app/                  # React application shell
    │   └── app.tsx           # Top-level state machine: lobby → playing → gameover
    ├── components/           # React UI components
    │   ├── Lobby/            # Pre-game lobby screen
    │   ├── HUD/              # In-game HUD (health bar, zone timer, kill feed)
    │   ├── GameCanvas/       # Mounts the Phaser canvas and bridges React ↔ Phaser
    │   └── GameOver/         # End-of-game results screen
    ├── game/                 # Everything Phaser-specific
    │   ├── config.ts         # Phaser.Game config (renderer, physics, scene list)
    │   ├── scenes/
    │   │   ├── boot.scene.ts      # Asset generation (programmatic textures, no disk assets)
    │   │   ├── game.scene.ts      # Main game loop — entities, systems, camera
    │   │   └── gameover.scene.ts  # Thin scene; signals React to show GameOver component
    │   ├── entities/
    │   │   ├── player.entity.ts         # Local player (client-side prediction + reconciliation)
    │   │   └── remote-player.entity.ts  # Remote players (interpolated from server snapshots)
    │   ├── systems/
    │   │   ├── input.system.ts    # Keyboard + virtual joystick; emits InputCommand objects
    │   │   ├── zone-renderer.ts   # Draws and animates the danger circle
    │   │   └── camera.system.ts   # Follows local player with dead-zone smoothing
    │   └── utils/                 # Phaser-specific helpers
    └── network/
        ├── client.ts          # Colyseus client singleton; device detection (mobile/desktop)
        ├── state-handler.ts   # Bridges Colyseus state deltas → Phaser events
        └── input-sender.ts    # Throttled input sender (20 Hz, matches server tick rate)
```

---

## Running Locally

> **Prerequisite:** `arena-api` must be running on `localhost:2567`. Start it first:
> ```sh
> yarn nx dev arena-api
> ```

Then start the client dev server:

```sh
yarn nx serve arena-web
```

Vite serves the app at `http://localhost:4200` (or the next available port) with HMR enabled.

---

## Building for Production

```sh
yarn nx build arena-web
```

Output is written to `dist/apps/arena-web/`. The bundle is a standard static site — serve it from any CDN or web server. Make sure `VITE_SERVER_URL` points at the deployed `arena-api` instance.

---

## React ↔ Phaser Architecture

The two frameworks live in the same browser tab but own separate DOM nodes. React mounts its component tree into `#root`. `GameCanvas` creates a `Phaser.Game` instance that writes to a `<canvas>` element inside the `GameCanvas` div.

Communication between them goes through a simple **event bus** pattern defined in `GameCanvas`. When Phaser wants to trigger a React state change (e.g., the game is over), it emits a DOM custom event that `GameCanvas` listens for and propagates upward via a callback prop.

---

## Client-Side Prediction

Top-down shooters feel broken with even 50 ms of latency if you wait for server confirmation before moving. Arena solves this with client-side prediction:

1. **Predict locally.** When the player presses a key, `applyClientPrediction()` in `PlayerEntity` moves the sprite immediately using the same physics constants as the server.
2. **Send inputs.** `input-sender.ts` batches and sends `InputCommand` packets to the server at 20 Hz, each tagged with a monotonically increasing `sequence` number.
3. **Receive authority.** When `state-handler.ts` receives a server state update containing the player's position, it calls `reconcile()` on `PlayerEntity`.
4. **Reconcile.** `reconcile()` compares the server-authoritative position against the locally predicted position. If the delta exceeds a threshold, it snaps the player to the correct position (or interpolates to avoid visual pop, depending on magnitude).

Remote players use **interpolation only** — `RemotePlayerEntity` keeps a small ring buffer of snapshots and renders at a fixed delay behind the latest snapshot to smooth over jitter.

---

## Network Layer

### `client.ts`
Holds the single `Colyseus.Client` instance. Also reads the user-agent to set an `isMobile` flag that the `InputSystem` uses to decide whether to show the virtual joystick.

### `state-handler.ts`
Called from `GameScene` after joining a room. Sets up Colyseus `onAdd` / `onChange` / `onRemove` listeners on `GameState.players` and `GameState.items`. Instead of polling, these callbacks fire only when state actually changes, then emit named Phaser events so scene/entity code doesn't need to touch the Colyseus room directly.

### `input-sender.ts`
Wraps `setInterval` at 50 ms (20 Hz). Each interval, if there is a pending `InputCommand` it sends it via `room.send()`. Inputs are accumulated between sends so no keypress is ever dropped even if the frame rate dips.

---

## Mobile vs. Desktop Input

`InputSystem` checks the `isMobile` flag from `client.ts`:

- **Desktop:** Listens to `Phaser.Input.Keyboard` events. WASD or arrow keys for movement, space/click for attack.
- **Mobile:** Renders a virtual joystick (nipplejs or equivalent) in the bottom-left corner for movement, and a tap-to-attack button in the bottom-right. The virtual joystick output is normalized into the same `{ dx, dy, attack }` shape as keyboard input, so all downstream code is identical.

---

## How to Add a New Phaser Entity

1. Create `src/game/entities/my-thing.entity.ts`:

```ts
import Phaser from 'phaser';

export class MyThingEntity {
  private sprite: Phaser.GameObjects.Sprite;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    this.sprite = scene.add.sprite(x, y, 'my-thing-texture');
  }

  update(dt: number): void {
    // called every frame from GameScene.update()
  }

  destroy(): void {
    this.sprite.destroy();
  }
}
```

2. Instantiate it in `GameScene` (or whichever scene owns it), store it in a `Map` keyed by server id, and call `entity.update(dt)` in `GameScene.update()`.

3. If the entity mirrors server state, wire it up via `state-handler.ts` using `onAdd` / `onRemove`.

---

## How to Add a New Scene

1. Create `src/game/scenes/my-feature.scene.ts`:

```ts
import Phaser from 'phaser';

export class MyFeatureScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MyFeatureScene' });
  }

  preload() { /* load assets */ }
  create() { /* set up objects */ }
  update(time: number, delta: number) { /* frame logic */ }
}
```

2. Add it to the scene list in `src/game/config.ts`:

```ts
import { MyFeatureScene } from './scenes/my-feature.scene';

scene: [BootScene, MyFeatureScene, GameScene, GameOverScene],
```

Scenes earlier in the array start first. `BootScene` always runs first to generate textures; add your scene at an appropriate position in the pipeline.

---

## Related Packages

- **`@average.dev/arena-shared`** (`libs/arena-shared`) — shared types (`PlayerInput`, `InputCommand`, `GamePhase`, etc.) and game constants (`TICK_RATE`, `PLAYER_SPEED`, etc.). Import from here to stay in sync with the server.
- **`@average.dev/arena-ui`** (`libs/arena-ui`) — shared React UI components (`Button`, `Panel`, `HealthBar`, etc.) used in the lobby and HUD.
