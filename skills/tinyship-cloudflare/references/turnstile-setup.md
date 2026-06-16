# Turnstile Bot Protection Setup

Cloudflare Turnstile is a CAPTCHA alternative that protects login, signup,
and password reset forms from bots.

## 1. Create Turnstile Widget

In the Cloudflare Dashboard:

1. Go to **Turnstile** → **Add Widget**
2. Name: e.g., "TinyShip"
3. Add your domains (e.g., `yourdomain.com`, `localhost`)
4. Widget mode: **Managed** (recommended)
5. Save and copy the **Site Key** and **Secret Key**

## 2. Configure Environment Variables

Add to your `.env` (monorepo root):

```env
TURNSTILE_SECRET_KEY=<your-secret-key>
NEXT_PUBLIC_TURNSTILE_SITE_KEY=<your-site-key>
```

Notes:
- `NEXT_PUBLIC_TURNSTILE_SITE_KEY` is used by Next.js client-side code (the `NEXT_PUBLIC_`
  prefix is required for client exposure). TanStack Start and Nuxt also read this value.
- In development mode, Turnstile automatically falls back to Cloudflare test keys,
  so you don't need real keys for local dev.

## 3. Enable Turnstile in Code

Edit `config/captcha.ts` in the TinyShip project:

```typescript
enabled: true,  // Change from false to true
```

This is a code change. The agent should make this edit.

When `enabled: true`, Turnstile widgets appear on:
- Login form
- Signup form
- Forgot password form
- Phone login form
- Resend verification form

## 4. For Workers Deployment

Add the secret key as a wrangler secret:

```bash
cd apps/tanstack-app
npx wrangler secret put TURNSTILE_SECRET_KEY
```

The site key can go in `wrangler.jsonc` `vars` (it's public):

```jsonc
"vars": {
  "NEXT_PUBLIC_TURNSTILE_SITE_KEY": "<your-site-key>"
}
```

## 5. Verify

1. Start the app: `pnpm dev` (or `pnpm dev:cf`)
2. Navigate to the login page
3. The Turnstile widget should appear before the submit button
4. Complete the challenge and verify login works

In development mode, Turnstile uses test keys that always pass — no real
challenge is shown.

## How It Works

- **Server side**: Better Auth captcha plugin validates the Turnstile token on
  every auth request (`libs/auth/auth.ts`)
- **Client side**: `@marsidev/react-turnstile` (Next/TanStack) or `vue-turnstile`
  (Nuxt) renders the widget in auth forms
- **Dev mode**: Auto-fallback to Cloudflare's always-pass test keys
