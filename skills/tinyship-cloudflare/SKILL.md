---
name: tinyship-cloudflare
description: >-
  One-stop Cloudflare setup for TinyShip: Workers + D1/Hyperdrive + R2 + Email Sending +
  Turnstile. Use when the user asks to "set up cloudflare", "all-in cloudflare", "deploy to
  workers", "configure d1", "configure r2", "cf setup", "cloudflare full stack", or wants
  to use the Cloudflare ecosystem for their TinyShip project.
---

# TinyShip Cloudflare Setup

One-stop wizard to configure the full Cloudflare stack for TinyShip (TanStack Start).

**This is a conversational, step-by-step wizard. You MUST ask the user at each
decision point and wait for their answer before proceeding. NEVER make choices
on the user's behalf.**

> **Scope:** This skill configures TanStack Start (`apps/tanstack-app`) for Cloudflare
> Workers deployment. Next.js and Nuxt.js are designed for Node.js environments and
> do not deploy to Workers. If the user hasn't chosen TanStack Start yet, suggest
> running the `tinyship-setup` skill first.

## Prerequisites

Before starting, verify:

1. **Node.js >= 22.20.0** — run `node -v`
2. **pnpm >= 9.0.0** — run `pnpm -v`
3. **Dependencies installed** — if `node_modules/` is missing, run `pnpm install`
4. **A Cloudflare account** — https://dash.cloudflare.com/sign-up

## Step 1: Wrangler Login

Run the following to authenticate with Cloudflare:

```bash
cd apps/tanstack-app
npx wrangler login
```

This opens a browser for authorization. After success, verify:

```bash
npx wrangler whoami
```

Capture the **Account ID** from the output — it will be reused for R2 and Email.

If the user is already logged in (`wrangler whoami` shows account info), skip this step
and tell the user.

## Step 2: Framework Cleanup

**⛔ STOP — You MUST ask the user before proceeding.**

Since Cloudflare Workers only supports TanStack Start, the Next.js and Nuxt.js apps
are not needed for a Cloudflare-only deployment. Ask the user:

**You've chosen the all-in Cloudflare path, which uses TanStack Start exclusively.
Do you want to remove the Next.js and Nuxt.js apps from the project?**

| Option | Action |
|--------|--------|
| **Yes — clean up** | Remove `apps/next-app` and `apps/nuxt-app`, update workspace config |
| **No — keep them** | Leave them in place (useful if you also plan Node.js deployments) |

### If the user chooses Yes:

Follow the cleanup procedure from the `tinyship-setup` skill:
read and follow [../tinyship-setup/references/framework-cleanup.md](../tinyship-setup/references/framework-cleanup.md)
using **TanStack Start** as the kept framework.

Summary of what to do:
1. `rm -rf apps/next-app apps/nuxt-app`
2. Update `turbo.json` — remove `.nuxt/**`, `.output/**`, `.next/**` from build outputs
3. Update root `package.json` — remove `dev:next`, `build:next`, `dev:nuxt`, `build:nuxt` etc.,
   rename `dev:tanstack` → `dev`, `build:tanstack` → `build`, etc.
4. Update `docker-compose.yml` — remove `next-app` and `nuxt-app` services
5. Update `.github/workflows/ci.yml` — remove build steps for deleted apps
6. Run `pnpm install` to clean up the lockfile

After cleanup, run `pnpm typecheck` and `pnpm build` (which now point to TanStack) to verify.

### If the user chooses No:

Skip this step. The other apps remain in the project but won't be deployed to Workers.

## Step 3: Database — D1 or Hyperdrive

**⛔ STOP — You MUST ask the user before proceeding.**

Present these options and wait for the user's response:

| Option | Database | Best For |
|--------|----------|----------|
| **A** | **Cloudflare D1** (SQLite) | All-in Cloudflare, zero external deps, low cost |
| **B** | **Hyperdrive + PostgreSQL** | Reuse existing PG, high write concurrency, data parity with Next/Nuxt |

Explain the trade-offs:
- **D1**: Fully managed, included in Workers billing, 5-10 GB limit, single-writer constraint
- **Hyperdrive**: Needs an external PostgreSQL, but no storage limits, same DB across all 3 apps

### If the user chooses D1:

Read and follow [references/d1-setup.md](references/d1-setup.md).

### If the user chooses Hyperdrive:

Read and follow [references/hyperdrive-setup.md](references/hyperdrive-setup.md).

**After database is configured, verify locally:**

```bash
cd apps/tanstack-app
pnpm dev:cf
```

Check that the app loads and database-dependent pages work. Tell the user the results.

## Step 4: R2 Storage (Optional)

**⛔ STOP — You MUST ask the user before proceeding.**

Ask: **Do you want to set up Cloudflare R2 for file storage (images, uploads)?**

- **Yes** — read and follow [references/r2-setup.md](references/r2-setup.md)
- **No** — skip (can be configured later)

## Step 5: Email Sending (Optional)

**⛔ STOP — You MUST ask the user before proceeding.**

Ask: **Do you want to use Cloudflare Email Sending for transactional emails
(verification codes, password resets)?**

- **Yes** — read and follow [references/email-setup.md](references/email-setup.md)
- **No** — skip (default is Resend, or configure later)

## Step 6: Turnstile Bot Protection (Optional)

**⛔ STOP — You MUST ask the user before proceeding.**

Ask: **Do you want to enable Cloudflare Turnstile (CAPTCHA) for login/signup protection?**

- **Yes** — read and follow [references/turnstile-setup.md](references/turnstile-setup.md)
- **No** — skip (disabled by default, safe to add later)

## Step 7: Deploy to Workers

**⛔ STOP — You MUST ask the user before proceeding.**

Ask: **Do you want to deploy to Cloudflare Workers now, or just finish the local setup?**

- **Deploy now** — read and follow [references/workers-deploy.md](references/workers-deploy.md)
- **Later** — tell the user they can deploy anytime with `cd apps/tanstack-app && pnpm run deploy:cf`

## Step 8: Summary

After setup is complete, provide a summary of what was configured:

```
✅ Cloudflare Setup Complete
─────────────────────────────
Frameworks: TanStack Start only [Next/Nuxt removed / kept]
Workers:    TanStack Start on Cloudflare Workers
Database:   [D1 / Hyperdrive+PG] — configured and verified
Storage:    [R2 / skipped]
Email:      [Cloudflare Email / skipped]
Turnstile:  [enabled / skipped]
Deployment: [deployed to <url> / ready for deploy]

Next steps:
- Run `cd apps/tanstack-app && pnpm dev:cf` for local CF dev
- Run `cd apps/tanstack-app && pnpm run deploy:cf` to deploy
- Use `npx wrangler tail` to view live logs
```

## Reference Files in TinyShip Repo

When executing this skill, read these files from the user's TinyShip project for context:

- `apps/tanstack-app/wrangler.jsonc` — current Wrangler config
- `apps/tanstack-app/CF-NOTES.md` — known Cloudflare pitfalls
- `apps/tanstack-app/.dev.vars.example` — local dev vars template
- `apps/tanstack-app/vite.config.ts` — CF plugin conditional loading
- `docs/user-guide/deployment/cloudflare-workers.md` — full deployment guide
- `config/storage.ts` — R2 config structure
- `config/email.ts` — Email config structure
- `config/captcha.ts` — Turnstile config structure
- `env.example` — all environment variables
