#!/usr/bin/env bash
# One acceptance round on a CLEAN clone of the user's project (committed work).
# Needs: git, bash, openssl, Node 22 + pnpm on PATH; PG round: a reachable server.
# usage: DIALECT=<sqlite|pg|d1> SRC=<project git dir> BRANCH=<branch> \
#        [PGURL=postgresql://u:p@host:5432/db] [APPS="next nuxt tanstack"] acceptance.sh
#   APPS default "next". D1 round builds only tanstack. PG round needs PGURL to
#   point at an EMPTY database (the round fails otherwise; drop/create it first).
# Prints "RESULT <round> | <step> | PASS|FAIL"; exits non-zero on any FAIL.
set -uo pipefail
R=${DIALECT:?DIALECT=sqlite|pg|d1} SRC=${SRC:?SRC=project git dir} BR=${BRANCH:?BRANCH=branch}
PGURL=${PGURL:-postgresql://postgres:postgres@localhost:5432/recipe_round}
APPS=${APPS:-next}
# .env must win: drop DB/auth vars inherited from the calling shell
unset DATABASE_URL DB_DIALECT SQLITE_DB_PATH BETTER_AUTH_SECRET BETTER_AUTH_URL APP_BASE_URL
HERE=$(cd "$(dirname "$0")" && pwd)
W=$(mktemp -d)/round-$R; LOG=$W.logs; mkdir -p "$LOG"; FAILS=0
res(){ echo "RESULT $R | $1 | $2"; [ "$2" = FAIL ] && FAILS=$((FAILS+1)); }
if ! { git clone -q "$SRC" "$W" && cd "$W" && git checkout -q "$BR"; }; then res clone FAIL; exit 1; fi
step(){ local n="$1"; shift; if "$@" >"$LOG/$(echo "$n" | tr -c 'a-zA-Z0-9' _).log" 2>&1; then res "$n" PASS; else res "$n" FAIL; fi; }
sed -e "s|__PORT__|7001|g" -e "s|__SECRET__|$(openssl rand -hex 32)|" -e "s|__DIALECT__|$R|" -e "s|__DATABASE_URL__|$PGURL|" \
  "$HERE/round.env.template" > .env
step "pnpm install" pnpm install --frozen-lockfile
case $R in
  sqlite) step "build db" bash -c 'mkdir -p data && pnpm db:push:sqlite && test -s data/local.sqlite' ;;
  pg)     step "pg database is empty" node -e 'const {Client}=require("pg");(async()=>{const c=new Client({connectionString:process.argv[1]});await c.connect();const r=await c.query("select count(*)::int n from information_schema.tables where table_schema=\x27public\x27");await c.end();if(r.rows[0].n)throw new Error("not empty: "+r.rows[0].n+" tables")})().catch(e=>{console.error(e.message);process.exit(1)})' "$PGURL"
          step "build db (db:push)" pnpm db:push ;;
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
  step "build:$a" env DB_DIALECT=$R BUILD_TIME=true pnpm build:$a
done
echo "DONE $R fails=$FAILS logs=$LOG"; exit $((FAILS>0))
