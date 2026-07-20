# arena-web — Game Client

## 🎯 Project Goal
The browser-based game client for the Arena Battle Royale game. Built with React
for all UI and menu screens, and Phaser for the real-time game rendering. The two
layers communicate through the `StateHandler` event bus.

**Tech**: React 19 · Vite · Phaser 4 · Colyseus SDK 0.17 · react-router-dom v7 · next-themes  
**Dev server**: `yarn nx serve arena-web` (Vite, port 4200)  
**Typecheck**: `yarn nx typecheck arena-web`

---

## 🗺️ Directory Structure

```
src/
  main.tsx                     ← React entry: StrictMode + createRoot → <App />
  styles.scss                  ← Global CSS variables, resets, font import (Inter)
  app/
    app.tsx                    ← Root shell: ThemeProvider → GameProvider → AppRouter
    app.module.scss            ← Root container styles (100vw/vh, overflow hidden)
    types.ts                   ← Shared app-level type stubs (AppGameState removed — now routing)
  context/
    GameContext.tsx            ← GameProvider + useGame() — active room, stateHandler, winner
  router/
    AppRouter.tsx              ← BrowserRouter + layout route groups
    ProtectedGameRoute.tsx     ← Redirects to / if no active room in GameContext
  templates/
    StandardTemplate/          ← Grid background + ThemeToggle + <Outlet />  (for /home)
    GameTemplate/              ← Bare full-screen + <Outlet />  (for /game, /gameover)
  pages/
    Home/
      HomePage.tsx             ← Container: wires useHomeState to UI
      HomePage.module.scss     ← Panel-level styles only (no layout)
      state/
        state.ts               ← HomeState type + initialState
        reducer.ts             ← HomeAction union + homeReducer (pure)
        useHomeState.ts        ← Hook: all async handlers + side effects
    Game/
      GamePage.tsx             ← Renders GameCanvas + HUD, navigates on game end
      GameOver/
        GameOverPage.tsx       ← Reads winner from GameContext, return-home button
        GameOverPage.module.scss
  components/
    CustomizeCharacter/        ← Purely presentational character customization form
    game-canvas/               ← Mounts and owns the Phaser.Game instance
    hud/                       ← React HUD overlay (health, alive count, leave button)
  network/
    client.ts                  ← Colyseus Client singleton, room join helpers, detectDeviceType
    state-handler.ts           ← Bridges Colyseus state patches → Phaser EventEmitter events
    input-sender.ts            ← Throttled input sender (20 Hz), assigns seq numbers
  game/
    config.ts                  ← Phaser.Types.Core.GameConfig factory
    scenes/
      boot.ts                  ← BootScene: generates all textures programmatically
      game.ts                  ← GameScene: input, prediction, interpolation, rendering
      gameover.ts              ← GameOverScene: minimal (game-over handled by React)
    entities/
      player.ts                ← PlayerEntity: layered sprite + prediction + reconciliation
      remote-player.ts         ← RemotePlayerEntity: layered sprite + interpolation
    systems/
      input.ts                 ← InputSystem: desktop (WASD/mouse) + mobile (virtual joystick)
      camera.ts                ← Camera follow + bounds
      zone-renderer.ts         ← Phaser Graphics overlay for the shrinking zone
    utils/
      interpolation.ts         ← lerpPosition helper
```

---

## 🏗️ Architecture

### Two-Layer Design
```
React Layer                        Phaser Layer
──────────────────────            ──────────────────────────────────
ThemeProvider                     BootScene (texture generation)
GameProvider (room lifecycle)         ↓
AppRouter (routing)               GameScene (input + rendering)
  StandardTemplate                  PlayerEntity (prediction + reconcile)
  GameTemplate                      RemotePlayerEntity (interpolation)
  HomePage                          InputSystem (WASD / virtual joystick)
  GamePage ←──── GameCanvas ──────→ ZoneRenderer
  HUD                               CameraSystem
  GameOverPage
         ↑
    StateHandler
    (EventEmitter bridge)
```

React owns **all UI and lifecycle**. Phaser owns **all game rendering and real-time input**.
They communicate through `StateHandler` — React passes it into Phaser via scene data,
Phaser subscribes to its events.

### Routing (react-router-dom v7)
```
/           → StandardTemplate → HomePage
/game       → GameTemplate → ProtectedGameRoute → GamePage
/gameover   → GameTemplate → ProtectedGameRoute → GameOverPage
*           → Navigate to /
```

`ProtectedGameRoute` checks `useGame().state.room`. If null (no active session),
redirects to `/` — prevents direct URL access to game routes.

### GameContext — Room Lifecycle
`GameContext` is the single source of truth for the active Colyseus session:

```
joinRoom(room)  → creates StateHandler, stores room + stateHandler, clears winner
leaveRoom()     → calls room.leave(), clears all context state
setWinner(id)   → stores winning sessionId before navigating to /gameover
```

All page transitions that involve joining or leaving a room go through these three methods.

### State Reducer Pattern (Home page)
The Home page state is split across three co-located files:

```
pages/Home/state/
  state.ts      ← HomeState type + initialState (no imports)
  reducer.ts    ← HomeAction union + homeReducer pure function (imports state.ts only)
  useHomeState.ts ← hook: side effects + async handlers (imports both above)
```

`homeReducer` is a pure function — no localStorage, no network calls.
All side effects live in `useHomeState`.

### Network Layer

#### client.ts
- Singleton Colyseus `Client` (WebSocket)
- Dev: `ws://localhost:2567` | Prod: derived from `window.location`
- `joinOrCreateRoom(name, options)` → used by Quick Play and Sandbox
- `joinRoomById(id, options)` → used by Room Code join
- `getAvailableRooms(name)` → room browser (returns `RoomListing[]`)

#### state-handler.ts
Extends `Phaser.Events.EventEmitter`. Subscribes to `room.onStateChange` and
manually diffs known state to emit typed events Phaser scenes can subscribe to:

| Event | Payload |
|---|---|
| `playerJoin` | `(sessionId, PlayerSnapshot)` |
| `playerUpdate` | `(sessionId, PlayerSnapshot)` |
| `playerLeave` | `(sessionId)` |
| `itemUpdate` | `(id, ItemSnapshot)` |
| `itemRemove` | `(id)` |
| `zoneUpdate` | `(ZoneSnapshot)` |
| `gamePhaseChange` | `(GamePhase)` |
| `aliveCountChange` | `(number)` |
| `playerAttacked` | `(PlayerAttackedEvent)` — via `room.onMessage` |
| `playerHit` | `(PlayerHitEvent)` — via `room.onMessage` |

> Colyseus 0.17 client decodes state into plain Maps — `onAdd`/`onRemove`
> callbacks are not available. Use `onStateChange` + manual diffing.

#### input-sender.ts
- Throttles sends to 20 Hz (50 ms minimum gap between non-action inputs)
- `attack` and `interact` are always sent immediately (never throttled)
- Assigns monotonically increasing `seq` numbers for reconciliation

---

## 🎮 Game Layer (Phaser)

### BootScene
Generates all textures programmatically via Phaser Graphics — no external sprite sheets.
Textures: body variants, hair styles, armor, weapons, chest, grass tile, wall tile.

### GameScene
Core game loop per frame:
1. `inputSystem.getCommand()` — read WASD / virtual joystick
2. Compute mouse-facing direction (desktop attack targeting)
3. `localPlayer.tryPlayAttackAnim(time)` — enforce weapon cooldown client-side
4. `localPlayer.applyClientPrediction(dx, dy, delta)` — move locally
5. `inputSender.sendInput(cmd)` → `localPlayer.recordPosition(seq)` — send + record
6. `remotePlayers.forEach(r => r.interpolate(delta))` — smooth remote movement

### Client-Side Prediction & Reconciliation (PlayerEntity)
- `applyClientPrediction()` — moves the player immediately, clamps to map bounds
- `recordPosition(seq)` — stores `{x,y}` in a history Map keyed by seq number
- `reconcile(serverX, serverY, lastProcessedSeq)`:
  - Looks up historical position at `lastProcessedSeq`
  - Computes prediction error
  - `> 150 px` → snap immediately
  - `> 5 px` → apply 10% correction factor (smooth drift)
  - `stopped + small error` → snap (prevents post-stop slide)

### Remote Player Interpolation (RemotePlayerEntity)
Uses exponential lerp: `factor = 1 - exp(-15 * dt/1000)` — framerate-independent,
always converges toward target position set by `playerUpdate` events.

---

## 📐 Component Patterns
See `.agents/skills/react-component-patterns/SKILL.md` for full detail.

**Key conventions:**
- **PascalCase filenames** for components: `HomePage.tsx`, `CustomizeCharacter.tsx`
- **`use` prefix camelCase** for hooks: `useHomeState.ts`
- **Container vs presentational**: containers own state/effects, presentationals only render props
- **Templates**: layout route wrappers using `<Outlet />` — add chrome (ThemeToggle, backgrounds) here
- **`arena-ui`**: all generic dumb components (Button, Panel, etc.) — no game logic
- **`components/`** in arena-web: game-specific reusable components (CustomizeCharacter, HUD, GameCanvas)
- **`pages/`**: route-level components, one directory per page (e.g. `pages/Home/HomePage.tsx`)

---

## 🔗 External Dependencies
| Package | Purpose |
|---|---|
| `phaser` | 2D game engine (rendering, input, scenes, tweens) |
| `@colyseus/sdk` | WebSocket client for Colyseus game server |
| `react-router-dom` | Client-side routing + layout routes |
| `next-themes` | System/light/dark theme provider |
| `@average.dev/arena-ui` | Shared presentational component library |
| `@average.dev/arena-shared` | Shared types and constants |

---

## 🚫 Rules for Future Agents
1. **React does not talk to Phaser directly.** The only bridge is `StateHandler` (passed as Phaser scene init data) and the `GameCanvas` component's `useEffect`.
2. **Phaser scenes must clean up all StateHandler listeners** on the `DESTROY` event to be React StrictMode safe.
3. **Templates own layout chrome** (ThemeToggle, backgrounds). Pages own content. Never put a full-screen wrapper div inside a page component.
4. **`ProtectedGameRoute` must wrap all routes that require an active room.** Never render `/game` or `/gameover` content without checking `useGame().state.room`.
5. **Do not call `room.leave()` directly in pages.** Use `GameContext.leaveRoom()` — it also clears context state.
6. **InputSender throttles to 20 Hz** — attack and interact bypass the throttle. Do not remove this — flooding the server with 60 Hz inputs degrades performance.
7. **All new components follow PascalCase filenames. All new hooks follow `use`-prefix camelCase filenames.**
8. **Run `yarn nx typecheck arena-web` after every change.**
