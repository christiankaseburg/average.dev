# arena-ui

Storybook-driven React component library for shared UI elements used across Arena applications (`arena-web` and any future Arena front-ends).

---

## Purpose

`arena-ui` provides a consistent design system so UI work is not repeated in each application. Components are developed in isolation via Storybook, which serves as both the development environment and living documentation.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 19 |
| Styles | SCSS modules + CSS custom properties |
| Component explorer | Storybook 8 |
| Build | Vite library mode via Nx |

---

## Running Storybook

```sh
yarn nx storybook arena-ui
```

Storybook launches at `http://localhost:6006`. Every component has its own story file (`.stories.tsx`) documenting available variants and props.

---

## Importing Components

The library exposes a clean public API from `src/index.ts`. Import by package name — no deep path imports:

```tsx
import { Button, Panel, HealthBar } from '@average.dev/arena-ui';
```

---

## Available Components

| Component | Description |
|---|---|
| `Button` | Styled button with `variant` prop (`primary`, `secondary`, `ghost`) |
| `TextInput` | Styled text input with label and validation state support |
| `Panel` | Glassmorphism-style card — used for modals, info boxes, and overlays |
| `HealthBar` | Animated horizontal bar; accepts `current` and `max` values |
| `ThemeToggle` | Toggle switch that flips `data-theme` on `<html>` between `light` and `dark` |

---

## CSS Token System

Styles follow a two-layer custom property architecture defined in `src/lib/tokens.scss` (or similar):

### Layer 1 — Primitive tokens (on `:root`)

Raw values. Never use these directly in component styles.

```css
:root {
  --color-purple-500: #7c3aed;
  --color-grey-900: #111827;
  --space-4: 1rem;
  --radius-md: 0.5rem;
  /* … */
}
```

### Layer 2 — Semantic tokens (reference primitives)

These carry meaning. Component styles use semantic tokens only, which is why theme switching works without touching component code.

```css
:root {
  --color-bg-surface: var(--color-grey-900);
  --color-text-primary: #f9fafb;
  --color-accent: var(--color-purple-500);
}

[data-theme='light'] {
  --color-bg-surface: #ffffff;
  --color-text-primary: var(--color-grey-900);
  --color-accent: var(--color-purple-600);
}
```

`ThemeToggle` sets `document.documentElement.dataset.theme = 'light' | 'dark'` to activate the correct overrides.

---

## How to Add a New Component

Follow this checklist to keep the library consistent:

### 1. Create the component directory

```
src/components/my-widget/
├── MyWidget.tsx
├── MyWidget.module.scss
└── MyWidget.stories.tsx
```

### 2. Write the component

```tsx
// src/components/my-widget/MyWidget.tsx
import styles from './MyWidget.module.scss';

export interface MyWidgetProps {
  label: string;
  variant?: 'default' | 'compact';
}

export function MyWidget({ label, variant = 'default' }: MyWidgetProps) {
  return (
    <div className={`${styles.root} ${styles[variant]}`}>
      {label}
    </div>
  );
}
```

### 3. Write the styles using semantic tokens

```scss
// src/components/my-widget/MyWidget.module.scss
.root {
  background: var(--color-bg-surface);
  color: var(--color-text-primary);
  border-radius: var(--radius-md);
  padding: var(--space-4);
}

.compact {
  padding: var(--space-2);
}
```

### 4. Write a story

```tsx
// src/components/my-widget/MyWidget.stories.tsx
import type { Meta, StoryObj } from '@storybook/react';
import { MyWidget } from './MyWidget';

const meta: Meta<typeof MyWidget> = {
  title: 'Arena UI/MyWidget',
  component: MyWidget,
};
export default meta;

type Story = StoryObj<typeof MyWidget>;

export const Default: Story = {
  args: { label: 'Hello World' },
};

export const Compact: Story = {
  args: { label: 'Hello World', variant: 'compact' },
};
```

### 5. Export from the library's public API

```ts
// src/index.ts
export { MyWidget } from './components/my-widget/MyWidget';
export type { MyWidgetProps } from './components/my-widget/MyWidget';
```

The component is now importable as `import { MyWidget } from '@average.dev/arena-ui'`.

---

## Running Tests

```sh
yarn nx test arena-ui
```
