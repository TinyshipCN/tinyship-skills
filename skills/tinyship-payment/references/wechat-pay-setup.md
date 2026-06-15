# WeChat Pay Setup

## Prerequisites

- WeChat Pay merchant account (requires Chinese business license)
- API certificates from the WeChat Pay merchant dashboard

## Steps

1. Log in to [WeChat Pay Merchant Dashboard](https://pay.weixin.qq.com/)
2. Go to **Account Center > API Security**
3. Download your API certificates (private key and public key)
4. Get your Merchant ID and API Key
5. Add to `.env`:

```
WECHAT_PAY_APP_ID="wx_xxxxx"
WECHAT_PAY_MCH_ID="1234567890"
WECHAT_PAY_API_KEY="your-32-char-api-key"
WECHAT_PAY_NOTIFY_URL="https://yourdomain.com/api/payment/webhook/wechat"
WECHAT_PAY_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\nMIIEpAI...\n-----END RSA PRIVATE KEY-----"
WECHAT_PAY_PUBLIC_KEY="-----BEGIN CERTIFICATE-----\nMIIEpDC...\n-----END CERTIFICATE-----"
```

**Important**: PEM certificates must use `\n` for line breaks within the env var string.

## Testing Notes

- WeChat Pay has **no sandbox mode** — test with real 0.01 CNY payments
- The payment flow generates a QR code that must be scanned with WeChat
- Webhook URL must be publicly accessible

## Payment Public Key Verification (Optional, Recommended)

WeChat Pay offers a newer public key verification mode:

```
WECHAT_PAY_PAYMENT_PUBLIC_KEY="-----BEGIN PUBLIC KEY-----\n...\n-----END PUBLIC KEY-----"
WECHAT_PAY_PUBLIC_KEY_ID="PUB_KEY_ID_xxxxx"
```

If using this mode, you can omit the certificate-based `WECHAT_PAY_PUBLIC_KEY`.

## Reference

- [WeChat Pay API docs](https://pay.weixin.qq.com/wiki/doc/api/index.html)
- TinyShip docs: `docs/user-guide/payment/wechat.md`
