#!/usr/bin/env bash
set -Eeuo pipefail
ROOT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
PORT="${ZABAY_SMOKE_PORT:-5900}"
DATABASE_URL='postgresql://test:test@127.0.0.1:1/zabay_test'
export DATABASE_URL NODE_ENV=production OPERATOR_USERNAME=smoke-operator OPERATOR_PASSWORD=smoke-password-long-enough PGSSLROOTCERT=/etc/ssl/certs/ca-certificates.crt PORT
if env -u OPERATOR_PASSWORD node "$ROOT_DIR/backend/dist/server.js" >/tmp/zabay-missing-secret.log 2>&1; then
  echo 'Production startup accepted a missing password' >&2
  exit 1
fi
node "$ROOT_DIR/backend/dist/server.js" &
server_pid=$!
trap 'kill "$server_pid" 2>/dev/null || true; wait "$server_pid" 2>/dev/null || true' EXIT
for attempt in {1..30}; do
  if curl --fail --silent "http://127.0.0.1:$PORT/api/health" >/dev/null; then break; fi
  sleep 1
done
curl --fail --silent "http://127.0.0.1:$PORT/" | rg -q '/assets/'
curl --fail --silent "http://127.0.0.1:$PORT/organizer" | rg -q '/assets/'
test "$(curl --silent --output /dev/null --write-out '%{http_code}' "http://127.0.0.1:$PORT/api/ready")" = 503
test "$(curl --silent --output /dev/null --write-out '%{http_code}' "http://127.0.0.1:$PORT/api/unknown")" = 404
echo 'Production smoke passed: startup, assets, SPA, API, failed DB readiness, missing secret.'
