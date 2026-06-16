# Workers Deployment

## 1. Update Production URLs

Edit `apps/tanstack-app/wrangler.jsonc` — update `vars` with your production domain:

```jsonc
"vars": {
  "APP_BASE_URL": "https://yourdomain.com",
  "BETTER_AUTH_URL": "https://yourdomain.com"
}
```

If using a custom domain, configure it in Dashboard → Workers → your worker → Custom Domains.
Otherwise, use the default `*.workers.dev` URL.

## 2. Configure Secrets

Workers do NOT read `.env` files. All sensitive values must be set as secrets:

```bash
cd apps/tanstack-app

# Required
npx wrangler secret put BETTER_AUTH_SECRET

# If using Hyperdrive+PG (fallback connection)
npx wrangler secret put DATABASE_URL

# If using R2
npx wrangler secret put R2_ACCESS_KEY_ID
npx wrangler secret put R2_ACCESS_KEY_SECRET

# If using Cloudflare Email
npx wrangler secret put CLOUDFLARE_API_TOKEN

# If using Turnstile
npx wrangler secret put TURNSTILE_SECRET_KEY

# Payment providers (as needed)
# npx wrangler secret put STRIPE_SECRET_KEY
# npx wrangler secret put STRIPE_WEBHOOK_SECRET

# AI providers (as needed)
# npx wrangler secret put OPENAI_API_KEY
```

**Bulk import alternative:** Create a `.secrets.json` file (do NOT commit to git):

```json
{
  "BETTER_AUTH_SECRET": "...",
  "DATABASE_URL": "...",
  "R2_ACCESS_KEY_ID": "...",
  "R2_ACCESS_KEY_SECRET": "..."
}
```

```bash
npx wrangler secret bulk .secrets.json
```

## 3. Pre-compile Email Templates

If using email sending, compile MJML templates before deployment:

```bash
# From monorepo root
pnpm email:compile
```

MJML cannot run at runtime in Workers — templates must be pre-compiled to HTML.

## 4. Local Preview (Recommended)

Before deploying, do a production-like local test:

```bash
cd apps/tanstack-app
pnpm preview:cf
```

This runs a full build + `wrangler dev`, which closely simulates the production
Workers environment. Verify:

1. Home page loads
2. Login / signup works
3. Database queries succeed
4. Upload works (if R2 configured)
5. No errors in terminal

## 5. Deploy

```bash
cd apps/tanstack-app
pnpm run deploy:cf
```

This executes `CF_DEPLOY=1 vite build && wrangler deploy`. On success, it outputs:

```
https://tinyship-tanstack.<your-subdomain>.workers.dev
```

## 6. Post-Deployment Verification

```bash
# Health check
curl -s -o /dev/null -w "%{http_code}" https://your-worker-url/api/health

# View live logs
cd apps/tanstack-app
npx wrangler tail

# Check deployment history
npx wrangler deployments list

# Rollback if needed
npx wrangler rollback
```

Verify in browser:
- Home page renders correctly
- Login with test credentials works
- Database-dependent features load

## CI/CD (Optional)

### GitHub Actions

Create `.github/workflows/deploy-cf.yml`:

```yaml
name: Deploy to Cloudflare Workers

on:
  push:
    branches: [main]
    paths:
      - 'apps/tanstack-app/**'
      - 'libs/**'
      - 'config/**'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '22'
      - run: npm install -g pnpm
      - run: pnpm install
      - name: Deploy
        working-directory: apps/tanstack-app
        run: pnpm run deploy:cf
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          CLOUDFLARE_ACCOUNT_ID: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
```

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Secrets not available | Workers don't read `.env` — use `wrangler secret put` |
| `Invalid hook call` during SSR | Pin `vite-tsconfig-paths` to v5.1.4 (see CF-NOTES.md) |
| `require is not defined` | Replace `require()` with `import` in all reachable code |
| CPU time limit exceeded | Upgrade to Workers Paid plan ($5/mo) for 30s CPU time |
| Upload size exceeded | Free: 100MB, Paid: 500MB — use R2 direct upload for large files |

## Workers Plan Limits

| Resource | Free | Paid ($5/mo) |
|----------|------|--------------|
| Requests | 100k/day | 10M/mo included |
| CPU time | 10ms | 30s |
| Upload body | 100MB | 500MB |
| Worker size | 3MB | 10MB |
