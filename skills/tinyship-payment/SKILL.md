---
name: tinyship-payment
description: >-
  Set up payment providers for TinyShip: Stripe, PayPal, WeChat Pay, Alipay,
  Creem, and Dodo Payments. Covers sandbox/test mode, webhook setup, pricing
  plans, and credit system. Use when the user asks to "set up stripe",
  "configure payment", "add wechat pay", "configure alipay", "set up paypal",
  "payment integration", "configure pricing plans", "add billing",
  or "set up credits".
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

## Setup by Provider

Read the relevant reference file for detailed steps:

- [references/stripe-setup.md](references/stripe-setup.md) — Stripe (recommended for global)
- [references/wechat-pay-setup.md](references/wechat-pay-setup.md) — WeChat Pay
- [references/alipay-setup.md](references/alipay-setup.md) — Alipay
- [references/paypal-setup.md](references/paypal-setup.md) — PayPal

For Creem and Dodo Payments, read `docs/user-guide/payment/creem.md` and
`docs/user-guide/payment/dodo.md` from the TinyShip repo.

## Configure Pricing Plans

After setting up a provider, configure plans in `config/payment.ts`:

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

### Plan Types

| Type | `duration.type` | Providers |
|------|----------------|-----------|
| One-time | `one_time` | All |
| Subscription | `recurring` | Stripe, Creem, PayPal, Dodo |
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
    'qwen-turbo': 1.0,
    'gpt-4': 2.0,
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
- `docs/user-guide/payment-testing.md` — testing and webhook debug guide
