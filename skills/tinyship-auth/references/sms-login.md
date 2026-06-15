# SMS OTP Login Setup

TinyShip supports two SMS providers: Twilio (global) and Aliyun SMS (China).

## Option A: Twilio (Global)

1. Create account at [twilio.com](https://www.twilio.com/)
2. Get a phone number from the Twilio console
3. Find your Account SID and Auth Token in the dashboard
4. Add to `.env`:

```
TWILIO_ACCOUNT_SID="ACxxxxxxxxxxxxx"
TWILIO_AUTH_TOKEN="your-auth-token"
TWILIO_DEFAULT_FROM="+1234567890"
```

## Option B: Aliyun SMS (China)

1. Enable SMS service in [Aliyun Console](https://dysms.console.aliyun.com/)
2. Create an SMS signature (签名) — requires business verification
3. Create an SMS template (模板) for OTP codes
4. Get AccessKey from Aliyun RAM console
5. Add to `.env`:

```
ALIYUN_ACCESS_KEY_ID="your-key-id"
ALIYUN_ACCESS_KEY_SECRET="your-key-secret"
ALIYUN_SMS_SIGN_NAME="YourSignName"
ALIYUN_SMS_TEMPLATE_CODE="SMS_000000000"
```

Note: The Aliyun AccessKey is shared with other Aliyun services (OSS, etc.).

## SMS Provider Configuration

The SMS provider is configured in `config/sms.ts`. Read this file to understand
the provider selection logic and available options.

## Reference

- TinyShip docs: `docs/user-guide/auth/sms.md`
- `libs/sms/AGENTS.md` — SMS library architecture
