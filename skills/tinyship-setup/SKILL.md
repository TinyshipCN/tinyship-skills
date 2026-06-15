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

## Prerequisites

Before starting, verify:

1. **Node.js >= 22.20.0** — run `node -v` to check (required due to Nuxt 4 oxc-parser native bindings)
2. **pnpm >= 9.0.0** — run `pnpm -v` to check. Install with `npm install -g pnpm` if missing

## Step 1: Environment Configuration

1. Copy the template: `cp env.example .env`
2. Open `.env` and configure the **required** variables:

```
APP_BASE_URL=http://localhost:7001

# Database (pick one)
DB_DIALECT="pg"
DATABASE_URL="postgresql://username:password@localhost:5432/tinyship"
# OR for quick start:
# DB_DIALECT="sqlite"

# Auth (required)
BETTER_AUTH_SECRET="<generate with: openssl rand -hex 32>"
BETTER_AUTH_URL="http://localhost:7001"
```

All other variables (OAuth, payment, AI, storage) are optional and can be configured later
using the other TinyShip skills.

## Step 2: Database Setup

Ask the user which database they prefer:

### Option A: SQLite (quickest start, zero setup)

Set in `.env`:
```
DB_DIALECT="sqlite"
```

Then run:
```bash
pnpm install
pnpm db:push:sqlite
pnpm db:seed:sqlite
```

### Option B: PostgreSQL (recommended for production)

**Via Docker (recommended):**
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

Then run:
```bash
pnpm install
pnpm db:push
pnpm db:seed
```

### Seed data creates two test users

- **Admin**: `admin@example.com` / `admin123` (role: admin)
- **User**: `user@example.com` / `user123456` (role: user)

## Step 3: Choose Framework

Ask the user: **Which framework do you want to use?**

| Framework | Best For | Command |
|-----------|----------|---------|
| **Next.js** | React developers, Vercel deployment | `pnpm dev:next` |
| **Nuxt.js** | Vue developers | `pnpm dev:nuxt` |
| **TanStack Start** | Lightweight React, Cloudflare Workers | `pnpm dev:tanstack` |

Start the chosen framework and verify:
1. Open `http://localhost:7001` — home page should load
2. Check `http://localhost:7001/api/health` — should return OK
3. Try logging in with `admin@example.com` / `admin123`

## Step 4: Framework Cleanup (Optional)

After confirming the app works, ask: **Do you want to remove the other two frameworks to simplify your project?**

If yes, read and follow the detailed cleanup procedure in [references/framework-cleanup.md](references/framework-cleanup.md).

This cleanup:
- Deletes unused `apps/` directories
- Cleans up workspace config, build scripts, Docker, and CI
- Removes `libs/react-shared` if only keeping Nuxt
- Verifies the remaining app still builds correctly

## Step 5: Next Steps

After setup is complete, suggest:

1. **Customize branding** — change app name, logo, theme (use `tinyship-brand` skill)
2. **Add authentication** — configure OAuth providers (use `tinyship-auth` skill)
3. **Set up payments** — integrate payment providers (use `tinyship-payment` skill)
4. **Configure AI** — set up AI chat/image/video (use `tinyship-ai` skill)

## Reference Files in TinyShip Repo

When executing this skill, read these files from the user's TinyShip project:

- `env.example` — full list of environment variables with descriptions
- `docs/user-guide/get-started.md` — detailed getting started guide
- `docs/user-guide/database.md` — database configuration details
- `pnpm-workspace.yaml` — workspace structure
- `package.json` — available scripts
