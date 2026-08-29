---
name: tinyship-payment
description: >-
  Set up payment providers for TinyShip: Stripe, PayPal, WeChat Pay, Alipay,
  Creem, Dodo Payments, and Waffo Pancake. Covers sandbox/test mode, webhook
  setup, pricing plans (static config or dynamic admin-managed), and credit
  system. Use when the user asks to "set up stripe", "configure payment",
  "add wechat pay", "configure alipay", "set up paypal", "set up waffo",
  "payment integration", "configure pricing plans", "add billing",
  "set up credits", "dynamic pricing", "manage plans in admin",
  or "change price without redeploying".
---

# TinyShip Payment Integration

Guide for setting up payment providers in TinyShip.

## Provider Selection

Ask the user about their target market to recommend providers:

| Market | Recommended | Subscription Support |
|--------|------------|---------------------|
| **China** | WeChat Pay, Alipay | One-time + credits only |
| **Global** | Stripe | Full (one-time, recurring, credits) |
| **Global (easy onboard)** | Creem | Full (one-time, recurring, credits) |
| **Global (alt)** | PayPal | Full (one-time, recurring, credits) |
| **Global (MoR/tax-free)** | Dodo Payments | Full (Merchant of Record) |
| **Global (MoR/tax-free)** | Waffo Pancake | Full (Merchant of Record; no CNY for subscriptions) |

## Setup by Provider

Read the relevant reference file for detailed steps:

- [references/stripe-setup.md](references/stripe-setup.md) — Stripe (recommended for global)
- [references/wechat-pay-setup.md](references/wechat-pay-setup.md) — WeChat Pay
- [references/alipay-setup.md](references/alipay-setup.md) — Alipay
- [references/paypal-setup.md](references/paypal-setup.md) — PayPal

For Creem, Dodo Payments, and Waffo Pancake, read `docs/user-guide/payment/creem.md`,
`docs/user-guide/payment/dodo.md`, and `docs/user-guide/payment/waffo.md` from the
TinyShip repo.

Waffo specifics to keep in mind: API keys are bound to Test or Production at
creation time (no `TEST_MODE` switch), webhook verification uses an RSA public
key (the SDK has Test/Prod keys built in), and each plan needs a `waffoProductId`
(`PROD_xxx`).

## Configure Pricing Plans

After setting up a provider, you can configure plans in two ways:

### Option A: Static Plans (default)

Define plans directly in `config/payment.ts`:

```typescript
plans: {
  monthly: {
    provider: 'stripe',           // must match your configured provider
    id: 'monthly',
    amount: 10,
    currency: 'USD',
    duration: { months: 1, type: 'recurring' },
    stripePriceId: 'price_xxx',   // provider-specific ID (required for Stripe)
    i18n: {
      'en': {
        name: 'Monthly Plan',
        description: 'Full access for one month',
        duration: 'month',
        features: ['All features', 'Priority support']
      },
      'zh-CN': {
        name: '月度订阅',
        description: '一个月完整访问',
        duration: '月',
        features: ['所有功能', '优先支持']
      }
    }
  }
}
```

Plans automatically appear on the `/pricing` page.

### Option B: Dynamic Pricing (admin-managed)

Set `PRICING_MODE="dynamic"` in `.env` to enable. Plans are then stored in the
database and managed via the admin panel at `/admin/pricing` — prices can be
adjusted anytime without code changes or redeployment.

Fresh projects already include the `pricing_plan` table in the schema, so a
normal database init covers it. Projects upgraded from older versions must add
the table first:

```bash
pnpm db:push          # PostgreSQL
pnpm db:push:sqlite   # SQLite / D1
```

Dynamic pricing adds:
- Creating/editing/reordering plans from the admin UI
- Markdown-formatted feature lists
- Strikethrough pricing (original price)
- Locale-based plan visibility
- One-click import of existing static plans into the database

To migrate existing static plans: enable dynamic mode, open `/admin/pricing`,
click "Import from Config", verify each plan's provider IDs, then run a test
payment. Switch back anytime by setting `PRICING_MODE="static"` and restarting —
dynamic plan data is preserved.

See `docs/user-guide/payment/dynamic-pricing.md` in the TinyShip repo for full details.

### Plan Types

| Type | `duration.type` | Providers |
|------|----------------|-----------|
| One-time | `one_time` | All |
| Subscription | `recurring` | Stripe, Creem, PayPal, Dodo, Waffo |
| Credit pack | `credits` | All (set `duration.credits: 100`) |

## Webhook Setup (Local Development)

Payment providers need to send webhooks to your app. For local development:

1. Install a tunnel tool:
```bash
# Option A: ngrok
ngrok http 7001

# Option B: Cloudflare Tunnel
cloudflared tunnel --url http://localhost:7001
```

2. Use the tunnel URL as your webhook endpoint
3. Configure the webhook URL in the provider's dashboard

Webhook endpoints are at: `{BASE_URL}/api/payment/webhook/{provider}`
(e.g., `/api/payment/webhook/stripe`)

## Credit System (Optional)

To enable AI credit consumption, configure `config/credits.ts`:

```typescript
credits: {
  consumptionMode: 'dynamic',          // 'fixed' or 'dynamic'
  fixedChatCost: 10,                   // credits per chat (fixed mode)
  dynamicChatCostPerKiloToken: 1,      // credits per 1K tokens (dynamic mode)
  modelMultipliers: {
    'qwen3.7-flash': 1.0,
    'gpt-5.6-sol': 2.0,
    'default': 1.0
  }
}
```

Add a credit purchase plan alongside subscription plans:

```typescript
credits100: {
  provider: 'stripe',
  id: 'credits100',
  amount: 10,
  currency: 'USD',
  duration: { type: 'credits', credits: 100 },
  stripePriceId: 'price_xxx',
  i18n: { /* ... */ }
}
```

## Verify

1. Start the dev server
2. Visit `/pricing` — plans should display
3. Click a plan and complete a test payment (use sandbox/test mode)
4. Check `/dashboard` — order should appear
5. For subscriptions, verify `/api/subscription/status` returns active status

## Reference Files in TinyShip Repo

- `config/payment.ts` — payment provider and plan configuration
- `config/credits.ts` — credit system configuration
- `libs/payment/AGENTS.md` — payment library architecture
- `libs/credits/AGENTS.md` — credit system architecture
- `docs/user-guide/payment/overview.md` — payment documentation index
- `docs/user-guide/payment/waffo.md` — Waffo Pancake setup (MoR, hosted checkout)
- `docs/user-guide/payment/dynamic-pricing.md` — dynamic pricing admin guide
- `docs/user-guide/payment-testing.md` — testing and webhook debug guide
