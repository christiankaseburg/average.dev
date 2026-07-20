# average.dev Monorepo

<a alt="Nx logo" href="https://nx.dev" target="_blank" rel="noreferrer"><img src="https://raw.githubusercontent.com/nrwl/nx/master/images/nx-logo.png" width="45"></a>

## 🛠️ Local Setup & Prerequisites

Welcome to the average.dev monorepo! Before you begin, ensure your local development environment is set up.

### 1. Node.js & NVM

### 1. Node.js & Fast Node Manager (fnm)

This repository enforces strict Node.js versioning via the `.nvmrc` file at the root. We strongly recommend using Fast Node Manager (`fnm`):

- **Windows**: `winget install Schniz.fnm`
- **macOS/Linux**: `brew install fnm` or curl installation.

Once installed, ensure your terminal profile is configured for `fnm`. For PowerShell, you must run this to apply it to your current session, and also add it to your profile for future sessions:

```powershell
# Apply to current session:
fnm env --use-on-cd | Out-String | Invoke-Expression

# Add to profile for future sessions:
notepad $PROFILE
# Add the line below to the bottom and save.
fnm env --use-on-cd | Out-String | Invoke-Expression
```

After configuring your terminal, navigate to the repository root. If this is your first time setting up the repository, download the required Node version specified in `.nvmrc`:

```sh
fnm install
```

`fnm` will now automatically switch to the correct Node version whenever you enter the directory.

### 2. Yarn

We use Yarn as our package manager. With the correct Node version active via `fnm`, enable Yarn via Corepack:

```sh
corepack enable yarn
yarn install
```

> [!NOTE]
> Node.js ships with Corepack but it is opt-in by default. Running `corepack enable yarn` makes the `yarn` command available in your terminal without needing a global npm install, and guarantees you use the exact Yarn version specified in the project.

> [!WARNING]
> If you get an error saying **`corepack: The term 'corepack' is not recognized`** or **`yarn: The term 'yarn' is not recognized`**, it means `fnm` was not loaded into your current shell. You can fix this immediately by running:
> ```powershell
> fnm env --use-on-cd | Out-String | Invoke-Expression
> ```

### 3. Go (Golang)

If you are working on Go services within this monorepo, you need the Go toolchain installed:

- **Windows**: Download the MSI installer from [go.dev/dl/](https://go.dev/dl/).
- **macOS**: `brew install go`
- Verify installation by running `go version`. We use `golangci-lint` for linting, which is configured via `.golangci.yml`.

---

✨ Your new, shiny [Nx workspace](https://nx.dev) is ready ✨.

[Learn more about this workspace setup and its capabilities](https://nx.dev/getting-started/intro#learn-nx?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects) or run `yarn nx graph` to visually explore what was created. Now, let's get you up to speed!

## Run tasks

To run tasks with Nx use:

```sh
npx nx <target> <project-name>
```

For example:

```sh
npx nx build myproject
```

These targets are either [inferred automatically](https://nx.dev/concepts/inferred-tasks?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects) or defined in the `project.json` or `package.json` files.

[More about running tasks in the docs &raquo;](https://nx.dev/features/run-tasks?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)

## Add new projects

While you could add new projects to your workspace manually, you might want to leverage [Nx plugins](https://nx.dev/concepts/nx-plugins?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects) and their [code generation](https://nx.dev/features/generate-code?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects) feature.

To install a new plugin you can use the `nx add` command. Here's an example of adding the React plugin:

```sh
npx nx add @nx/react
```

Use the plugin's generator to create new projects. For example, to create a new React app or library:

```sh
# Generate an app
npx nx g @nx/react:app demo

# Generate a library
npx nx g @nx/react:lib some-lib
```

You can use `npx nx list` to get a list of installed plugins. Then, run `npx nx list <plugin-name>` to learn about more specific capabilities of a particular plugin. Alternatively, [install Nx Console](https://nx.dev/getting-started/editor-setup?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects) to browse plugins and generators in your IDE.

[Learn more about Nx plugins &raquo;](https://nx.dev/concepts/nx-plugins?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects) | [Browse the plugin registry &raquo;](https://nx.dev/plugin-registry?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)

## Set up CI!

### Step 1

To connect to Nx Cloud, run the following command:

```sh
npx nx connect
```

Connecting to Nx Cloud ensures a [fast and scalable CI](https://nx.dev/ci/intro/why-nx-cloud?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects) pipeline. It includes features such as:

- [Remote caching](https://nx.dev/ci/features/remote-cache?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)
- [Task distribution across multiple machines](https://nx.dev/ci/features/distribute-task-execution?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)
- [Automated e2e test splitting](https://nx.dev/ci/features/split-e2e-tasks?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)
- [Task flakiness detection and rerunning](https://nx.dev/ci/features/flaky-tasks?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)

### Step 2

Use the following command to configure a CI workflow for your workspace:

```sh
npx nx g ci-workflow
```

[Learn more about Nx on CI](https://nx.dev/ci/intro/ci-with-nx#ready-get-started-with-your-provider?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)

## Install Nx Console

Nx Console is an editor extension that enriches your developer experience. It lets you run tasks, generate code, and improves code autocompletion in your IDE. It is available for VSCode and IntelliJ.

[Install Nx Console &raquo;](https://nx.dev/getting-started/editor-setup?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)

## 🏹 Arena

**Arena** is a medieval top-down multiplayer battle royale built inside this monorepo. Players compete in real time on a shrinking map until only one survives.

**Tech overview:** an authoritative [Colyseus 0.17](https://docs.colyseus.io/) game server (`arena-api`) pushes delta-patched state to a [Phaser 4](https://phaser.io/) game client (`arena-web`) at 20 Hz. React handles the UI shell around the Phaser canvas. Shared types and game constants live in `arena-shared` so both ends of the wire agree on the same definitions.

### Packages

| Package | Path | Description |
|---|---|---|
| `arena-api` | [`apps/arena-api`](apps/arena-api/README.md) | Colyseus game server |
| `arena-web` | [`apps/arena-web`](apps/arena-web/README.md) | Phaser + React game client |
| `arena-shared` | [`libs/arena-shared`](libs/arena-shared/README.md) | Shared types & constants |
| `arena-ui` | [`libs/arena-ui`](libs/arena-ui/README.md) | Shared React UI component library |

### Quick Start

Run both server and client in separate terminals:

```sh
# Terminal 1 — game server
yarn nx dev arena-api

# Terminal 2 — game client (requires arena-api to be running)
yarn nx serve arena-web
```

The client is served at `http://localhost:4200`. The Colyseus server runs at `ws://localhost:2567`. In development, the Colyseus monitor is available at `http://localhost:2567/colyseus`.

---

### 🧟 NPC System

Arena's NPC system uses a **server-authoritative, client-rendered** architecture split across three packages.

#### How it works

```
arena-api (server)          arena-shared (contract)       arena-web (client)
──────────────────          ───────────────────────       ──────────────────
NpcState schema      ──▶   NpcSnapshot interface   ──▶   NpcEntity renders
spawnNpcs() spawns           NpcAction type               NpcSprite animates
  on room create             ('idle'|'walking'|            BootScene loads
AI updates action             'attacking'|'hurt'|          assets + registers
  on each tick               'dead')                      Phaser animations
```

The server sends a **high-level action** (`NpcAction`), not an animation key. The client maps this to the specific animation — for example, randomly choosing `attack1` or `attack2` when the action is `'attacking'`. This keeps bandwidth low and gives the client control over visual variety.

#### Adding a new NPC type

> See `.agents/rules/npc-system.md` for the full step-by-step guide.

1. **Export from Aseprite** → JSON Hash format, Tags checked, item filename `{title} {frame}.aseprite`
2. **Place assets** in `public/npc/<folder>/` (PNG + JSON + .aseprite source)
3. **Add to `NPC_REGISTRY`** in `apps/arena-web/src/game/sprites/NpcDefinition.ts` with asset paths and Aseprite tag name mappings
4. **Add to `NPC_TYPES`** in `libs/arena-shared/src/constants/npc.constants.ts`

No other files need to change — `BootScene` discovers new types from `NPC_REGISTRY` automatically.

#### Key architecture constraints

- **Assets in `public/npc/`**, not `src/assets/` — Phaser fetches them at runtime, Vite does not bundle them
- **`BootScene` owns the full pipeline** — it loads PNG+JSON, builds atlas textures, and registers all Phaser animations globally before `GameScene` starts
- **`NpcSprite` is presentation-only** — it calls `play()` on pre-registered animations; it does not touch assets or JSON
- **`NPC_TYPES` (server) must match `NPC_REGISTRY` keys (client)** — keep these in sync when adding new types

---


## Useful links

Learn more:

- [Learn more about this workspace setup](https://nx.dev/getting-started/intro#learn-nx?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)
- [Learn about Nx on CI](https://nx.dev/ci/intro/ci-with-nx?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)
- [Releasing Packages with Nx release](https://nx.dev/features/manage-releases?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)
- [What are Nx plugins?](https://nx.dev/concepts/nx-plugins?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)

And join the Nx community:

- [Discord](https://go.nx.dev/community)
- [Follow us on X](https://twitter.com/nxdevtools) or [LinkedIn](https://www.linkedin.com/company/nrwl)
- [Our Youtube channel](https://www.youtube.com/@nxdevtools)
- [Our blog](https://nx.dev/blog?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)
