# WeChat Login Setup

## Prerequisites

- A WeChat Open Platform account (requires Chinese business license)
- A verified web application on the platform

## Steps

1. Register at [WeChat Open Platform](https://open.weixin.qq.com/)
2. Complete developer verification (requires business license)
3. Create a "Website Application" (网站应用)
4. After approval, get the AppID and AppSecret
5. Set the authorized callback domain in the platform settings
6. Add to `.env`:

```
NEXT_PUBLIC_WECHAT_APP_ID="wx_xxxxx"
VITE_WECHAT_APP_ID="wx_xxxxx"
WECHAT_APP_SECRET="xxxxx"
```

Note: Both `NEXT_PUBLIC_WECHAT_APP_ID` and `VITE_WECHAT_APP_ID` are needed
because Next.js and TanStack Start/Nuxt use different env variable conventions
for client-side exposure.

## Testing Notes

- WeChat login requires a publicly accessible URL (cannot test on localhost)
- Use a tunnel service (ngrok, cloudflare tunnel) for local testing
- The QR code scan flow only works on desktop browsers

## Reference

- [WeChat Open Platform docs](https://developers.weixin.qq.com/doc/oplatform/)
- TinyShip docs: `docs/user-guide/auth/wechat.md`
