# arena-ui — UI Component Library

## 🎯 Project Goal
The shared presentational component library for the Arena platform. Provides
generic, domain-agnostic building blocks (buttons, inputs, panels, etc.) that
can be used by `arena-web` and any other future application in the monorepo.

**Import path**: `@average.dev/arena-ui`  
**Storybook**: `yarn nx storybook arena-ui` (all components must have stories)  
**Typecheck**: `yarn nx typecheck arena-ui`

---

## 🗺️ Directory Structure

```
src/
  index.ts                          ← Public API — re-exports all components
  lib/
    arena-ui.tsx                    ← Library root (internal)
    arena-ui.module.scss            ← Shared SCSS utilities
  components/
    button/
      button.tsx                    ← Button — primary / secondary / danger variants
      button.module.scss
      button.stories.tsx            ← Storybook stories
    health-bar/
      health-bar.tsx                ← HealthBar — current + max props, color thresholds
      health-bar.module.scss
      health-bar.stories.tsx
    panel/
      panel.tsx                     ← Panel — glass-morphism card wrapper
      panel.module.scss
      panel.stories.tsx
    text-input/
      text-input.tsx                ← TextInput — controlled, fully styled
      text-input.module.scss
      text-input.stories.tsx
    theme-toggle/
      theme-toggle.tsx              ← ThemeToggle — light/dark/system via next-themes
      theme-toggle.module.scss
```

---

## 📦 Public API (`index.ts`)

```typescript
export * from './components/button/button';       // Button
export * from './components/text-input/text-input'; // TextInput
export * from './components/panel/panel';          // Panel
export * from './components/health-bar/health-bar'; // HealthBar
export * from './components/theme-toggle/theme-toggle'; // ThemeToggle
```

### Component Reference

| Component | Props | Purpose |
|---|---|---|
| `Button` | `variant: 'primary' \| 'secondary' \| 'danger'`, `onClick`, `disabled`, `style`, `children` | Styled action button |
| `TextInput` | `value`, `onChange`, `placeholder`, `maxLength`, `style` | Controlled text input |
| `Panel` | `className?`, `style?`, `children` | Glass-morphism card container |
| `HealthBar` | `current: number`, `max: number`, `style?` | Color-coded health bar |
| `ThemeToggle` | `style?` | Toggle between light / dark / system theme |

---

## 🏗️ Architecture

### Design System
Components use CSS custom properties defined in `apps/arena-web/src/styles.scss`.
All components are theme-aware via these variables:

```css
--color-primary       /* #7c5ce0 — purple */
--color-accent        /* #e06c5c — warm red */
--color-surface       /* #16162a */
--color-text          /* #e8e8f0 */
--color-text-muted    /* #8888aa */
--color-health        /* #4caf50 */
--color-danger        /* #e06c5c */
--color-gold          /* #ffd700 */
--glass-input-bg-rgb
--glass-input-border-rgb
--glass-border-rgb
--color-primary-rgb
```

### Storybook
Every component has a `.stories.tsx` file with at least:
- Default story (most common usage)
- One story per meaningful variant or state

Run Storybook with: `yarn nx storybook arena-ui`

---

## 🔗 Who Imports This?
| Consumer | Components Used |
|---|---|
| `apps/arena-web` | Button, TextInput, Panel, HealthBar, ThemeToggle |

---

## 🚫 Rules for Future Agents
1. **Components must be purely presentational.** No Colyseus types, no game logic, no imports from `arena-shared` or `arena-api`. A component is safe for arena-ui if it could appear in any non-game app.
2. **Every new component must have a Storybook story** in a co-located `.stories.tsx` file.
3. **Components follow kebab-case folder names** with matching kebab-case filenames: `health-bar/health-bar.tsx`. This differs from arena-web's PascalCase convention — arena-ui was established before that convention.
4. **Everything must be exported from `src/index.ts`.** Consumers use `@average.dev/arena-ui`, never deep import paths.
5. **Use CSS modules** (`*.module.scss`) for component styles. Use the global CSS custom properties from the design system — do not hardcode colors.
6. **`ThemeToggle` depends on `next-themes`.** The consuming app must wrap the component tree with `<ThemeProvider>` from `next-themes`. This is done in `apps/arena-web/src/app/app.tsx`.
7. **Do not add layout concerns to components.** `Panel` provides a surface, not a page layout. Page layout belongs in templates (`StandardTemplate`, etc.).
8. **Run `yarn nx typecheck arena-ui` and `yarn nx storybook arena-ui` to verify changes.**

---

## 📋 Adding a New Component
```
1. Create src/components/my-component/ directory
2. Create my-component.tsx — export function MyComponent({ ...props }: MyComponentProps)
3. Create my-component.module.scss — use CSS custom properties from the design system
4. Create my-component.stories.tsx — at least one story per variant
5. Export from src/index.ts
6. Run: yarn nx typecheck arena-ui && yarn nx storybook arena-ui
```
