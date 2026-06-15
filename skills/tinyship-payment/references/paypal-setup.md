# PayPal Setup

## Steps

1. Create a PayPal developer account at [developer.paypal.com](https://developer.paypal.com/)
2. Go to **Dashboard > My Apps & Credentials**
3. Create a new app (or use the default sandbox app)
4. Copy the Client ID and Client Secret
5. Set up webhooks: **Dashboard > Webhooks > Add Webhook**
   - URL: `{your-tunnel-url}/api/payment/webhook/paypal`
   - Events: `CHECKOUT.ORDER.APPROVED`, `BILLING.SUBSCRIPTION.CREATED`,
     `BILLING.SUBSCRIPTION.ACTIVATED`, `BILLING.SUBSCRIPTION.CANCELLED`,
     `PAYMENT.SALE.COMPLETED`
6. Copy the Webhook ID
7. Add to `.env`:

```
PAYPAL_CLIENT_ID="AYxxxxx"
PAYPAL_CLIENT_SECRET="ELxxxxx"
PAYPAL_WEBHOOK_ID="WH-xxxxx"
PAYPAL_SANDBOX="true"
```

## Subscription Plans

For recurring subscriptions with PayPal, you must pre-create the plan
in the PayPal Dashboard:

1. Go to **Dashboard > Subscriptions > Plans**
2. Create a plan with the desired pricing
3. Copy the Plan ID
4. Use it as `paypalPlanId` in `config/payment.ts`

## Production

Set `PAYPAL_SANDBOX="false"` and use live credentials from the PayPal Dashboard.

## Reference

- [PayPal Developer docs](https://developer.paypal.com/docs/)
- TinyShip docs: `docs/user-guide/payment/paypal.md`
