#!/usr/bin/env bash
set -euo pipefail

if [ ! -f .env ]; then
  echo "Error: .env file not found."
  echo "Copy docker-compose.env.example to .env and fill in your secrets:"
  echo "  cp docker-compose.env.example .env"
  exit 1
fi

docker compose --env-file .env up -d --build