#!/usr/bin/env bash
# Spins up a throwaway local Postgres, applies every migration and runs the tests in supabase/tests.
# Needs Postgres 15+ binaries (initdb, pg_ctl, psql); Debian/Ubuntu keep them in
# /usr/lib/postgresql/<v>/bin, which is added to PATH automatically. Must run as a non-root user
# (initdb refuses root). Does not touch Supabase.
#   GEN_TYPES=1 scripts/test-db.sh   also regenerates packages/core/database.types.ts
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
if ! command -v initdb >/dev/null; then
  PGBIN="$(ls -d /usr/lib/postgresql/*/bin 2>/dev/null | sort -V | tail -1 || true)"
  [ -n "$PGBIN" ] && export PATH="$PGBIN:$PATH"
fi
command -v initdb >/dev/null || { echo "initdb not found: install Postgres 15+ binaries" >&2; exit 2; }
if [ "$(id -u)" = 0 ]; then echo "initdb cannot run as root; run as another user (e.g. su postgres)" >&2; exit 2; fi
D="$(mktemp -d)"; PORT="${PGTEST_PORT:-54329}"
trap 'pg_ctl -D "$D/data" -m immediate stop >/dev/null 2>&1 || true; rm -rf "$D"' EXIT
initdb -D "$D/data" -U postgres -A trust >/dev/null
pg_ctl -D "$D/data" -o "-p $PORT -c listen_addresses='' -k $D" -w start >/dev/null
P="psql -v ON_ERROR_STOP=1 -q -h $D -p $PORT -U postgres"
$P -c "create database aalthara_test" >/dev/null
$P -d aalthara_test -f "$ROOT/supabase/tests/00_local_stubs.sql" >/dev/null
for f in "$ROOT"/supabase/migrations/*.sql; do $P -d aalthara_test -f "$f" >/dev/null; done
for f in "$ROOT"/supabase/tests/0[1-9]_*.sql; do $P -d aalthara_test -f "$f"; done
if [ "${GEN_TYPES:-}" = 1 ]; then
  $P -d aalthara_test -At -f "$ROOT/scripts/db-introspect.sql" | node "$ROOT/scripts/gen-db-types.ts" > "$ROOT/packages/core/database.types.ts"
  echo "wrote packages/core/database.types.ts"
fi
