# Cloudflare Email Sending Setup

TinyShip uses Cloudflare's Email Sending REST API for transactional emails
(verification codes, password resets, etc.). This is NOT Email Routing or
Workers email bindings — it's a simple HTTP API that works from any environment.

## 1. Enable Email Sending

In the Cloudflare Dashboard:

1. Go to **Email** → **Email Sending**
2. Add and verify a sending domain (e.g., `yourdomain.com`)
3. Follow the DNS record setup (SPF, DKIM, DMARC)
4. Wait for domain verification to complete

## 2. Create API Token

1. Go to **My Profile** → **API Tokens** → **Create Token**
2. Use **Custom token** with the permission: **Account / Email Routing Addresses: Edit**
   (this also covers Email Sending)
3. Save the token

Or reuse an existing `CLOUDFLARE_API_TOKEN` that has email permissions.

## 3. Configure Environment Variables

Add to your `.env` (monorepo root):

```env
CLOUDFLARE_ACCOUNT_ID=<your-account-id>
CLOUDFLARE_API_TOKEN=<api-token-with-email-permission>
EMAIL_DEFAULT_FROM=noreply@yourdomain.com
```

The `EMAIL_DEFAULT_FROM` must be an address on the domain you verified in step 1.

`CLOUDFLARE_ACCOUNT_ID` is shared with R2 — if already set, no need to add it again.

## 4. Switch Default Email Provider

Edit `config/email.ts` in the TinyShip project:

```typescript
defaultProvider: 'cloudflare',  // Change from 'resend' to 'cloudflare'
```

This is a code change, not just an env var. The agent should make this edit.

## 5. For Workers Deployment

Add email credentials as wrangler secrets:

```bash
cd apps/tanstack-app
npx wrangler secret put CLOUDFLARE_API_TOKEN
npx wrangler secret put EMAIL_DEFAULT_FROM
```

`CLOUDFLARE_ACCOUNT_ID` can go in `wrangler.jsonc` `vars` (not sensitive):

```jsonc
"vars": {
  "CLOUDFLARE_ACCOUNT_ID": "<your-account-id>"
}
```

## 6. Verify

Run the built-in email test:

```bash
pnpm email:test -- verification --to yourname@example.com --provider cloudflare
```

This sends a test verification email using the Cloudflare provider.

## How It Works

The Cloudflare email provider (`libs/email/providers/cloudflare.ts`) sends emails via:

```
POST https://api.cloudflare.com/client/v4/accounts/{accountId}/email/sending/send
```

Email templates are precompiled from MJML to HTML at build time via
`pnpm email:compile`. This is important for Workers — MJML cannot run at
runtime in the Workers environment.

## Troubleshooting

| Issue | Fix |
|-------|-----|
| 403 Forbidden | API token lacks email permission |
| Domain not verified | Complete DNS setup in Dashboard → Email → Email Sending |
| MJML error on Workers | Run `pnpm email:compile` before deploying |
