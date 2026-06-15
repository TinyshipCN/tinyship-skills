# Alipay Setup

## Steps

1. Register at [Alipay Open Platform](https://open.alipay.com/)
2. Create a web application
3. Generate RSA key pair (or use the platform's key generation tool)
4. Configure the application's public key in the platform
5. Get the Alipay public key from the platform (different from your app key)
6. Add to `.env`:

```
ALIPAY_APP_ID="2021000000000000"
ALIPAY_APP_PRIVATE_KEY="MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC..."
ALIPAY_PUBLIC_KEY="MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAgatiwfGM3RTw..."
ALIPAY_NOTIFY_URL="https://yourdomain.com/api/payment/webhook/alipay"
ALIPAY_SANDBOX="true"
```

**Key format**: Use pure Base64 strings without PEM headers (`-----BEGIN...-----`).

## Sandbox Testing

Set `ALIPAY_SANDBOX="true"` to use the sandbox environment.

Sandbox docs: https://opendocs.alipay.com/open/00dn7o

In sandbox mode, use the sandbox buyer account credentials provided by
the Alipay Open Platform for test payments.

## Production

Set `ALIPAY_SANDBOX="false"` and update `ALIPAY_NOTIFY_URL` to your production domain.

## Reference

- [Alipay Open Platform](https://opendocs.alipay.com/)
- TinyShip docs: `docs/user-guide/payment/alipay.md`
