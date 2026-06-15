# Stripe Setup

## Steps

1. Create account at [stripe.com](https://stripe.com)
2. In the Stripe Dashboard, toggle to **Test mode** (top right)
3. Go to **Developers > API keys**
   - Copy the Publishable key (`pk_test_...`)
   - Copy the Secret key (`sk_test_...`)
4. Add to `.env`:

```
STRIPE_PUBLIC_KEY="pk_test_xxxxx"
STRIPE_SECRET_KEY="sk_test_xxxxx"
```

## Create Products and Prices

1. Go to **Products** in the Stripe Dashboard
2. Create products for each plan (monthly, yearly, etc.)
3. Create a Price for each product
4. Copy the Price ID (`price_...`) for each plan
5. Use these IDs as `stripePriceId` in `config/payment.ts`

## Webhook Setup

1. Go to **Developers > Webhooks**
2. Click "Add endpoint"
3. Set URL to: `{your-tunnel-url}/api/payment/webhook/stripe`
4. Select events: `checkout.session.completed`, `customer.subscription.updated`,
   `customer.subscription.deleted`, `invoice.paid`, `invoice.payment_failed`
5. Copy the Signing secret (`whsec_...`)
6. Add to `.env`:

```
STRIPE_WEBHOOK_SECRET="whsec_xxxxx"
```

**For local dev**: Use Stripe CLI instead:
```bash
stripe listen --forward-to localhost:7001/api/payment/webhook/stripe
```
The CLI will print a webhook secret — use that in `.env`.

## Reference

- [Stripe Docs](https://stripe.com/docs)
- TinyShip docs: `docs/user-guide/payment/stripe.md`
