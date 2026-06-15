# Cloudflare Workers Deployment

Only available for the TanStack Start app. Uses D1 database.

## Prerequisites

- Cloudflare account
- Wrangler CLI: `npm install -g wrangler`
- TanStack Start app selected as your framework

## Steps

1. Login to Cloudflare: `wrangler login`
2. Create a D1 database:
```bash
wrangler d1 create tinyship-db
```
3. Update `apps/tanstack-app/wrangler.jsonc` with the database ID
4. Set environment variables:
```bash
# Copy from .dev.vars.example
cp apps/tanstack-app/.dev.vars.example apps/tanstack-app/.dev.vars
```
5. Push schema to D1:
```bash
# Set DB_DIALECT to d1 for D1 deployment
pnpm db:push:sqlite  # D1 uses SQLite-compatible schema
```
6. Build and deploy:
```bash
cd apps/tanstack-app
CF_DEPLOY=1 pnpm build
wrangler deploy
```

## Known Pitfalls

Read `apps/tanstack-app/CF-NOTES.md` for common issues:

- **Duplicate React instances** from broken dependency pre-bundling
- **`require is not defined`** from CJS imports in Workers ESM runtime
- **Missing `cloudflare:workers` bindings** — ensure wrangler.jsonc is correct
- **D1 binding name** must match what the app expects

## Local Preview

Test the Cloudflare Workers build locally:
```bash
cd apps/tanstack-app
pnpm preview:cf
```

## Reference

- TinyShip docs: `docs/user-guide/deployment/cloudflare-workers.md`
- `apps/tanstack-app/CF-NOTES.md` — Cloudflare-specific pitfalls
- `apps/tanstack-app/wrangler.jsonc` — Wrangler configuration
