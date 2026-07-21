# Home Lab Deployment Checklist

Automatic deployment has been temporarily disabled. Before re-enabling CI/CD and deploying the `home-api` and `home-web` applications with the new database, the following configuration steps must be completed.

## 1. Domain & DNS Configuration
To solve the `localhost` network routing issues and satisfy Google's OAuth requirements, we will use a real domain name pointed to a local IP.
* Log into your domain registrar (for `average.dev`).
* Create a new **A Record** for a subdomain (e.g., `pi.average.dev`).
* Set the destination IP address to the Raspberry Pi's local network IP (e.g., `192.168.1.65`).

## 2. Google Cloud Platform (GCP)
* Go to the Google Cloud Console for the project housing your OAuth credentials.
* Add the new domain as an Authorized Redirect URI.
  * Example: `http://pi.average.dev/auth/callback/google`

## 3. Reverse Proxy & Frontend Relative Routing
The frontend codebase currently hardcodes `http://localhost:8080`. This must be replaced with relative routes:
* **Frontend Code**: Update `config.ts`, `graphql/client.ts`, and `AuthService.ts` to use relative paths (e.g., `/query`, `/auth/login/google`). Make the WebSocket URI dynamic based on the window host.
* **Vite Config**: Update `vite.config.mts` in `home-web` to proxy `/auth` and `/query` to `http://localhost:8080` for local development.
* **Caddyfile**: Update `deploy/home/Caddyfile` on the Pi to proxy `/auth` and `/query` to the `home-api:8080` container.

## 4. Database Setup & Hardcoded Connection String
Since the API now relies on Postgres, a database must be provided on the Pi.
* Update `deploy/home/docker-compose.yml` to include a `postgres` container with a permanent named volume.
* Inject a hardcoded connection string into the `home-api` environment variables:
  `DATABASE_URL=postgres://postgres:password@postgres:5432/home?sslmode=disable`
* *(Note: We are using a hardcoded string to start, which can be migrated to GitHub Secrets later for enhanced security).*

## 5. Automated Migrations (Goose)
The `home-api` does not run database migrations automatically on boot. We need to add an explicit step to the GitHub Actions deployment pipeline (`.github/workflows/deploy-home-lab.yml`).
* After the `postgres` container starts, the deployment pipeline should run the official `pressly/goose` Docker image.
* It should mount the workspace's `apps/home-api/internal/db/migrations` directory and run `goose up` against the database to ensure the schema is up to date before the API container boots.
