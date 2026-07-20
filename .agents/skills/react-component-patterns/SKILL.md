---
name: react-component-patterns
description: >
  Use this skill when building React components in arena-web or arena-ui.
  Covers container/presentational split, custom hooks, useReducer, useContext,
  and the boundary between arena-ui (dumb) and arena-web (smart) components.
---

# React Component Patterns

## Core Principle: Separate What From How

Every component has two concerns:
- **What data it needs** and **how it fetches/manages it** → Container (smart)
- **How it looks** given a set of props → Presentational (dumb)

Keeping these separate makes components independently testable, easier to
reason about, and far more reusable.

---

## 1. Container vs Presentational Components

### Presentational (Dumb) Components
- Accept **only props** — no direct API calls, no `useEffect` for data fetching
- Purely render UI based on what they receive
- Live in **`@average.dev/arena-ui`** if they are generic building blocks
- Live in the feature's component folder if they are feature-specific visuals

```tsx
// ✅ Presentational — describes what, not where data comes from
interface PlayerCardProps {
  name: string;
  health: number;
  weapon: string;
}

export function PlayerCard({ name, health, weapon }: PlayerCardProps) {
  return (
    <div className={styles.card}>
      <span>{name}</span>
      <HealthBar value={health} />
      <WeaponIcon type={weapon} />
    </div>
  );
}
```

### Container (Smart) Components
- Own state, side effects, and event handlers
- Obtain data (from hooks, context, network) and pass it down
- Import presentational components and wire them with real data
- Live in the feature's component folder in arena-web

```tsx
// ✅ Container — knows where data comes from, delegates display
export function PlayerCardContainer({ sessionId }: { sessionId: string }) {
  const player = usePlayerState(sessionId); // custom hook

  return <PlayerCard name={player.name} health={player.health} weapon={player.weapon} />;
}
```

### Decision Guide

| Question | Answer → |
|---|---|
| Does it call an API or read from a network? | Container |
| Does it manage loading / error state? | Container |
| Does it contain only `props` and `JSX`? | Presentational |
| Is it a generic building block (Button, Input, Panel)? | arena-ui |
| Is it specific to arena gameplay? | arena-web |

---

## 2. Custom Hooks — Separate Logic from Rendering

Extract all logic into a co-located `use-*.ts` file next to the component.
Hooks make logic reusable, independently testable, and keep JSX clean.

```
components/
  home/
    home.tsx            ← thin container — imports hook + sub-components
    use-home-state.ts   ← all state management and handlers
    customize-character.tsx ← presentational sub-component
```

### What goes in a hook

```ts
// use-home-state.ts
export function useHomeState(onRoomJoined: (room: Room) => void) {
  const [state, dispatch] = useReducer(homeReducer, initialState);

  // Side effects
  useEffect(() => { /* load from localStorage */ }, []);

  // Handlers (async operations, dispatch calls)
  const handleQuickPlay = async () => { ... };

  // Return only what the component needs
  return { state, dispatch, handleQuickPlay };
}
```

### What stays in the component

```tsx
// home.tsx — only wires hook output to JSX
export function Home({ onRoomJoined }: HomeProps) {
  const { state, dispatch, handleQuickPlay } = useHomeState(onRoomJoined);
  return <HomeView state={state} onQuickPlay={handleQuickPlay} ... />;
}
```

---

## 3. State Reducer Pattern (`useReducer`)

Use `useReducer` instead of multiple `useState` calls when:
- Three or more related pieces of state change together
- State transitions follow a clear set of named actions
- You want a single place to audit all state changes

### Pattern

```ts
// 1. Define state shape
type ScreenState = {
  name: string;
  error: string;
  connecting: boolean;
};

// 2. Define discriminated union of actions
type ScreenAction =
  | { type: 'SET_NAME'; payload: string }
  | { type: 'SET_ERROR'; payload: string }
  | { type: 'CLEAR_ERROR' }
  | { type: 'SET_CONNECTING'; payload: boolean };

// 3. Write a pure reducer (no side effects — those stay in handlers)
function screenReducer(state: ScreenState, action: ScreenAction): ScreenState {
  switch (action.type) {
    case 'SET_NAME':      return { ...state, name: action.payload };
    case 'SET_ERROR':     return { ...state, error: action.payload };
    case 'CLEAR_ERROR':   return { ...state, error: '' };
    case 'SET_CONNECTING':return { ...state, connecting: action.payload };
    default:              return state;
  }
}

// 4. Use in a hook
function useScreenState() {
  const [state, dispatch] = useReducer(screenReducer, { name: '', error: '', connecting: false });
  return { state, dispatch };
}
```

### Key Rules for Reducers
- **Pure functions only** — no `localStorage`, no API calls, no `Date.now()`
- Side effects belong in event handlers or `useEffect` inside the hook
- Action types should be past-tense verbs describing what happened

---

## 4. Context + Reducer for Component Trees (`useContext`)

When state needs to flow through many levels of components, combine
`useReducer` with `useContext` to avoid prop-drilling.

```tsx
// 1. Create context
const GameContext = createContext<{ state: GameState; dispatch: Dispatch<GameAction> } | null>(null);

// 2. Provide it high in the tree
export function GameProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(gameReducer, initialGameState);
  return (
    <GameContext.Provider value={{ state, dispatch }}>
      {children}
    </GameContext.Provider>
  );
}

// 3. Consume anywhere in the tree without prop-drilling
export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be used inside GameProvider');
  return ctx;
}
```

Use context for **cross-cutting concerns** (theme, auth, game session) not
for every piece of state. Prefer prop-passing for simple parent→child data.

---

## 5. arena-ui vs arena-web Component Boundary

```
@average.dev/arena-ui
  ├── Button, TextInput, Panel, ThemeToggle   ← generic, domain-agnostic
  ├── CharacterPreview                         ← visual-only, no game logic
  ├── HealthBar, WeaponIcon                    ← visual primitives
  └── Supports Storybook — all components must be previewable in isolation

apps/arena-web
  ├── components/home/         ← Home screen feature
  │   ├── home.tsx             ← container
  │   ├── use-home-state.ts    ← hook
  │   └── customize-character.tsx ← feature-specific presentational
  └── components/hud/          ← HUD feature
      ├── hud.tsx              ← container
      └── use-hud-state.ts     ← hook
```

### What belongs in arena-ui
- Has no dependency on game server types (`PlayerSnapshot`, `Room`, etc.)
- Could appear in a Storybook story with only prop values
- Could theoretically be used in a completely different app

### What belongs in arena-web
- Imports from `@average.dev/arena-shared` (game types)
- Contains handlers that call Colyseus (`joinOrCreate`, `room.send`)
- Feature-specific and makes no sense outside the arena game

---

## 6. Naming and File Conventions

### Component Files — PascalCase, no dashes
Component filenames must match the exported component name exactly.

```
# ✅ Correct
components/home/Home.tsx                  → export function Home
components/home/CustomizeCharacter.tsx    → export function CustomizeCharacter
components/hud/HUD.tsx                    → export function HUD
components/game-canvas/GameCanvas.tsx     → export function GameCanvas

# ❌ Wrong
components/home/home.tsx
components/home/customize-character.tsx
```

### Hook Files — camelCase starting with `use`, no dashes
Hook filenames must start with `use` in lowercase, matching the exported hook name.

```
# ✅ Correct
components/home/useHomeState.ts           → export function useHomeState
hooks/useLocalStorage.ts                  → export function useLocalStorage

# ❌ Wrong
components/home/use-home-state.ts
hooks/use-local-storage.ts
```

### SCSS Modules — match the component filename
```
# ✅ Correct
components/home/Home.module.scss          ← paired with Home.tsx
components/home/CustomizeCharacter.module.scss ← paired with CustomizeCharacter.tsx

# ❌ Wrong
components/home/home.module.scss
components/home/customize-character.module.scss
```

### Folder names — lowercase with dashes are fine (OS path segments only)
```
components/home/         ✅
components/game-canvas/  ✅
```

### Prop Naming Conventions
- Event handlers: `on{Event}` (e.g. `onSave`, `onBodyTypeChange`, `onClose`)
- Boolean flags: `is{State}` or `has{Thing}` (e.g. `isConnecting`, `hasError`)
- Arrays: use singular for the item type (e.g. `players: PlayerSnapshot[]`)

---

## 7. Page Templates

Templates are layout shells that wrap route groups via React Router's layout
route pattern. They use `<Outlet />` to render the matched child page.
Pages rendered inside a template need only return their own content —
not a full-screen wrapper or shared chrome like a theme toggle.

```
templates/
  StandardTemplate/
    StandardTemplate.tsx      ← grid background + ThemeToggle + Outlet
    StandardTemplate.module.scss
  GameTemplate/
    GameTemplate.tsx          ← bare full-screen + Outlet
    GameTemplate.module.scss
```

### Wiring in AppRouter

```tsx
<Routes>
  <Route element={<StandardTemplate />}>
    <Route path="/" element={<HomePage />} />
  </Route>

  <Route element={<GameTemplate />}>
    <Route path="/game" element={<ProtectedGameRoute><GamePage /></ProtectedGameRoute>} />
    <Route path="/gameover" element={<ProtectedGameRoute><GameOverPage /></ProtectedGameRoute>} />
  </Route>
</Routes>
```

### Template Rules
- Templates use `<Outlet />` from `react-router-dom` — never render page content directly
- Templates own **layout and chrome** (background, ThemeToggle, nav bars)
- Pages own **their own content** (Panel, form, canvas) — no full-screen wrappers
- Adding a new page to an existing template requires only a new `<Route>` — no changes to the template
- Create a new template only when a page needs meaningfully different chrome

