#!/usr/bin/env bash
# PG migrations-only check. The starter PG journal has a 0000 entry without SQL,
# so: push the pre-recipe schema (every pg schema file except directory.ts) to an
# EMPTY database, then apply only the recipe migration and compare with the snapshot.
# usage (repo root): scripts/recipes/directory/pg-migrations-only.sh postgresql://u:p@host/empty_db
set -euo pipefail
URL=${1:?empty PG database URL}
CFG=drizzle.recipe-base.pg.ts
trap 'rm -f "$CFG"' EXIT
cat > "$CFG" <<'TS'
import { defineConfig } from "drizzle-kit";
import { readdirSync } from "node:fs";
const dir = "./libs/database/schema/pg";
export default defineConfig({
  schema: readdirSync(dir).filter((f) => !["directory.ts", "index.ts"].includes(f)).map((f) => `${dir}/${f}`),
  dialect: "postgresql",
  dbCredentials: { url: process.env.MIG_URL! },
});
TS
MIG_URL="$URL" npx drizzle-kit push --force --config="$CFG"
DB_DIALECT=pg MIGRATIONS_PG_URL="$URL" npx tsx scripts/recipes/directory/verify.ts --migrations-only
