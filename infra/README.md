# Infrastructure (OpenTofu)

This directory contains the Infrastructure as Code (IaC) for the `average.dev` monorepo. We use [OpenTofu](https://opentofu.org/) (`tofu`) as our provisioning engine.

## Architecture & Environments

We use a single-account architecture organized into environments using directories. This allows us to keep Dev and Prod isolated in state while sharing module definitions, making it easy to migrate to AWS Organizations (multi-account) in the future.

- `modules/`: Reusable Tofu components (e.g., static web app, DNS setup).
- `env/dev/`: Instantiates modules for the `dev` environment (`dev.average.dev`).
- `env/prod/`: Instantiates modules for the `prod` environment (`average.dev`).

## Adding Infrastructure for a New App

If you are an agent or a developer adding a new application to AWS, refer to the [initialize-infrastructure skill](../.agents/skills/initialize-infrastructure/SKILL.md) for the exact steps to follow.

## Authentication (Local & CI/CD)

### 1. Local Authentication (For Bootstrapping)
To run OpenTofu locally during the initial bootstrap phase, you must configure your local machine with AWS Administrator credentials:
1. It is recommended to use AWS IAM Identity Center (SSO). Create an SSO user with `AdministratorAccess`.
2. Run `aws configure sso` in your terminal and follow the browser prompts.
3. Export your profile: `export AWS_PROFILE=your-profile-name`.
4. OpenTofu automatically detects your active AWS CLI profile and uses it to provision resources.

### 2. GitHub Actions Authentication (OIDC)
Our CI/CD pipeline is **passwordless**. We do NOT store long-lived AWS Access Keys in GitHub Secrets (which is a major security risk). Instead, we use OpenID Connect (OIDC).

**How it works:**
1. You only need one GitHub Repository Secret: `AWS_ACCOUNT_ID` (your 12-digit AWS account number).
2. The `aws-actions/configure-aws-credentials` step in our GitHub workflow asks GitHub for a short-lived JSON Web Token (JWT).
3. The runner sends this JWT to AWS STS, asking to assume the `github-actions-deploy-web-*` IAM role.
4. AWS verifies the JWT cryptographically against the OIDC Identity Provider we created in the `global` environment.
5. AWS checks the IAM Role's Trust Policy. It verifies that the token came specifically from the `christiankaseburg/average.dev` repository AND that the workflow is running on the correct branch (e.g., `main` or `dev`).
6. If everything matches, AWS grants the runner temporary credentials that expire in 1 hour.

## GitHub Repository Configuration Checklist

Before the CI/CD pipeline will work, you must manually configure the following settings in your GitHub Repository (`Settings` tab):

### 1. Repository Secrets
Navigate to **Settings -> Secrets and variables -> Actions**.
Create a **New repository secret**:
- **Name**: `AWS_ACCOUNT_ID`
- **Secret**: Your 12-digit AWS account number (e.g., `123456789012`). Do not include hyphens.

### 2. Environments (Manual Approvals)
To prevent accidental production deployments, our pipeline relies on GitHub Environments to pause execution until you manually approve it.
1. Navigate to **Settings -> Environments**.
2. Click **New environment** and name it exactly `production`.
3. Check the box for **Required reviewers**.
4. Search for your GitHub username and add yourself as the reviewer. 
5. Click **Save protection rules**.

When the CI/CD pipeline reaches the `deploy-prod-infra` step, it will pause indefinitely and send you an email. You can then review the Dev deployment and click "Approve and Deploy" in the GitHub UI to push it to Prod.

## Bootstrapping a New Platform (The "Chicken-and-Egg")

If you are setting this monorepo up in a brand new AWS account from scratch, you will run into a "Chicken-and-Egg" problem: GitHub Actions cannot deploy the infrastructure because the IAM roles that grant it permissions do not exist yet. Furthermore, OpenTofu cannot create its own S3 remote state bucket because it needs a place to store the state of that bucket creation.

To bootstrap the platform, you must perform these steps manually **once** from your local machine using an Admin AWS CLI profile:

### 1. The State Container
You must manually create an S3 bucket (e.g., `average-dev-tofu-state-bucket`) and a DynamoDB table (`average-dev-tofu-state-lock`) in the AWS console or via CLI. 
Once created, configure the `backend.tf` files in each environment to point to these resources, and run `tofu init -migrate-state`.

### 2. DNS & OIDC (The `global` environment)
The `infra/env/global` environment contains resources that are shared across the entire AWS account (Route53 DNS and GitHub OIDC Providers).
1. `cd infra/env/global` and run `tofu init && tofu apply` from your local machine.
2. This will provision the **Route53 Hosted Zone** and the **GitHub OIDC Identity Provider**.
3. **DNS Handoff**: Open the AWS console, look at the NS (NameServer) records created in Route53, and manually copy those 4 addresses into your Domain Registrar (e.g., Squarespace) to delegate DNS authority to AWS.

### 3. The CI/CD Handoff
Once the `global` environment is applied and the GitHub Actions OIDC roles exist, **your local machine's job is done**. 
You should never need to run `tofu apply` locally again. You can now push your code to GitHub, and the CI/CD pipeline will autonomously assume the OIDC roles to deploy the `dev` and `prod` environments.
