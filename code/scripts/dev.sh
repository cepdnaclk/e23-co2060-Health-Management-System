#!/bin/sh
set -eu

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
BACKEND="$ROOT/backend"
FRONTEND="$ROOT/frontend"
LOGS="$ROOT/.dev-logs"

mkdir -p "$LOGS"

test_port() {
  nc -z 127.0.0.1 "$1" >/dev/null 2>&1
}

wait_port() {
  port="$1"
  name="$2"
  seconds="${3:-30}"
  deadline=$(( $(date +%s) + seconds ))

  while [ "$(date +%s)" -lt "$deadline" ]; do
    if test_port "$port"; then
      echo "$name is listening on port $port"
      return 0
    fi
    sleep 1
  done

  echo "$name did not open port $port within $seconds seconds"
  return 1
}

start_npm() {
  name="$1"
  directory="$2"
  port="$3"
  shift 3

  if test_port "$port"; then
    echo "$name already appears to be running on port $port"
    return 0
  fi

  stdout="$LOGS/$name.out.log"
  stderr="$LOGS/$name.err.log"

  echo "Starting $name..."
  (cd "$directory" && nohup npm "$@" >"$stdout" 2>"$stderr" &)
  wait_port "$port" "$name" 20 >/dev/null || true
}

echo "Starting Invex dev stack..."

if command -v docker >/dev/null 2>&1; then
  echo "Starting MySQL with Docker Compose..."
  if docker compose version >/dev/null 2>&1; then
    compose_command="docker compose"
  elif command -v docker-compose >/dev/null 2>&1; then
    compose_command="docker-compose"
  else
    compose_command=""
  fi

  if [ -z "$compose_command" ]; then
    echo "Docker Compose is not installed."
    echo "The API will still start, and it will connect automatically once MySQL is available."
  elif (cd "$ROOT" && $compose_command up -d mysql); then
    wait_port 3306 "MySQL" 60 >/dev/null || true
  else
    echo "Docker Compose could not start MySQL."
    echo "The API will still start, and it will connect automatically once MySQL is available."
  fi
elif test_port 3306; then
  echo "MySQL already appears to be running on port 3306"
else
  echo "Docker is not installed and MySQL is not listening on port 3306."
  echo "The API will still start, and it will connect automatically once MySQL is available."
fi

start_npm "backend" "$BACKEND" 3000 start
start_npm "frontend" "$FRONTEND" 5173 run dev -- --host 127.0.0.1

echo ""
echo "Frontend: http://127.0.0.1:5173/"
echo "Backend:  http://localhost:3000"
echo "Health:   http://localhost:3000/health"
echo "Logs:     $LOGS"
