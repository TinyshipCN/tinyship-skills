#!/usr/bin/env bash
# One acceptance round on a CLEAN clone of the user's project (committed work).
# usage: acceptance.sh <sqlite|pg|d1> <project-git-dir> <branch> [pg-url-for-fresh-db] [apps...]
#   apps default: next   (any of next nuxt tanstack; D1 round builds only tanstack)
# Prints "RESULT <round> | <step> | PASS|FAIL"; exits non-zero on any FAIL.
set -uo pipefail
R=$1 SRC=$2 BR=$3 PGURL=${4:-postgresql://postgres:postgres@localhost:5432/recipe_round}; shift 3; [ $# -gt 0 ] && shift
APPS=${*:-next}
HERE=$(cd "$(dirname "$0")" && pwd)
W=$(mktemp -d)/round-$R; LOG=$W.logs; mkdir -p "$LOG"; FAILS=0
git clone -q "$SRC" "$W" && cd "$W" && git checkout -q "$BR" || exit 1
res(){ echo "RESULT $R | $1 | $2"; [ "$2" = FAIL ] && FAILS=$((FAILS+1)); }
step(){ local n="$1"; shift; if "$@" >"$LOG/$(echo "$n" | tr -c 'a-zA-Z0-9' _).log" 2>&1; then res "$n" PASS; else res "$n" FAIL; fi; }
sed -e "s|__PORT__|7001|g" -e "s|__SECRET__|$(openssl rand -hex 32)|" -e "s|__DIALECT__|$R|" -e "s|__DATABASE_URL__|$PGURL|" \
  "$HERE/round.env.template" > .env
step "pnpm install" pnpm install --frozen-lockfile
case $R in
  sqlite) step "build db" bash -c 'mkdir -p data && pnpm db:push:sqlite && test -s data/local.sqlite' ;;
  pg)     step "build db (db:push, fresh DB expected)" pnpm db:push ;;
  d1)     step "build db" bash -c 'cd apps/tanstack-app && rm -rf .wrangler/state && cp .dev.vars.example .dev.vars && npx wrangler d1 migrations apply tinyship-db --local' ;;
esac
# the db scripts wrapper prints success even on failure: check the output text
nochg(){ pnpm "$1" >"$LOG/$1.out" 2>&1; grep -q "No schema changes" "$LOG/$1.out"; }
step "db:generate no changes" nochg db:generate
step "db:generate:sqlite no changes" nochg db:generate:sqlite
step "no migration files changed" bash -c 'test -z "$(git status --porcelain libs/database)"'
case $R in
  sqlite) step "recipe SQL re-applies" node -e 'const D=require("better-sqlite3"),fs=require("fs"),f=fs.readdirSync("libs/database/drizzle-sqlite").find(n=>/_recipe_directory_v1\.sql$/.test(n)),db=new D("data/local.sqlite");for(const s of fs.readFileSync("libs/database/drizzle-sqlite/"+f,"utf8").split("--> statement-breakpoint").map(x=>x.trim()).filter(Boolean))db.exec(s)' ;;
  pg)     step "recipe SQL re-applies" node -e 'const {Client}=require("pg"),fs=require("fs"),f=fs.readdirSync("libs/database/drizzle").find(n=>/_recipe_directory_v1\.sql$/.test(n));(async()=>{const c=new Client({connectionString:process.argv[1]});await c.connect();for(const s of fs.readFileSync("libs/database/drizzle/"+f,"utf8").split("--> statement-breakpoint").map(x=>x.trim()).filter(Boolean))await c.query(s);await c.end()})().catch(e=>{console.error(e);process.exit(1)})' "$PGURL" ;;
  d1)     step "recipe SQL re-applies" bash scripts/recipes/directory/d1-reapply.sh ;;
esac
printf '{"extends":"./tsconfig.json","compilerOptions":{"noEmit":true},"files":["scripts/recipes/directory/verify.ts"]}\n' > tsconfig.verify.json
step "verify.ts typecheck" npx tsc -p tsconfig.verify.json
step "verify.ts" env DB_DIALECT=$R npx tsx scripts/recipes/directory/verify.ts
step "verify.ts second run" env DB_DIALECT=$R npx tsx scripts/recipes/directory/verify.ts
[ $R = sqlite ] && step "migrations-only (sqlite)" env DB_DIALECT=sqlite npx tsx scripts/recipes/directory/verify.ts --migrations-only
for a in $APPS; do
  [ $R = d1 ] && [ $a != tanstack ] && continue   # D1 round: verify.ts only unless TanStack is targeted
  step "typecheck:$a" pnpm typecheck:$a
  step "build:$a" env DB_DIALECT=$R pnpm build:$a
done
echo "DONE $R fails=$FAILS logs=$LOG"; exit $((FAILS>0))
