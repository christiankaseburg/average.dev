#!/usr/bin/env bash

# Exit immediately if a command exits with a non-zero status
set -e

ROLE=$1

if [ "$ROLE" != "build" ] && [ "$ROLE" != "host" ]; then
  echo "Error: Invalid or missing role argument."
  echo "Usage: $0 [build|host]"
  exit 1
fi

echo "===================================================="
echo "    Raspberry Pi Environment Bootstrap Script ($ROLE)"
echo "===================================================="

# Helper function to check if a command exists
command_exists() {
  command -v "$1" >/dev/null 2>&1
}

# Determine Architecture
ARCH=$(uname -m)
echo "System architecture: $ARCH"

# 1. Update package list
echo "Updating apt package list..."
sudo apt-get update -y

# 2. Check & Install Git, Curl
echo "Checking Git & Curl..."
sudo apt-get install -y git curl build-essential

# 3. Check & Install Docker (Needed by both: build for building api image, host for running containers)
if command_exists docker; then
  echo "Docker is already installed: $(docker --version)"
else
  echo "Installing Docker..."
  curl -fsSL https://get.docker.com -o get-docker.sh
  sudo sh get-docker.sh
  rm get-docker.sh
  # Add current user to docker group
  sudo usermod -aG docker "$USER"
  echo "Docker installed successfully. Note: You may need to log out and back in for group changes to take effect."
fi

# 4. Check & Install Docker Compose (Needed by both: build for testing, host for running services)
if docker compose version >/dev/null 2>&1; then
  echo "Docker Compose is already installed: $(docker compose version)"
else
  echo "Installing Docker Compose..."
  sudo apt-get install -y docker-compose-plugin
  echo "Docker Compose installed successfully."
fi

# Build-specific toolchain dependencies (Node, Yarn, Go)
if [ "$ROLE" = "build" ]; then
  # 5. Check & Install Node.js
  if command_exists node; then
    echo "Node.js is already installed: $(node --version)"
  else
    echo "Installing Node.js (v20)..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
    echo "Node.js installed: $(node --version)"
  fi

  # 6. Check & Install Yarn
  if command_exists yarn; then
    echo "Yarn is already installed: $(yarn --version)"
  else
    echo "Installing Yarn..."
    sudo corepack enable || sudo npm install -g yarn
    echo "Yarn installed: $(yarn --version)"
  fi

  # 7. Check & Install Go
  if command_exists go; then
    echo "Go is already installed: $(go version)"
  else
    echo "Installing Go (1.22.5)..."
    GO_VER="1.22.5"
    
    if [ "$ARCH" = "x86_64" ]; then
      GO_ARCH="amd64"
    elif [ "$ARCH" = "aarch64" ] || [ "$ARCH" = "arm64" ]; then
      GO_ARCH="arm64"
    elif [[ "$ARCH" == armv* ]]; then
      GO_ARCH="armv6l"
    else
      echo "Unknown architecture $ARCH, skipping Go automatic install. Install manually from https://go.dev/dl/"
      GO_ARCH=""
    fi

    if [ -n "$GO_ARCH" ]; then
      curl -OL "https://go.dev/dl/go${GO_VER}.linux-${GO_ARCH}.tar.gz"
      sudo rm -rf /usr/local/go
      sudo tar -C /usr/local -xzf "go${GO_VER}.linux-${GO_ARCH}.tar.gz"
      rm "go${GO_VER}.linux-${GO_ARCH}.tar.gz"
      
      # Add to shell profile if not present
      if ! grep -q "/usr/local/go/bin" ~/.bashrc; then
        echo 'export PATH=$PATH:/usr/local/go/bin' >> ~/.bashrc
        echo 'export PATH=$PATH:$HOME/go/bin' >> ~/.bashrc
      fi
      # Set path in current script context
      export PATH=$PATH:/usr/local/go/bin
      echo "Go installed successfully: $(go version)"
    fi
  fi
fi

echo "===================================================="
echo "    Bootstrap ($ROLE) Complete!"
echo "===================================================="
