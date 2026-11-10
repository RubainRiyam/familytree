#!/usr/bin/env bash
# Spins up a throwaway local Postgres, applies the migrations and runs the smoke tests.
# Needs Postgres 15+ binaries on PATH (initdb, pg_ctl, psql). Does not touch Supabase.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
D="$(mktemp -d)"; PORT="${PGTEST_PORT:-54329}"
trap 'pg_ctl -D "$D/data" -m immediate stop >/dev/null 2>&1 || true; rm -rf "$D"' EXIT
initdb -D "$D/data" -U postgres -A trust >/dev/null
pg_ctl -D "$D/data" -o "-p $PORT -c listen_addresses='' -k $D" -w start >/dev/null
P="psql -v ON_ERROR_STOP=1 -q -h $D -p $PORT -U postgres"
$P -c "create database aalthara_test" >/dev/null
$P -d aalthara_test -f "$ROOT/supabase/tests/00_local_stubs.sql" >/dev/null
for f in "$ROOT"/supabase/migrations/0001_*.sql; do $P -d aalthara_test -f "$f" >/dev/null; done
$P -d aalthara_test -f "$ROOT/supabase/tests/01_smoke.sql"
