#!/bin/sh
set -eu

ROOT="$(cd "$(dirname "$0")/.." && pwd)"

stop_port() {
  port="$1"
  name="$2"
  pids="$(lsof -ti tcp:"$port" 2>/dev/null || true)"

  if [ -z "$pids" ]; then
    echo "$name is not listening on port $port"
    return 0
  fi

  for pid in $pids; do
    echo "Stopping $name process $pid"
    kill "$pid" 2>/dev/null || true
  done
}

stop_port 5173 "frontend"
stop_port 3000 "backend"

if command -v docker >/dev/null 2>&1; then
  if docker compose version >/dev/null 2>&1; then
    (cd "$ROOT" && docker compose stop mysql)
  elif command -v docker-compose >/dev/null 2>&1; then
    (cd "$ROOT" && docker-compose stop mysql)
  fi
fi
