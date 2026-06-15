# Google OAuth Setup

## Steps

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Navigate to **APIs & Services > OAuth consent screen**
   - Choose "External" user type
   - Fill in app name, support email, developer email
   - Add scopes: `email`, `profile`, `openid`
4. Navigate to **APIs & Services > Credentials**
   - Click "Create Credentials" > "OAuth 2.0 Client ID"
   - Application type: "Web application"
   - Add authorized redirect URI: `http://localhost:7001/api/auth/callback/google`
   - For production, also add: `https://yourdomain.com/api/auth/callback/google`
5. Copy Client ID and Client Secret
6. Add to `.env`:

```
GOOGLE_CLIENT_ID="xxxxx.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="GOCSPX-xxxxx"
```

## Production Notes

- Update the redirect URI to your production domain
- Submit the OAuth consent screen for verification if you need more than 100 users
- Consider adding your app's privacy policy and terms of service URLs

## Reference

- [Google OAuth 2.0 documentation](https://developers.google.com/identity/protocols/oauth2)
- TinyShip docs: `docs/user-guide/auth/google.md`
