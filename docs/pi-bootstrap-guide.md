# Raspberry Pi Cluster Setup & Bootstrapping Guide

This guide describes how to configure and deploy the home laboratory stack (`home-web` and `home-api`) on your self-hosted Raspberry Pi cluster.

---

## 1. Cluster Architecture

The cluster consists of two Raspberry Pi servers running Ubuntu Server:
1. **Build Server (`pi-builder`)**: Compiles React assets, builds multi-stage Go API Docker images, and pushes them to GitHub Container Registry (GHCR).
   * **GitHub Runner Label**: `pi-build-server`
2. **Hosting Server (`pi-host`)**: Orchestrates the Docker Compose stack (serving static files via Caddy on port 80 and the API on port 8080).
   * **GitHub Runner Label**: `pi-host-server`

---

## 2. GitHub Actions Runner Installation

Before running the bootstrapping steps, ensure that the GitHub Actions self-hosted runner daemon is installed on each Pi:

1. In your GitHub repository, go to **Settings** -> **Actions** -> **Runners** -> **New self-hosted runner**.
2. Select **Linux** and **ARM64**.
3. Follow the instructions to download and extract the runner package on your Pi.
4. When configuring the runner (`./config.sh`), assign the correct labels:
   * Build Pi labels: `self-hosted, pi-build-server`
   * Hosting Pi labels: `self-hosted, pi-host-server`
5. Configure the runner to run as a system service so it automatically starts on system boot:
   ```bash
   sudo ./svc.sh install
   sudo ./svc.sh start
   ```

---

## 3. Host System Bootstrapping

Dependencies are managed using role-specific scripts. These are designed to be run **manually once** via SSH (so you can securely provide your sudo password).

### Step A: Bootstrap the Build Server (`pi-builder`)
SSH into `pi-builder` and run:
```bash
# Navigate to the checked-out runner workspace
cd ~/actions-runner/_work/average.dev/average.dev/

# Make the script executable and run it
chmod +x scripts/bootstrap-build-pi.sh
./scripts/bootstrap-build-pi.sh
```
* **Installed Runtimes**: Docker Engine, Node.js (v20), Yarn, and Go compiler (v1.22.5).

### Step B: Bootstrap the Hosting Server (`pi-host`)
SSH into `pi-host` and run:
```bash
# Navigate to the checked-out runner workspace
cd ~/actions-runner/_work/average.dev/average.dev/

# Make the script executable and run it
chmod +x scripts/bootstrap-host-pi.sh
./scripts/bootstrap-host-pi.sh
```
* **Installed Runtimes**: Docker Engine and Docker Compose plugin (no compilers or Node runtimes are installed, keeping this environment lightweight).

### Step C: Apply Group Permissions (Reboot)
For group changes to take effect so that the GitHub Runner process can interact with Docker without `sudo`, reboot both devices:
```bash
sudo reboot
```

---

## 4. CI/CD & Deployment Workflows

Once the Pis are bootstrapped, deployments occur automatically on git pushes:

1. **`test-affected.yml` (CI Checks)**: Runs on GitHub-hosted cloud agents to check ESLint, code style, and test results for all projects affected by the push.
2. **`deploy-home-lab.yml` (CD Pipeline)**: 
   * **Stage 1 (Build)**: Runs on the self-hosted `pi-build-server`. Builds Vite assets, compiles the API Docker image, and pushes it to your private GHCR registry.
   * **Stage 2 (Deploy)**: Runs on the self-hosted `pi-host-server`. Pulls the updated container from GHCR, updates static files, and spins up/restarts the containers using `docker compose`.
3. **`bootstrap-pi-servers.yml` (Manual Setup)**: A manually-triggered action in the GitHub UI that can execute the bootstrapping scripts on both runners if passwordless sudo (`NOPASSWD`) is configured for the runner user.

---

## 5. Verification & Network Access

Once the deployment pipeline completes successfully, access the services using the Hosting Pi's IP address:

* **React Web Frontend**: `http://<Hosting-Pi-IP>/` (default port 80)
* **Go Gin API Health Check**: `http://<Hosting-Pi-IP>:8080/api/health`
* **Go Gin API Version Check**: `http://<Hosting-Pi-IP>:8080/api/version`

To inspect live API logs directly on the Hosting Pi:
```bash
cd ~/actions-runner/_work/average.dev/average.dev/apps
docker compose logs -f home-api
```
