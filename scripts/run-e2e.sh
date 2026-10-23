#!/usr/bin/env bash
set -Eeuo pipefail

ROOT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
CONTAINER_NAME=""
CONTAINER_STARTED=0
API_PID=""
FRONTEND_PID=""

cleanup() {
  local exit_code=$?
  trap - EXIT INT TERM
  for process_id in "$FRONTEND_PID" "$API_PID"; do
    if [[ -n "$process_id" ]]; then
      kill "$process_id" 2>/dev/null || true
    fi
  done
  for process_id in "$FRONTEND_PID" "$API_PID"; do
    if [[ -n "$process_id" ]]; then
      wait "$process_id" 2>/dev/null || true
    fi
  done
  if [[ "$CONTAINER_STARTED" == 1 ]]; then
    docker stop "$CONTAINER_NAME" >/dev/null 2>&1 || true
  fi
  exit "$exit_code"
}
trap cleanup EXIT
trap 'exit 130' INT
trap 'exit 143' TERM

if ! node -e 'const [nodeMajor, npmMajor] = [Number(process.versions.node.split(".")[0]), Number(require("child_process").execFileSync("npm", ["--version"], {encoding:"utf8"}).trim().split(".")[0])]; if (nodeMajor < 22 || npmMajor < 10) process.exit(1);'; then
  echo 'Cypress E2E requires Node.js 22+ and npm 10+.' >&2
  exit 1
fi

if [[ "${GITHUB_ACTIONS:-}" == "true" && "${CI:-}" == "true" ]]; then
  DATABASE_URL="${ZABAY_E2E_DATABASE_URL:-}"
  if [[ -z "$DATABASE_URL" ]]; then
    echo 'CI must provide ZABAY_E2E_DATABASE_URL for its isolated PostgreSQL service.' >&2
    exit 1
  fi
else
  if [[ -n "${ZABAY_E2E_DATABASE_URL:-}" ]]; then
    echo 'External E2E databases are accepted only in CI; local runs always create a fresh disposable container.' >&2
    exit 1
  fi
  if ! command -v docker >/dev/null || ! command -v psql >/dev/null || ! command -v curl >/dev/null; then
    echo 'Local E2E runs require Docker, psql, and curl.' >&2
    exit 1
  fi

  CONTAINER_NAME="zabay-e2e-pg-$$-$RANDOM"
  docker run --detach --rm --name "$CONTAINER_NAME" \
    --env POSTGRES_USER=zabay \
    --env POSTGRES_PASSWORD=zabay_e2e \
    --env POSTGRES_DB=zabay_e2e_test \
    --publish 127.0.0.1::5432 \
    postgres:16 >/dev/null
  CONTAINER_STARTED=1
  port_mapping="$(docker port "$CONTAINER_NAME" 5432/tcp | head -n 1)"
  database_port="${port_mapping##*:}"
  DATABASE_URL="postgresql://zabay:zabay_e2e@127.0.0.1:${database_port}/zabay_e2e_test"
fi

if ! node - "$DATABASE_URL" <<'NODE'
const database = new URL(process.argv[2]);
const name = decodeURIComponent(database.pathname.slice(1));
if (!['postgres:', 'postgresql:'].includes(database.protocol) || !/(^|[_-])test([_-]|$)/i.test(name)) {
  console.error('Refusing E2E database access: PostgreSQL database name must contain a test segment.');
  process.exit(1);
}
NODE
then
  exit 1
fi

npm ci --prefix "$ROOT_DIR/frontend"
npm ci --prefix "$ROOT_DIR/backend"

database_ready=0
for attempt in {1..60}; do
  if psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -c 'SELECT 1' >/dev/null 2>&1; then
    database_ready=1
    break
  fi
  sleep 1
done
if [[ "$database_ready" != 1 ]]; then
  echo 'PostgreSQL test database did not become ready.' >&2
  exit 1
fi

psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f "$ROOT_DIR/db/schema.sql"
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f "$ROOT_DIR/db/seeds/bohol_venues_seed.sql"
TEST_DATABASE_URL="$DATABASE_URL" DATABASE_URL="$DATABASE_URL" npm test --prefix "$ROOT_DIR/backend"

API_PORT="${ZABAY_E2E_API_PORT:-5500}"
FRONTEND_PORT="${ZABAY_E2E_FRONTEND_PORT:-5174}"
API_URL="http://127.0.0.1:${API_PORT}"
FRONTEND_URL="http://127.0.0.1:${FRONTEND_PORT}"

DATABASE_URL="$DATABASE_URL" PORT="$API_PORT" CLIENT_URL="$FRONTEND_URL" \
  node "$ROOT_DIR/backend/dist/server.js" &
API_PID=$!

ZABAY_API_URL="$API_URL" "$ROOT_DIR/frontend/node_modules/.bin/vite" \
  --host 127.0.0.1 --port "$FRONTEND_PORT" --strictPort &
FRONTEND_PID=$!

api_ready=0
frontend_ready=0
for attempt in {1..60}; do
  if [[ "$api_ready" != 1 ]] && curl --fail --silent "$API_URL/api/health" >/dev/null; then
    api_ready=1
  fi
  if [[ "$frontend_ready" != 1 ]] && curl --fail --silent "$FRONTEND_URL/" >/dev/null; then
    frontend_ready=1
  fi
  if [[ "$api_ready" == 1 && "$frontend_ready" == 1 ]]; then
    break
  fi
  if ! kill -0 "$API_PID" 2>/dev/null || ! kill -0 "$FRONTEND_PID" 2>/dev/null; then
    echo 'A test service exited before readiness; check the service output above.' >&2
    exit 1
  fi
  sleep 1
done
if [[ "$api_ready" != 1 || "$frontend_ready" != 1 ]]; then
  echo 'API or frontend did not become ready.' >&2
  exit 1
fi

export ZABAY_E2E_DATABASE_URL="$DATABASE_URL"
export CYPRESS_BASE_URL="$FRONTEND_URL"
cd "$ROOT_DIR/frontend"
if [[ "${1:-}" == "--open" ]]; then
  ./node_modules/.bin/cypress open --browser chrome
else
  ./node_modules/.bin/cypress run --browser chrome
fi
