# GitHub OAuth Setup

## Steps

1. Go to [GitHub Settings > Developer settings > OAuth Apps](https://github.com/settings/developers)
2. Click "New OAuth App"
3. Fill in:
   - **Application name**: Your app name
   - **Homepage URL**: `http://localhost:7001`
   - **Authorization callback URL**: `http://localhost:7001/api/auth/callback/github`
4. Click "Register application"
5. Copy the Client ID
6. Generate a new client secret and copy it
7. Add to `.env`:

```
GITHUB_CLIENT_ID="Ov23xxxxxxxxxx"
GITHUB_CLIENT_SECRET="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
```

## Production Notes

- Create a separate OAuth app for production with your production domain
- Update the callback URL to: `https://yourdomain.com/api/auth/callback/github`
- Consider using a GitHub App instead of OAuth App for more granular permissions

## Reference

- [GitHub OAuth documentation](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps)
- TinyShip docs: `docs/user-guide/auth/github.md`
