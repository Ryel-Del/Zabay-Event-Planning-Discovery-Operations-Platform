#!/usr/bin/env bash
set -Eeuo pipefail
ROOT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
PORT="${ZABAY_SMOKE_PORT:-5900}"
DATABASE_URL='postgresql://test:test@127.0.0.1:1/zabay_test'
export DATABASE_URL NODE_ENV=production OPERATOR_USERNAME=smoke-operator OPERATOR_PASSWORD=smoke-password-long-enough PGSSLROOTCERT=/etc/ssl/certs/ca-certificates.crt PORT
for required in DATABASE_URL OPERATOR_USERNAME OPERATOR_PASSWORD; do
  if env -u "$required" node "$ROOT_DIR/backend/dist/server.js" >/tmp/zabay-missing-secret.log 2>&1; then
    echo "Production startup accepted missing $required" >&2
    exit 1
  fi
done
node "$ROOT_DIR/backend/dist/server.js" &
server_pid=$!
trap 'kill "$server_pid" 2>/dev/null || true; wait "$server_pid" 2>/dev/null || true' EXIT
for attempt in {1..30}; do
  if curl --fail --silent "http://127.0.0.1:$PORT/api/health" >/dev/null; then break; fi
  sleep 1
done
curl --fail --silent "http://127.0.0.1:$PORT/" | grep -q '/assets/'
curl --fail --silent "http://127.0.0.1:$PORT/organizer" | grep -q '/assets/'
test "$(curl --silent --output /dev/null --write-out '%{http_code}' "http://127.0.0.1:$PORT/api/ready")" = 503
test "$(curl --silent --output /dev/null --write-out '%{http_code}' "http://127.0.0.1:$PORT/api/unknown")" = 404
test "$(curl --silent --output /dev/null --write-out '%{http_code}' "http://127.0.0.1:$PORT/assets/missing.js")" = 404
echo 'Production smoke passed: startup, assets, SPA, API, failed DB readiness, missing secrets.'
