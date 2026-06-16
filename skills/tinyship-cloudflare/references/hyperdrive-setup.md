# Hyperdrive + PostgreSQL Setup

Hyperdrive is Cloudflare's database acceleration proxy that enables Workers to connect
to your existing PostgreSQL database via connection pooling and edge caching.

## 1. Prepare PostgreSQL Connection String

You need a PostgreSQL database accessible from the internet. The connection string format:

```
postgresql://user:password@host:5432/dbname
```

Common providers: Supabase, Neon, Railway, AWS RDS, self-hosted with public IP.

**Auto-detect local PostgreSQL:**

Before asking the user for a connection string, check if PostgreSQL is running locally:

```bash
pg_isready 2>/dev/null || \
  /opt/homebrew/opt/postgresql@*/bin/pg_isready 2>/dev/null || \
  /usr/local/opt/postgresql@*/bin/pg_isready 2>/dev/null
```

If running locally, the local connection string can be used for `localConnectionString`
in wrangler config (for local CF dev). The remote Hyperdrive still needs an
internet-accessible PostgreSQL for production deployment.

## 2. Create Hyperdrive Configuration

```bash
cd apps/tanstack-app
npx wrangler hyperdrive create tinyship-db \
  --connection-string="postgresql://user:password@host:5432/dbname"
```

Capture the returned **Hyperdrive ID** from the output.

## 3. Configure wrangler.jsonc

Edit `apps/tanstack-app/wrangler.jsonc`:

1. **Add the `hyperdrive` binding** with the ID from step 2
2. **Set `localConnectionString`** for local CF development (your local PG)
3. **Remove or comment out `d1_databases` block** and `DB_DIALECT` var
4. **Remove `DB_DIALECT` from `vars`** (defaults to `pg`)

```jsonc
{
  "hyperdrive": [
    {
      "binding": "HYPERDRIVE",
      "id": "<your-hyperdrive-id>",
      "localConnectionString": "postgresql://youruser@localhost:5432/tinyship"
    }
  ],
  "vars": {
    "APP_BASE_URL": "http://localhost:7001",
    "BETTER_AUTH_URL": "http://localhost:7001"
  }
  // Remove or comment out "d1_databases" block
  // Remove "DB_DIALECT": "d1" from vars (pg is default)
}
```

**How it works:**
- **Production**: Workers use the Hyperdrive proxy (the `id`) to reach your remote PG
- **Local `pnpm dev:cf`**: Wrangler uses `localConnectionString` to connect directly
  to your local database, avoiding network latency during development
- **Fallback**: If Hyperdrive binding is unavailable, the code falls back to `DATABASE_URL`

## 4. Configure .dev.vars

```bash
cd apps/tanstack-app
cp .dev.vars.example .dev.vars
```

Edit `.dev.vars`:
```
APP_BASE_URL=http://localhost:7001
BETTER_AUTH_URL=http://localhost:7001
BETTER_AUTH_SECRET=<your-auth-secret>
DATABASE_URL=postgresql://youruser@localhost:5432/tinyship
```

The `DATABASE_URL` here serves as a fallback when Hyperdrive is not available.

## 5. Push Schema and Seed

If the database is fresh, push schema and seed from the monorepo root:

```bash
# From monorepo root
pnpm db:push
pnpm db:seed
```

## 6. Verify Locally

```bash
cd apps/tanstack-app
pnpm dev:cf
```

Verify:
1. Home page loads
2. Login with `admin@example.com` / `admin123` works
3. Dashboard shows data from PostgreSQL
4. No `TCP connection` errors in the terminal

## Troubleshooting

| Issue | Fix |
|-------|-----|
| `Cannot read properties of undefined (reading 'connect')` | Hyperdrive not configured; check `wrangler.jsonc` binding |
| Connection timeout in local dev | Verify `localConnectionString` points to a running PG |
| `CF_FORCE_DIRECT_DB=1` | Debug flag to skip Hyperdrive and use `DATABASE_URL` directly |
