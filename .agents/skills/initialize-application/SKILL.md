---
name: initialize-application
description: Use this skill when initializing a new frontend application in the monorepo to ensure it follows the correct aesthetic and structural standards.
---
# Initialize Application

When tasked with generating a new frontend application for the `average.dev` monorepo, follow these steps to ensure consistency:

## 1. Nx Scaffold Command
Use the following command to generate the application. This ensures we standardize on Vite, SCSS, and correct project structure.

> [!IMPORTANT]
> **Naming Convention:** Applications must follow the `<app-name>-web`, `<app-name>-api`, `<app-name>-worker` pattern. For example, `average-dev-web`.

```bash
yarn nx g @nx/react:application <app-name> --directory=apps/<app-name> --bundler=vite --e2eTestRunner=none --style=scss --projectNameAndRootFormat=as-provided --linter=eslint
```

## 2. Aesthetics & Styling
According to `agents.md`, all apps must prioritize visual aesthetics and user-friendly, elegant interfaces.
- **Do not leave the default Nx welcome component.**
- Replace `src/app/app.tsx` and `src/app/app.module.scss` with a custom layout that uses modern CSS (CSS variables, flexbox/grid, subtle animations, backdrop filters if appropriate).
- Use `Inter` or a similar premium modern font.

## 3. Infrastructure Prep
Ensure the app has a deployment plan. Reference the `initialize-infrastructure` skill to set up OpenTofu resources and GitHub Actions for CI/CD.
