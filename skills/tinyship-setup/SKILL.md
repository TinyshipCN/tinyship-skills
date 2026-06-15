---
name: tinyship-setup
description: >-
  Walk through initial TinyShip project setup: environment configuration, database,
  framework selection, and optional cleanup of unused frameworks. Use when the user
  asks to "set up tinyship", "get started", "initialize project", "quick start",
  "first run", "remove framework", "delete nuxt/next/tanstack", or "only keep one framework".
---

# TinyShip Setup

Interactive setup wizard for TinyShip SaaS starter projects.

**This is a conversational, step-by-step wizard. You MUST ask the user at each
decision point and wait for their answer before proceeding. NEVER make choices
on the user's behalf.**

## Prerequisites

Before starting, verify:

1. **Node.js >= 22.20.0** — run `node -v` to check (required due to Nuxt 4 oxc-parser native bindings)
2. **pnpm >= 9.0.0** — run `pnpm -v` to check. Install with `npm install -g pnpm` if missing

If prerequisites fail, tell the user what to install and STOP.

## Step 1: Environment Configuration

1. Copy the template: `cp env.example .env`
2. Generate an auth secret: `openssl rand -hex 32`
3. Set the generated secret in `.env` as `BETTER_AUTH_SECRET`

Do NOT configure the database dialect yet — that depends on the user's choice in Step 2.

## Step 2: Choose Database

**⛔ STOP — You MUST ask the user before proceeding.**

Present these options and wait for the user's response:

| Option | Database | Best For |
|--------|----------|----------|
| **A** | **SQLite** | Quickest start, zero setup, local development |
| **B** | **PostgreSQL** | Production use, team collaboration |

### If the user chooses SQLite:

Set in `.env`:
```
DB_DIALECT="sqlite"
```

Then run:
```bash
mkdir -p data
pnpm install
pnpm db:push:sqlite
pnpm db:seed:sqlite
```

> **Important:** The `mkdir -p data` step is required — SQLite needs the `data/`
> directory to exist before the database file can be created.

### If the user chooses PostgreSQL:

**Before asking the user for connection details, auto-detect the local PostgreSQL environment:**

1. Run `pg_isready` to check if PostgreSQL is running locally.
2. If PostgreSQL IS running:
   - Tell the user: "PostgreSQL is already running on your machine."
   - Attempt to create a `tinyship` database automatically:
     ```bash
     # Try common superuser accounts to create the database
     createdb tinyship 2>/dev/null || \
       createdb -U postgres tinyship 2>/dev/null || \
       createdb -U $(whoami) tinyship 2>/dev/null
     ```
   - If database creation succeeds, detect the connection string:
     ```bash
     # Determine the PostgreSQL user and port from pg_isready output or defaults
     # Common patterns:
     #   macOS Homebrew/Postgres.app: user = current OS user, port = 5432
     #   Linux system install: user = postgres, port = 5432
     ```
   - Build the `DATABASE_URL` automatically. Common local patterns:
     - `postgresql://localhost:5432/tinyship` (macOS Postgres.app / Homebrew, peer auth)
     - `postgresql://postgres:postgres@localhost:5432/tinyship` (Linux with password)
     - `postgresql://<os-username>@localhost:5432/tinyship` (macOS with username)
   - Show the detected connection string to the user and ask for confirmation before using it.
   - If database creation fails, tell the user and fall back to asking for manual input.
3. If PostgreSQL is NOT running:
   - Tell the user PostgreSQL is not detected on this machine.
   - Offer these sub-options:
     - **Docker**: Spin up a containerized PostgreSQL (requires Docker running)
     - **Manual**: User provides their own connection string

**Auto-detect succeeded — set in `.env`:**
```
DB_DIALECT="pg"
DATABASE_URL="<the auto-detected or confirmed connection string>"
```

**Docker fallback — run:**
```bash
docker run --name tinyship-db \
  -e POSTGRES_USER=tinyship \
  -e POSTGRES_PASSWORD=tinyship123 \
  -e POSTGRES_DB=tinyship \
  -p 5432:5432 \
  -d postgres:15
```

Set in `.env`:
```
DB_DIALECT="pg"
DATABASE_URL="postgresql://tinyship:tinyship123@localhost:5432/tinyship"
```

**After database is configured (any method), run:**
```bash
pnpm install
pnpm db:push
pnpm db:seed
```

### Seed data creates two test users

- **Admin**: `admin@example.com` / `admin123` (role: admin)
- **User**: `user@example.com` / `user123456` (role: user)

## Step 3: Choose Framework

**⛔ STOP — You MUST ask the user before proceeding.**

Present these options and wait for the user's response:

| Option | Framework | Best For | Dev Command |
|--------|-----------|----------|-------------|
| **A** | **Next.js** | React developers, Vercel deployment, largest ecosystem | `pnpm dev:next` |
| **B** | **Nuxt.js** | Vue developers, convention-over-configuration | `pnpm dev:nuxt` |
| **C** | **TanStack Start** | Lightweight React, Cloudflare Workers edge deployment | `pnpm dev:tanstack` |

After the user chooses, start the selected framework and verify:

1. Run the dev command (e.g., `pnpm dev:next`)
2. Open `http://localhost:7001` — home page should load
3. Check `http://localhost:7001/api/health` — should return a response
4. Try logging in with `admin@example.com` / `admin123`

Tell the user the results of each verification step.

## Step 4: Framework Cleanup (Optional)

**⛔ STOP — You MUST ask the user before proceeding. Do NOT delete anything without explicit confirmation.**

After confirming the app works, ask the user:

> **Your project currently includes all three frameworks (Next.js, Nuxt.js, TanStack Start).
> Would you like to remove the two you're not using to simplify your project?**
>
> - **Yes** — Remove unused frameworks and clean up all related configuration
> - **No** — Keep all three (you can always remove them later)

**Only proceed with cleanup if the user explicitly says yes.**

If yes, read and follow the detailed cleanup procedure in
[references/framework-cleanup.md](references/framework-cleanup.md).

This cleanup will:
- Delete unused `apps/` directories
- Clean up workspace config, build scripts, Docker, and CI
- Remove `libs/react-shared` if only keeping Nuxt (it's React-only)
- Verify the remaining app still builds correctly

## Step 5: Next Steps

After setup is complete, tell the user what they can do next:

1. **Customize branding** — change app name, logo, theme (use `tinyship-brand` skill)
2. **Add authentication** — configure OAuth providers (use `tinyship-auth` skill)
3. **Set up payments** — integrate payment providers (use `tinyship-payment` skill)
4. **Configure AI** — set up AI chat/image/video features (use `tinyship-ai` skill)
5. **Deploy** — deploy to Vercel, Docker, or Cloudflare (use `tinyship-deploy` skill)

## Reference Files in TinyShip Repo

When executing this skill, read these files from the user's TinyShip project for context:

- `env.example` — full list of environment variables with descriptions
- `docs/user-guide/get-started.md` — detailed getting started guide
- `docs/user-guide/database.md` — database configuration details
- `pnpm-workspace.yaml` — workspace structure
- `package.json` — available scripts
