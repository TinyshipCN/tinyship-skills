# D1 Database Setup

## 1. Create D1 Database

```bash
cd apps/tanstack-app
npx wrangler d1 create tinyship-db
```

Capture the returned `database_id` from the output.

## 2. Configure wrangler.jsonc

Edit `apps/tanstack-app/wrangler.jsonc`:

1. **Set `DB_DIALECT` to `d1`** in the `vars` section
2. **Add the `d1_databases` binding** with the database ID from step 1
3. **Remove or comment out the `hyperdrive` block** — D1 and Hyperdrive should not be active simultaneously

```jsonc
{
  "vars": {
    "DB_DIALECT": "d1",
    "APP_BASE_URL": "http://localhost:7001",
    "BETTER_AUTH_URL": "http://localhost:7001"
  },
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "tinyship-db",
      "database_id": "<paste-your-database-id-here>",
      "migrations_dir": "../../libs/database/drizzle-sqlite"
    }
  ]
  // Remove or comment out any "hyperdrive" block
}
```

**Important:** The `migrations_dir` must point to `../../libs/database/drizzle-sqlite` —
this is where Drizzle generates SQLite/D1 migration files.

## 3. Generate and Apply Migrations

```bash
# From the monorepo root — generate SQLite migration files
pnpm db:generate:sqlite

# From apps/tanstack-app — apply migrations to remote D1
cd apps/tanstack-app
npx wrangler d1 migrations apply tinyship-db

# For local D1 preview environment
npx wrangler d1 migrations apply tinyship-db --local
```

## 4. Seed Data (Optional)

D1 cannot use `pnpm db:seed` directly (the seed script uses `better-sqlite3` which
cannot connect to D1). Two approaches:

### Option A: Register through the app (recommended for production)

Deploy first, then register accounts through the app UI. No pre-seeding needed.

### Option B: Export from local SQLite and import to D1

```bash
# 1. From monorepo root — seed local SQLite
mkdir -p data
pnpm db:push:sqlite
pnpm db:seed:sqlite

# 2. Export INSERT statements
{
  echo "PRAGMA foreign_keys=OFF;"
  sqlite3 data/local.sqlite '.mode insert' '.dump user'     | grep '^INSERT'
  sqlite3 data/local.sqlite '.mode insert' '.dump account'  | grep '^INSERT'
  sqlite3 data/local.sqlite '.mode insert' '.dump blog_post' | grep '^INSERT'
} > data/seed-data.sql

# 3. Import to remote D1
cd apps/tanstack-app
npx wrangler d1 execute tinyship-db --remote --file=../../data/seed-data.sql

# 4. Verify
npx wrangler d1 execute tinyship-db --remote --command "SELECT email, name, role FROM user"
```

## 5. Configure .dev.vars

Copy the template and set required secrets for local CF development:

```bash
cd apps/tanstack-app
cp .dev.vars.example .dev.vars
```

Edit `.dev.vars`:
```
APP_BASE_URL=http://localhost:7001
BETTER_AUTH_URL=http://localhost:7001
BETTER_AUTH_SECRET=<your-auth-secret>
```

When using D1, you do NOT need `DATABASE_URL` in `.dev.vars` — the D1 binding
handles database access automatically.

## 6. Verify Locally

```bash
cd apps/tanstack-app
pnpm dev:cf
```

The app should start on the displayed port. Verify:
1. Home page loads
2. Login works (if data was seeded)
3. Check browser console and terminal for errors

## D1 Limitations

| Limit | Value |
|-------|-------|
| Storage | 5 GB (free) / 10 GB (paid) |
| Max row size | 1 MB |
| Write concurrency | Single writer |
| No JSONB | Use `text` + JSON serialization (already handled) |
| No PG operators | `->`, `->>`, `@>` not available (already handled) |
