# Deploy Configuration

This directory contains Docker Compose and Caddy configuration files for each service hosted on the Raspberry Pi lab.

## Structure

```
deploy/
  arena/
    docker-compose.yml   — Arena game server + Caddy reverse proxy
    Caddyfile            — Caddy routing rules for arena-api WebSocket + static files
  home/
    docker-compose.yml   — Home website API + Caddy
    Caddyfile            — Caddy routing rules for home-web
```

## Arena Stack

The arena stack serves two things:
1. `arena-api` — Colyseus WebSocket game server (port 2567)
2. `arena-caddy` — Static file server for arena-web + WebSocket reverse proxy (port 3000)

Caddy routes `/ws/*` and `/matchmake/*` to the game server, and serves all other paths from the built arena-web static files.

## Home Stack

The home stack serves the average.dev home page website via a Go API + Caddy.

## Deploying

Deployment is handled automatically by the GitHub Actions workflows on push to `main`.
You can also trigger manually via `workflow_dispatch` in the GitHub Actions UI.
