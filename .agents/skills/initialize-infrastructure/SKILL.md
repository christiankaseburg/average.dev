---
name: initialize-infrastructure
description: Use this skill when generating or updating the AWS infrastructure for an application, focusing on OpenTofu, environments, and OIDC CI/CD.
---
# Initialize Infrastructure

When tasked with setting up AWS infrastructure for a new application in the monorepo, follow these patterns. We use **OpenTofu** (`tofu`).

## 1. Directory Architecture
Our IaC is located in `infra/` at the workspace root and is structured to support multiple environments within a single AWS account.
- **`infra/modules/`**: Contains reusable component definitions named after the application (e.g., `average-dev-web` for S3 + CloudFront, `dns` for Route53).
- **`infra/env/dev/`**: The Development environment state. Instantiates modules with `dev` prefixes. Maps to `dev.average.dev` subdomains.
- **`infra/env/prod/`**: The Production environment state. Instantiates modules with `prod` prefixes. Maps to `average.dev` domains.

## 2. Setting Up a New Web App
When adding a new static frontend (React/Vite) to AWS:
1. Open `infra/env/dev/main.tf` and `infra/env/prod/main.tf`.
2. Instantiate the module for the new application (e.g., `average-dev-web`).
3. **Naming Convention:** Name the bucket `average-dev-<app-name>-<env>`.
4. Ensure resources are tagged with `Project = "average.dev"` and `Application = "<app-name>"`.

## 3. GitHub Actions & OIDC
We use OIDC (OpenID Connect) for CI/CD authentication to AWS. **DO NOT** create IAM Access Keys.
- Add deployment workflows in `.github/workflows/deploy-<app-name>-dev.yml` (triggers on `dev` branch) and `.github/workflows/deploy-<app-name>-prod.yml` (triggers on `main` branch).
- The workflow should use `aws-actions/configure-aws-credentials` with `role-to-assume`.
- Run `tofu init` and `tofu apply -auto-approve` to update infra.
- Build the app with `yarn nx build <app-name>` and sync to S3 (`aws s3 sync dist/apps/<app-name> s3://<bucket-name>`).

## 4. Bootstrapping (Remote State)
If you are initializing a brand new AWS account, reference `infra/README.md` for instructions on bootstrapping the remote state bucket before applying environment configurations.
