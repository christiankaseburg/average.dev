#!/usr/bin/env bash

# Exit immediately if a command exits with a non-zero status
set -e

echo "===================================================="
echo "    Raspberry Pi Hosting Server Bootstrap Script"
echo "===================================================="

# Helper function to check if a command exists
command_exists() {
  command -v "$1" >/dev/null 2>&1
}

# 1. Update package list
echo "Updating apt package list..."
sudo apt-get update -y

# 2. Check & Install Git, Curl
echo "Checking Git & Curl..."
sudo apt-get install -y git curl build-essential

# 3. Check & Install Docker
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

# 4. Check & Install Docker Compose
if docker compose version >/dev/null 2>&1; then
  echo "Docker Compose is already installed: $(docker compose version)"
else
  echo "Installing Docker Compose..."
  sudo apt-get install -y docker-compose-plugin
  echo "Docker Compose installed successfully."
fi


echo "===================================================="
echo "    Hosting Server Bootstrap Complete!"
echo "===================================================="
