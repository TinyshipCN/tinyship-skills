# Template Detection — shipeasy vs tinyship-cf

TinyShip has two template repositories. Before running any setup/configuration
steps, detect which one the current project is, and follow the matching column
in the cheat sheet below.

## How to Detect

Check the project root:

| Condition | Template |
|-----------|----------|
| `apps/next-app` or `apps/nuxt-app` exists | **shipeasy** (multi-framework) |
| No `apps/next-app`, and `apps/tanstack-app/wrangler.jsonc` exists | **tinyship-cf** (Cloudflare-only) |

```bash
ls apps/                     # shipeasy: next-app nuxt-app tanstack-app
                             # tinyship-cf: tanstack-app only
ls apps/tanstack-app/wrangler.jsonc
```

## Difference Cheat Sheet

| Item | shipeasy | tinyship-cf |
|------|----------|-------------|
| Env file (local) | Root `.env` (copied from `env.example`) | `apps/tanstack-app/.dev.vars` (copied from `.dev.vars.example`) |
| Non-secret config | `.env` | `wrangler.jsonc` `vars` + `.dev.vars` |
| Frameworks | Next.js / Nuxt.js / TanStack Start (choose one) | TanStack Start only |
| Dev command | `pnpm dev:next` / `dev:nuxt` / `dev:tanstack` | `pnpm dev` (port 7001) |
| Build command | `pnpm build:next` / etc. | `pnpm build` |
| Default database | SQLite (local) or PostgreSQL | Cloudflare D1 (local + remote) |
| DB setup command | `pnpm db:push` / `db:push:sqlite` + `db:seed*` | `npx wrangler d1 migrations apply tinyship-db --local` |
| Deployment | Docker / Vercel / VPS / Cloudflare Workers | Cloudflare Workers only (`pnpm deploy:cf`) |
| AI architecture | Direct provider SDKs (`@ai-sdk/*`), keys in `.env` | AI Gateway + Workers AI binding; third-party keys in Gateway dashboard (BYOK) |
| Runtime | Node.js | Cloudflare Workers (workerd) |

## Rules of Thumb

- When writing env vars: `.env` for shipeasy, `.dev.vars` for tinyship-cf — never mix.
- tinyship-cf has **no framework selection or framework cleanup steps** — skip them.
- For Cloudflare deployment, tinyship-cf is the recommended template; shipeasy's
  Cloudflare support is legacy.
