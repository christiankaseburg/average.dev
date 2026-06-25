# Repository Blueprint: Monorepo Architecture

## 🎯 Project Mission
This monorepo houses the average.dev business platform. The ecosystem consists of isolated backend APIs, shared utility/feature libraries, and frontend web-based client applications.

## 🗺️ Workspace Architecture
- `/apps/`: Backend and frontend application packages (e.g., api, web, admin dashboards).
- `/libs/`: Reusable packages and modules (e.g., UI components, DB models, shared types).
- `/.agents/`: Internal IDE directory containing system-level engine behaviors and rules.

## 🛠️ Global Monorepo Operations
When performing tasks at the root level, utilize workspace-aware package manager and Nx tool constraints:
- Install a dependency at the workspace root: `yarn add <pkg> -D` (devDependency) or `yarn add <pkg>`
- Run all test suites across the workspace: `yarn nx run-many -t test`
- Build all projects concurrently: `yarn nx run-many -t build`
- Run linter across all projects: `yarn nx run-many -t lint`

## 💼 Essential Business Domain Rules
1. Every shared library in `/libs/` must expose a clean public API via `index.ts` (or standard entrypoint) and should not do deep internal imports across libraries.
2. Under no circumstance should a client payload mutate financial currency values directly; all monetary transactions must pass through a validation ledger.
3. Every application or tool built under the average.dev domain must prioritize visual aesthetics and user-friendly, elegant interfaces.
