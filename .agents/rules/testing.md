# Testing Standards & Verification Workflows

## 🧪 Test Execution Policy
No code modification is complete until the local validation test passes. You are required to run tests using the local workspace tools before notifying the human user.
- Target Command: `npx nx run-many -t test`

## 🛡️ Guardrails
- Always mock external network requests and third-party integrations.
- Write a matching unit test file for every new component or service utility created.
